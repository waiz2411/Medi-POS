import express from 'express';
import { pool, isConnectedToMySQL, memoryDb } from '../db.js';

const router = express.Router();

const getCategoriesHandler = async (req, res) => {
  try {
    const storeId = req.params.storeId || req.query.storeId;

    if (isConnectedToMySQL && pool) {
      const [rows] = await pool.query(
        'SELECT DISTINCT name FROM categories WHERE store_id IS NULL OR store_id = ? ORDER BY name ASC',
        [storeId || '']
      );
      const categories = rows.map((r) => r.name);
      return res.json({ success: true, categories });
    } else {
      const names = new Set();
      for (const c of memoryDb.categories) {
        if (!c.store_id || c.store_id === storeId) {
          names.add(c.name);
        }
      }
      return res.json({ success: true, categories: Array.from(names).sort() });
    }
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
};

router.get('/', getCategoriesHandler);
router.get('/:storeId', getCategoriesHandler);

// Add new category
router.post('/create', async (req, res) => {
  try {
    const { storeId, name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Category name is required' });
    }

    const trimmedName = name.trim();
    const id = `cat-${Date.now()}`;

    if (isConnectedToMySQL && pool) {
      await pool.query(
        'INSERT IGNORE INTO categories (id, store_id, name) VALUES (?, ?, ?)',
        [id, storeId || null, trimmedName]
      );
      return res.json({ success: true, category: trimmedName });
    } else {
      if (!memoryDb.categories.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase() && c.store_id === (storeId || null))) {
        memoryDb.categories.push({ id, store_id: storeId || null, name: trimmedName });
      }
      return res.json({ success: true, category: trimmedName });
    }
  } catch (err) {
    console.error('Create category error:', err);
    res.status(500).json({ success: false, error: 'Failed to create category' });
  }
});

export default router;
