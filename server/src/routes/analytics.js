import express from 'express';
import { pool, isConnectedToMySQL, memoryDb } from '../db.js';

const router = express.Router();

router.get('/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    if (isConnectedToMySQL && pool) {
      // 1. Revenue and bills
      const [bills] = await pool.query(
        'SELECT id, total, created_at, customer_name, customer_phone FROM bills WHERE store_id = ? ORDER BY created_at DESC',
        [storeId]
      );

      let totalRevenue = 0;
      let todaySales = 0;
      let weekSales = 0;

      for (const b of bills) {
        const amt = parseFloat(b.total || 0);
        totalRevenue += amt;
        const bDate = new Date(b.created_at);
        if (bDate >= startOfToday) todaySales += amt;
        if (bDate >= sevenDaysAgo) weekSales += amt;
      }

      // 2. Medicine counts
      const [meds] = await pool.query(
        'SELECT id, stock, expiry_date FROM medicines WHERE store_id = ?',
        [storeId]
      );

      const totalMedicines = meds.length;
      const lowStockMedicines = meds.filter((m) => m.stock < 10).length;
      const expiringSoonMedicines = meds.filter((m) => {
        const exp = new Date(m.expiry_date).toISOString().split('T')[0];
        return exp <= in30Days;
      }).length;

      // 3. Top selling medicines
      const [topRows] = await pool.query(`
        SELECT bi.name, SUM(bi.quantity) as quantity, SUM(bi.subtotal) as revenue
        FROM bill_items bi
        JOIN bills b ON bi.bill_id = b.id
        WHERE b.store_id = ?
        GROUP BY bi.name
        ORDER BY revenue DESC
        LIMIT 5
      `, [storeId]);

      const topMedicines = topRows.map((r) => ({
        name: r.name,
        quantity: parseInt(r.quantity || 0),
        revenue: parseFloat(r.revenue || 0),
      }));

      // 4. Recent bills
      const recentBillsSlice = bills.slice(0, 5);
      const recentBillIds = recentBillsSlice.map((b) => b.id);
      let itemsByBill = {};

      if (recentBillIds.length > 0) {
        const [items] = await pool.query(
          'SELECT bill_id, medicine_id, name, quantity, price, subtotal FROM bill_items WHERE bill_id IN (?)',
          [recentBillIds]
        );
        for (const it of items) {
          if (!itemsByBill[it.bill_id]) itemsByBill[it.bill_id] = [];
          itemsByBill[it.bill_id].push(it);
        }
      }

      const recentBills = recentBillsSlice.map((b) => ({
        id: b.id,
        storeId,
        customerName: b.customer_name || 'Walk-in Customer',
        customerPhone: b.customer_phone || '',
        total: parseFloat(b.total || 0),
        items: itemsByBill[b.id] || [],
        createdAt: b.created_at,
      }));

      return res.json({
        totalRevenue,
        totalBills: bills.length,
        totalMedicines,
        lowStockMedicines,
        expiringSoonMedicines,
        todaySales,
        weekSales,
        topMedicines,
        recentBills,
      });
    } else {
      // Memory db calculation
      const storeMedicines = memoryDb.medicines.filter((m) => m.store_id === storeId);
      const storeBills = memoryDb.bills.filter((b) => b.store_id === storeId);

      let totalRevenue = 0;
      let todaySales = 0;
      let weekSales = 0;
      const salesMap = {};

      for (const b of storeBills) {
        totalRevenue += b.total;
        const bDate = new Date(b.created_at);
        if (bDate >= startOfToday) todaySales += b.total;
        if (bDate >= sevenDaysAgo) weekSales += b.total;

        const items = memoryDb.bill_items.filter((it) => it.bill_id === b.id);
        for (const it of items) {
          if (!salesMap[it.name]) salesMap[it.name] = { name: it.name, quantity: 0, revenue: 0 };
          salesMap[it.name].quantity += it.quantity;
          salesMap[it.name].revenue += it.subtotal;
        }
      }

      const lowStockMedicines = storeMedicines.filter((m) => m.stock < 10).length;
      const expiringSoonMedicines = storeMedicines.filter((m) => m.expiry_date <= in30Days).length;

      const topMedicines = Object.values(salesMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      const recentBills = [...storeBills]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map((b) => ({
          id: b.id,
          storeId,
          customerName: b.customer_name || 'Walk-in Customer',
          customerPhone: b.customer_phone || '',
          total: b.total,
          items: memoryDb.bill_items.filter((it) => it.bill_id === b.id),
          createdAt: b.created_at,
        }));

      return res.json({
        totalRevenue,
        totalBills: storeBills.length,
        totalMedicines: storeMedicines.length,
        lowStockMedicines,
        expiringSoonMedicines,
        todaySales,
        weekSales,
        topMedicines,
        recentBills,
      });
    }
  } catch (err) {
    console.error('Get analytics error:', err);
    res.status(500).json({ success: false, error: 'Failed to compute analytics' });
  }
});

export default router;
