import express from 'express';
import { pool, isConnectedToMySQL, memoryDb, checkAndUpdateStoreExpiries } from '../db.js';
import { parseUserAgent, getLocationFromIp, recordStoreActivity } from '../utils/activity.js';

const router = express.Router();

// Helper to format store object for frontend
function formatStore(row) {
  const expiry = row.subscription_expiry ? new Date(row.subscription_expiry).toISOString().split('T')[0] : '';
  const today = new Date().toISOString().split('T')[0];
  
  // Dynamic status check
  let currentStatus = row.status;
  if (expiry && expiry < today && currentStatus === 'active') {
    currentStatus = 'inactive';
  }

  const diffTime = expiry ? new Date(expiry).getTime() - new Date(today).getTime() : 0;
  const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    id: row.id,
    storeName: row.store_name,
    ownerName: row.owner_name,
    email: row.email,
    password: row.password,
    phone: row.phone || '',
    address: row.address || '',
    status: currentStatus,
    subscriptionExpiry: expiry,
    monthlyRenewalAmount: parseFloat(row.monthly_renewal_amount || 0),
    daysUntilExpiry,
    isExpiringSoon: daysUntilExpiry >= 0 && daysUntilExpiry <= 15,
    isExpired: daysUntilExpiry < 0 || currentStatus === 'inactive' || currentStatus === 'expired',
    createdAt: row.created_at,
  };
}

// Store Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    // Extract device, IP, and location
    const ipHeader = req.headers['x-forwarded-for'];
    const ip = (typeof ipHeader === 'string' ? ipHeader.split(',')[0].trim() : null) || req.socket?.remoteAddress || req.ip || '127.0.0.1';
    const ua = req.headers['user-agent'] || '';
    const { device, browser } = parseUserAgent(ua);
    const location = await getLocationFromIp(ip);

    checkAndUpdateStoreExpiries();
    const today = new Date().toISOString().split('T')[0];

    let storeRow = null;

    if (isConnectedToMySQL && pool) {
      const [rows] = await pool.query('SELECT * FROM stores WHERE email = ?', [email.trim().toLowerCase()]);
      if (rows.length > 0) storeRow = rows[0];
    } else {
      storeRow = memoryDb.stores.find((s) => s.email.toLowerCase() === email.trim().toLowerCase());
    }

    if (!storeRow) {
      await recordStoreActivity({
        storeId: 'unregistered',
        storeName: email.trim(),
        action: 'LOGIN_FAILED',
        ip,
        location,
        device,
        browser,
        status: 'failed',
      });
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Verify Password
    if (storeRow.password !== password) {
      await recordStoreActivity({
        storeId: storeRow.id,
        storeName: storeRow.store_name,
        action: 'LOGIN_FAILED',
        ip,
        location,
        device,
        browser,
        status: 'failed',
      });
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const expiry = storeRow.subscription_expiry ? new Date(storeRow.subscription_expiry).toISOString().split('T')[0] : '';
    
    // Auto expire if past expiry date
    if (expiry && expiry < today) {
      if (isConnectedToMySQL && pool) {
        await pool.query("UPDATE stores SET status = 'inactive' WHERE id = ?", [storeRow.id]);
      }
      storeRow.status = 'inactive';

      await recordStoreActivity({
        storeId: storeRow.id,
        storeName: storeRow.store_name,
        action: 'LOGIN_BLOCKED',
        ip,
        location,
        device,
        browser,
        status: 'blocked_expired',
      });

      return res.status(403).json({
        success: false,
        error: `Your store subscription expired on ${expiry}. Please contact the Super Admin for renewal.`,
      });
    }

    // Block if status is inactive, pending, or expired
    if (storeRow.status === 'inactive' || storeRow.status === 'pending' || storeRow.status === 'expired') {
      await recordStoreActivity({
        storeId: storeRow.id,
        storeName: storeRow.store_name,
        action: 'LOGIN_BLOCKED',
        ip,
        location,
        device,
        browser,
        status: storeRow.status === 'pending' ? 'blocked_pending' : 'blocked_inactive',
      });

      return res.status(403).json({
        success: false,
        error: `Store account is currently ${storeRow.status.toUpperCase()}. Access denied. Please contact the Super Admin.`,
      });
    }

    // Success login
    await recordStoreActivity({
      storeId: storeRow.id,
      storeName: storeRow.store_name,
      action: 'LOGIN',
      ip,
      location,
      device,
      browser,
      status: 'success',
    });

    const formatted = formatStore(storeRow);
    return res.json({ success: true, store: formatted });
  } catch (err) {
    console.error('Store login error:', err);
    res.status(500).json({ success: false, error: 'Server error during store login' });
  }
});

// Admin: Get all stores
router.get('/all', async (req, res) => {
  try {
    checkAndUpdateStoreExpiries();

    if (isConnectedToMySQL && pool) {
      const [rows] = await pool.query('SELECT * FROM stores ORDER BY created_at DESC');
      const stores = rows.map(formatStore);
      return res.json({ success: true, stores });
    } else {
      const stores = memoryDb.stores.map(formatStore);
      return res.json({ success: true, stores });
    }
  } catch (err) {
    console.error('Get stores error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch stores' });
  }
});

// Admin: Create new store
router.post('/create', async (req, res) => {
  try {
    const {
      storeName,
      ownerName,
      email,
      password,
      phone,
      address,
      status = 'active',
      subscriptionExpiry,
      monthlyRenewalAmount = 0,
    } = req.body;

    if (!storeName || !ownerName || !email || !password) {
      return res.status(400).json({ success: false, error: 'Store name, owner, email, and password are required' });
    }

    const id = `store-${Date.now()}`;
    // Default subscription expiry to 30 days from now if not provided
    const defaultExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const finalExpiry = subscriptionExpiry || defaultExpiry;

    if (isConnectedToMySQL && pool) {
      const [existing] = await pool.query('SELECT id FROM stores WHERE email = ?', [email.trim().toLowerCase()]);
      if (existing.length > 0) {
        return res.status(400).json({ success: false, error: 'A store with this email already exists' });
      }

      await pool.query(`
        INSERT INTO stores (id, store_name, owner_name, email, password, phone, address, status, subscription_expiry, monthly_renewal_amount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [id, storeName, ownerName, email.trim().toLowerCase(), password, phone || '', address || '', status, finalExpiry, parseFloat(monthlyRenewalAmount) || 0]);

      const [rows] = await pool.query('SELECT * FROM stores WHERE id = ?', [id]);
      return res.json({ success: true, store: formatStore(rows[0]) });
    } else {
      if (memoryDb.stores.some((s) => s.email.toLowerCase() === email.trim().toLowerCase())) {
        return res.status(400).json({ success: false, error: 'A store with this email already exists' });
      }

      const newStore = {
        id,
        store_name: storeName,
        owner_name: ownerName,
        email: email.trim().toLowerCase(),
        password,
        phone: phone || '',
        address: address || '',
        status,
        subscription_expiry: finalExpiry,
        monthly_renewal_amount: parseFloat(monthlyRenewalAmount) || 0,
        created_at: new Date().toISOString(),
      };

      memoryDb.stores.push(newStore);
      return res.json({ success: true, store: formatStore(newStore) });
    }
  } catch (err) {
    console.error('Create store error:', err);
    res.status(500).json({ success: false, error: 'Failed to create store' });
  }
});

// Admin: Update store (can change password, status, subscription expiry, monthly renewal amount, etc.)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      storeName,
      ownerName,
      email,
      password,
      phone,
      address,
      status,
      subscriptionExpiry,
      monthlyRenewalAmount,
    } = req.body;

    if (isConnectedToMySQL && pool) {
      const [rows] = await pool.query('SELECT * FROM stores WHERE id = ?', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Store not found' });
      }

      const existing = rows[0];
      const updatedStoreName = storeName !== undefined ? storeName : existing.store_name;
      const updatedOwnerName = ownerName !== undefined ? ownerName : existing.owner_name;
      const updatedEmail = email !== undefined ? email.trim().toLowerCase() : existing.email;
      const updatedPassword = password !== undefined && password.trim() !== '' ? password : existing.password;
      const updatedPhone = phone !== undefined ? phone : existing.phone;
      const updatedAddress = address !== undefined ? address : existing.address;
      const updatedStatus = status !== undefined ? status : existing.status;
      const updatedExpiry = subscriptionExpiry !== undefined ? subscriptionExpiry : existing.subscription_expiry;
      const updatedRenewal = monthlyRenewalAmount !== undefined ? parseFloat(monthlyRenewalAmount) : existing.monthly_renewal_amount;

      await pool.query(`
        UPDATE stores
        SET store_name = ?, owner_name = ?, email = ?, password = ?, phone = ?, address = ?, status = ?, subscription_expiry = ?, monthly_renewal_amount = ?
        WHERE id = ?
      `, [updatedStoreName, updatedOwnerName, updatedEmail, updatedPassword, updatedPhone, updatedAddress, updatedStatus, updatedExpiry, updatedRenewal, id]);

      const [updatedRows] = await pool.query('SELECT * FROM stores WHERE id = ?', [id]);
      return res.json({ success: true, store: formatStore(updatedRows[0]) });
    } else {
      const index = memoryDb.stores.findIndex((s) => s.id === id);
      if (index === -1) {
        return res.status(404).json({ success: false, error: 'Store not found' });
      }

      const existing = memoryDb.stores[index];
      memoryDb.stores[index] = {
        ...existing,
        store_name: storeName !== undefined ? storeName : existing.store_name,
        owner_name: ownerName !== undefined ? ownerName : existing.owner_name,
        email: email !== undefined ? email.trim().toLowerCase() : existing.email,
        password: password !== undefined && password.trim() !== '' ? password : existing.password,
        phone: phone !== undefined ? phone : existing.phone,
        address: address !== undefined ? address : existing.address,
        status: status !== undefined ? status : existing.status,
        subscription_expiry: subscriptionExpiry !== undefined ? subscriptionExpiry : existing.subscription_expiry,
        monthly_renewal_amount: monthlyRenewalAmount !== undefined ? parseFloat(monthlyRenewalAmount) : existing.monthly_renewal_amount,
      };

      return res.json({ success: true, store: formatStore(memoryDb.stores[index]) });
    }
  } catch (err) {
    console.error('Update store error:', err);
    res.status(500).json({ success: false, error: 'Failed to update store' });
  }
});

// Admin: Delete store
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isConnectedToMySQL && pool) {
      await pool.query('DELETE FROM stores WHERE id = ?', [id]);
    } else {
      memoryDb.stores = memoryDb.stores.filter((s) => s.id !== id);
      memoryDb.medicines = memoryDb.medicines.filter((m) => m.store_id !== id);
      memoryDb.bills = memoryDb.bills.filter((b) => b.store_id !== id);
    }

    return res.json({ success: true, message: 'Store deleted successfully' });
  } catch (err) {
    console.error('Delete store error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete store' });
  }
});

export default router;
