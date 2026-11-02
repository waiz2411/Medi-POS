import express from 'express';
import { pool, isConnectedToMySQL, memoryDb } from '../db.js';

const router = express.Router();

// Get bills for a store
router.get('/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;

    if (isConnectedToMySQL && pool) {
      const [bills] = await pool.query(
        'SELECT * FROM bills WHERE store_id = ? ORDER BY created_at DESC',
        [storeId]
      );

      const billIds = bills.map((b) => b.id);
      let itemsByBill = {};

      if (billIds.length > 0) {
        const [items] = await pool.query(
          'SELECT * FROM bill_items WHERE bill_id IN (?)',
          [billIds]
        );
        for (const item of items) {
          if (!itemsByBill[item.bill_id]) itemsByBill[item.bill_id] = [];
          itemsByBill[item.bill_id].push({
            medicineId: item.medicine_id,
            name: item.name,
            quantity: item.quantity,
            price: parseFloat(item.price || 0),
            subtotal: parseFloat(item.subtotal || 0),
          });
        }
      }

      const formatted = bills.map((b) => ({
        id: b.id,
        storeId: b.store_id,
        customerName: b.customer_name || 'Walk-in Customer',
        customerPhone: b.customer_phone || '',
        paymentMethod: b.payment_method,
        total: parseFloat(b.total || 0),
        items: itemsByBill[b.id] || [],
        createdAt: b.created_at,
      }));

      return res.json({ success: true, bills: formatted });
    } else {
      const storeBills = memoryDb.bills
        .filter((b) => b.store_id === storeId)
        .map((b) => {
          const items = memoryDb.bill_items
            .filter((item) => item.bill_id === b.id)
            .map((item) => ({
              medicineId: item.medicine_id,
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.subtotal,
            }));

          return {
            id: b.id,
            storeId: b.store_id,
            customerName: b.customer_name || 'Walk-in Customer',
            customerPhone: b.customer_phone || '',
            paymentMethod: b.payment_method,
            total: b.total,
            items,
            createdAt: b.created_at,
          };
        });

      return res.json({
        success: true,
        bills: storeBills.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      });
    }
  } catch (err) {
    console.error('Get bills error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch bills' });
  }
});

// Create new bill
router.post('/create', async (req, res) => {
  try {
    const { storeId, customerName, customerPhone, items, total, paymentMethod = 'cash' } = req.body;

    if (!storeId) {
      return res.status(400).json({ success: false, error: 'Store ID is required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Please add at least one medicine to the bill' });
    }

    // Customer name and phone are BOTH OPTIONAL
    const finalCustomerName = (customerName && customerName.trim()) ? customerName.trim() : 'Walk-in Customer';
    const finalCustomerPhone = (customerPhone && customerPhone.trim()) ? customerPhone.trim() : '';

    const now = new Date();
    const datePrefix = now.toISOString().slice(0, 10).replace(/-/g, '');
    const billId = `bill-${datePrefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    const finalTotal = parseFloat(total) || items.reduce((sum, item) => sum + (item.subtotal || item.price * item.quantity), 0);

    if (isConnectedToMySQL && pool) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // 1. Insert bill
        await connection.query(`
          INSERT INTO bills (id, store_id, customer_name, customer_phone, payment_method, total, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [billId, storeId, finalCustomerName, finalCustomerPhone, paymentMethod, finalTotal, now]);

        // 2. Insert line items and decrement medicine inventory
        for (const item of items) {
          const itemPrice = parseFloat(item.price) || 0;
          const itemQty = parseInt(item.quantity) || 1;
          const itemSubtotal = parseFloat(item.subtotal) || itemPrice * itemQty;

          await connection.query(`
            INSERT INTO bill_items (bill_id, medicine_id, name, quantity, price, subtotal)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [billId, item.medicineId || null, item.name, itemQty, itemPrice, itemSubtotal]);

          if (item.medicineId) {
            await connection.query(`
              UPDATE medicines
              SET stock = GREATEST(0, stock - ?)
              WHERE id = ? AND store_id = ?
            `, [itemQty, item.medicineId, storeId]);
          }
        }

        await connection.commit();

        const createdBill = {
          id: billId,
          storeId,
          customerName: finalCustomerName,
          customerPhone: finalCustomerPhone,
          paymentMethod,
          total: finalTotal,
          items,
          createdAt: now.toISOString(),
        };

        return res.json({ success: true, bill: createdBill });
      } catch (txErr) {
        await connection.rollback();
        throw txErr;
      } finally {
        connection.release();
      }
    } else {
      // Memory db fallback
      const newBill = {
        id: billId,
        store_id: storeId,
        customer_name: finalCustomerName,
        customer_phone: finalCustomerPhone,
        payment_method: paymentMethod,
        total: finalTotal,
        created_at: now.toISOString(),
      };
      memoryDb.bills.push(newBill);

      for (const item of items) {
        const itemPrice = parseFloat(item.price) || 0;
        const itemQty = parseInt(item.quantity) || 1;
        const itemSubtotal = parseFloat(item.subtotal) || itemPrice * itemQty;

        memoryDb.bill_items.push({
          id: memoryDb.bill_items.length + 1,
          bill_id: billId,
          medicine_id: item.medicineId || null,
          name: item.name,
          quantity: itemQty,
          price: itemPrice,
          subtotal: itemSubtotal,
        });

        // Decrement stock
        if (item.medicineId) {
          const med = memoryDb.medicines.find((m) => m.id === item.medicineId && m.store_id === storeId);
          if (med) {
            med.stock = Math.max(0, med.stock - itemQty);
          }
        }
      }

      const createdBill = {
        id: billId,
        storeId,
        customerName: finalCustomerName,
        customerPhone: finalCustomerPhone,
        paymentMethod,
        total: finalTotal,
        items,
        createdAt: now.toISOString(),
      };

      return res.json({ success: true, bill: createdBill });
    }
  } catch (err) {
    console.error('Create bill error:', err);
    res.status(500).json({ success: false, error: 'Failed to create bill' });
  }
});

export default router;
