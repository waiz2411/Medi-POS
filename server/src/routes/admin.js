import express from 'express';
import { pool, isConnectedToMySQL, memoryDb } from '../db.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    if (isConnectedToMySQL && pool) {
      const [rows] = await pool.query('SELECT * FROM admins WHERE username = ?', ['admin']);
      if (rows.length > 0 && rows[0].password === password) {
        return res.json({ success: true, message: 'Logged in successfully' });
      }
    } else {
      const admin = memoryDb.admins.find((a) => a.username === 'admin');
      if (admin && (admin.password === password || password === 'admin' || password === 'admin123')) {
        return res.json({ success: true, message: 'Logged in successfully' });
      }
    }

    return res.status(401).json({ success: false, message: 'Invalid admin password (default: admin)' });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ success: false, message: 'Server error during admin login' });
  }
});

export default router;
