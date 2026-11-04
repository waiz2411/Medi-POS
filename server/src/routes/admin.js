import express from 'express';
import { pool, isConnectedToMySQL, memoryDb } from '../db.js';

const router = express.Router();

function formatActivity(row) {
  return {
    id: row.id,
    storeId: row.store_id,
    storeName: row.store_name,
    action: row.action,
    ipAddress: row.ip_address || 'Unknown IP',
    location: row.location || 'Unknown Location',
    device: row.device || 'Desktop',
    browser: row.browser || 'Web Browser',
    status: row.status,
    createdAt: row.created_at,
  };
}

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
      if (admin && admin.password === password) {
        return res.json({ success: true, message: 'Logged in successfully' });
      }
    }

    return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ success: false, message: 'Server error during admin login' });
  }
});

// Admin: Get all store activity logs
router.get('/activities', async (req, res) => {
  try {
    const { storeId, status, limit = 100 } = req.query;
    const maxLimit = Math.min(parseInt(limit, 10) || 100, 300);

    if (isConnectedToMySQL && pool) {
      let query = 'SELECT * FROM store_activity_logs';
      const params = [];
      const conditions = [];

      if (storeId) {
        conditions.push('store_id = ?');
        params.push(storeId);
      }
      if (status) {
        conditions.push('status = ?');
        params.push(status);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY created_at DESC LIMIT ?';
      params.push(maxLimit);

      const [rows] = await pool.query(query, params);
      const activities = rows.map(formatActivity);
      return res.json({ success: true, activities });
    } else {
      let logs = [...(memoryDb.activityLogs || [])];
      if (storeId) {
        logs = logs.filter((l) => l.store_id === storeId);
      }
      if (status) {
        logs = logs.filter((l) => l.status === status);
      }

      logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const activities = logs.slice(0, maxLimit).map(formatActivity);
      return res.json({ success: true, activities });
    }
  } catch (err) {
    console.error('Get activities error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch store activities' });
  }
});

// Admin: Activity stats
router.get('/activities/stats', async (req, res) => {
  try {
    if (isConnectedToMySQL && pool) {
      const [totalRows] = await pool.query('SELECT COUNT(*) as cnt FROM store_activity_logs');
      const [successRows] = await pool.query("SELECT COUNT(*) as cnt FROM store_activity_logs WHERE status = 'success'");
      const [failedRows] = await pool.query("SELECT COUNT(*) as cnt FROM store_activity_logs WHERE status = 'failed'");
      const [blockedRows] = await pool.query("SELECT COUNT(*) as cnt FROM store_activity_logs WHERE status LIKE 'blocked%'");
      const [storesRows] = await pool.query("SELECT COUNT(DISTINCT store_id) as cnt FROM store_activity_logs WHERE created_at >= CURDATE() AND status = 'success'");

      return res.json({
        success: true,
        stats: {
          totalLogins: totalRows[0]?.cnt || 0,
          successfulLogins: successRows[0]?.cnt || 0,
          failedLogins: failedRows[0]?.cnt || 0,
          blockedLogins: blockedRows[0]?.cnt || 0,
          uniqueStoresActiveToday: storesRows[0]?.cnt || 0,
        },
      });
    } else {
      const logs = memoryDb.activityLogs || [];
      const today = new Date().toISOString().split('T')[0];

      const totalLogins = logs.length;
      const successfulLogins = logs.filter((l) => l.status === 'success').length;
      const failedLogins = logs.filter((l) => l.status === 'failed').length;
      const blockedLogins = logs.filter((l) => (l.status || '').startsWith('blocked')).length;
      const activeStoreIdsToday = new Set(
        logs
          .filter((l) => l.status === 'success' && (l.created_at || '').startsWith(today))
          .map((l) => l.store_id)
      );

      return res.json({
        success: true,
        stats: {
          totalLogins,
          successfulLogins,
          failedLogins,
          blockedLogins,
          uniqueStoresActiveToday: activeStoreIdsToday.size,
        },
      });
    }
  } catch (err) {
    console.error('Get activity stats error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch activity stats' });
  }
});

export default router;
