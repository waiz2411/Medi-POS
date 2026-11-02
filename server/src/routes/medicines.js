import express from 'express';
import { pool, isConnectedToMySQL, memoryDb } from '../db.js';

const router = express.Router();

function formatMedicine(row) {
  const expiry = row.expiry_date ? new Date(row.expiry_date).toISOString().split('T')[0] : '';
  return {
    id: row.id,
    storeId: row.store_id,
    name: row.name,
    category: row.category,
    price: parseFloat(row.price || 0),
    stock: parseInt(row.stock || 0),
    expiryDate: expiry,
    description: row.description || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Get medicines for a store
router.get('/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;

    if (isConnectedToMySQL && pool) {
      const [rows] = await pool.query('SELECT * FROM medicines WHERE store_id = ? ORDER BY name ASC', [storeId]);
      const medicines = rows.map(formatMedicine);
      return res.json({ success: true, medicines });
    } else {
      const medicines = memoryDb.medicines
        .filter((m) => m.store_id === storeId)
        .map(formatMedicine);
      return res.json({ success: true, medicines });
    }
  } catch (err) {
    console.error('Get medicines error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch medicines' });
  }
});

// Add medicine
router.post('/add', async (req, res) => {
  try {
    const { storeId, name, category, price, stock, expiryDate, description } = req.body;

    if (!storeId || !name || !category) {
      return res.status(400).json({ success: false, error: 'Store ID, name, and category are required' });
    }

    const id = `med-${Date.now()}`;
    const parsedPrice = parseFloat(price) || 0;
    const parsedStock = parseInt(stock) || 0;
    const parsedExpiry = expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    if (isConnectedToMySQL && pool) {
      await pool.query(`
        INSERT INTO medicines (id, store_id, name, category, price, stock, expiry_date, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [id, storeId, name, category, parsedPrice, parsedStock, parsedExpiry, description || '']);

      const [rows] = await pool.query('SELECT * FROM medicines WHERE id = ?', [id]);
      return res.json({ success: true, medicine: formatMedicine(rows[0]) });
    } else {
      const newMed = {
        id,
        store_id: storeId,
        name,
        category,
        price: parsedPrice,
        stock: parsedStock,
        expiry_date: parsedExpiry,
        description: description || '',
        created_at: new Date().toISOString(),
      };
      memoryDb.medicines.push(newMed);
      return res.json({ success: true, medicine: formatMedicine(newMed) });
    }
  } catch (err) {
    console.error('Add medicine error:', err);
    res.status(500).json({ success: false, error: 'Failed to add medicine' });
  }
});

// Update medicine
router.put('/:storeId/:id', async (req, res) => {
  try {
    const { storeId, id } = req.params;
    const { name, category, price, stock, expiryDate, description } = req.body;

    const parsedPrice = parseFloat(price) || 0;
    const parsedStock = parseInt(stock) || 0;

    if (isConnectedToMySQL && pool) {
      await pool.query(`
        UPDATE medicines
        SET name = ?, category = ?, price = ?, stock = ?, expiry_date = ?, description = ?
        WHERE id = ? AND store_id = ?
      `, [name, category, parsedPrice, parsedStock, expiryDate, description || '', id, storeId]);

      const [rows] = await pool.query('SELECT * FROM medicines WHERE id = ?', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Medicine not found' });
      }
      return res.json({ success: true, medicine: formatMedicine(rows[0]) });
    } else {
      const index = memoryDb.medicines.findIndex((m) => m.id === id && m.store_id === storeId);
      if (index === -1) {
        return res.status(404).json({ success: false, error: 'Medicine not found' });
      }

      memoryDb.medicines[index] = {
        ...memoryDb.medicines[index],
        name,
        category,
        price: parsedPrice,
        stock: parsedStock,
        expiry_date: expiryDate,
        description: description || '',
        updated_at: new Date().toISOString(),
      };

      return res.json({ success: true, medicine: formatMedicine(memoryDb.medicines[index]) });
    }
  } catch (err) {
    console.error('Update medicine error:', err);
    res.status(500).json({ success: false, error: 'Failed to update medicine' });
  }
});

// Delete medicine
router.delete('/:storeId/:id', async (req, res) => {
  try {
    const { storeId, id } = req.params;

    if (isConnectedToMySQL && pool) {
      await pool.query('DELETE FROM medicines WHERE id = ? AND store_id = ?', [id, storeId]);
    } else {
      memoryDb.medicines = memoryDb.medicines.filter((m) => !(m.id === id && m.store_id === storeId));
    }

    return res.json({ success: true, message: 'Medicine deleted successfully' });
  } catch (err) {
    console.error('Delete medicine error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete medicine' });
  }
});

export default router;
