import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST || '82.198.229.98',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'u932536786_waiz24111',
  password: process.env.DB_PASSWORD || '&x3JnTz5*',
  database: process.env.DB_NAME || 'u932536786_Medi_POS',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 8000,
};

let pool = null;
let isConnectedToMySQL = false;

// In-Memory fallback store if MySQL service is not running locally
const memoryDb = {
  admins: [
    { id: 1, username: 'admin', password: 'MediPOS#Secure2026!Admin' },
  ],
  categories: [
    { id: 'cat-01', store_id: null, name: 'Tablet' },
    { id: 'cat-02', store_id: null, name: 'Syrup' },
    { id: 'cat-03', store_id: null, name: 'Capsule' },
    { id: 'cat-04', store_id: null, name: 'Injection' },
    { id: 'cat-05', store_id: null, name: 'Ointment' },
    { id: 'cat-06', store_id: null, name: 'Drops' },
    { id: 'cat-07', store_id: null, name: 'Inhaler' },
    { id: 'cat-08', store_id: null, name: 'Powder' },
    { id: 'cat-09', store_id: null, name: 'Gel' },
  ],
  stores: [
    {
      id: 'store-demo-01',
      store_name: 'City Care Pharmacy',
      owner_name: 'Dr. Sarah Jenkins',
      email: 'store@medipos.com',
      password: 'password123',
      phone: '+1 (555) 234-5678',
      address: '104 Healthcare Boulevard, Suite A, Metro City',
      status: 'active',
      subscription_expiry: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      monthly_renewal_amount: 1500.0,
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'store-demo-02',
      store_name: 'Apollo MedPlus Express',
      owner_name: 'Vikram Patel',
      email: 'apollo@medipos.com',
      password: 'password123',
      phone: '+1 (555) 876-5432',
      address: '42 Central Station Road, East Wing',
      status: 'active',
      subscription_expiry: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Expiring soon (<7 days)
      monthly_renewal_amount: 1200.0,
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'store-demo-03',
      store_name: 'Metro Cure Drugs',
      owner_name: 'James Wilson',
      email: 'metro@medipos.com',
      password: 'password123',
      phone: '+1 (555) 345-9876',
      address: '12 Downtown Medical Complex',
      status: 'inactive',
      subscription_expiry: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Expired
      monthly_renewal_amount: 1500.0,
      created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  medicines: [
    {
      id: 'med-01',
      store_id: 'store-demo-01',
      name: 'Paracetamol 500mg',
      category: 'Tablet',
      price: 25.0,
      stock: 150,
      expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: 'Pain relief and fever reduction tablets',
      created_at: new Date().toISOString(),
    },
    {
      id: 'med-02',
      store_id: 'store-demo-01',
      name: 'Amoxicillin 500mg',
      category: 'Capsule',
      price: 85.5,
      stock: 45,
      expiry_date: new Date(Date.now() + 280 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: 'Broad spectrum antibiotic capsules',
      created_at: new Date().toISOString(),
    },
    {
      id: 'med-03',
      store_id: 'store-demo-01',
      name: 'Cetirizine 10mg',
      category: 'Tablet',
      price: 35.0,
      stock: 7, // Low Stock (< 10)
      expiry_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: 'Antihistamine for allergy symptoms and hay fever',
      created_at: new Date().toISOString(),
    },
    {
      id: 'med-04',
      store_id: 'store-demo-01',
      name: 'Cough Relief Formula 100ml',
      category: 'Syrup',
      price: 110.0,
      stock: 25,
      expiry_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Expiring Soon (< 30 days)
      description: 'Non-drowsy cough suppressant oral syrup',
      created_at: new Date().toISOString(),
    },
    {
      id: 'med-05',
      store_id: 'store-demo-01',
      name: 'Omeprazole 20mg',
      category: 'Capsule',
      price: 65.0,
      stock: 80,
      expiry_date: new Date(Date.now() + 400 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: 'Acid reducer for heartburn and acid reflux relief',
      created_at: new Date().toISOString(),
    },
    {
      id: 'med-06',
      store_id: 'store-demo-01',
      name: 'Vitamin D3 60,000 IU',
      category: 'Capsule',
      price: 120.0,
      stock: 4, // Low Stock (< 10)
      expiry_date: new Date(Date.now() + 500 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: 'High potency bone and immunity support',
      created_at: new Date().toISOString(),
    },
  ],
  bills: [
    {
      id: 'bill-20261101-001',
      store_id: 'store-demo-01',
      customer_name: 'Robert Langdon',
      customer_phone: '+1 (555) 345-6789',
      payment_method: 'cash',
      total: 245.5,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
  ],
  bill_items: [
    { id: 1, bill_id: 'bill-20261101-001', medicine_id: 'med-01', name: 'Paracetamol 500mg', quantity: 2, price: 25.0, subtotal: 50.0 },
    { id: 2, bill_id: 'bill-20261101-001', medicine_id: 'med-02', name: 'Amoxicillin 500mg', quantity: 1, price: 85.5, subtotal: 85.5 },
    { id: 3, bill_id: 'bill-20261101-001', medicine_id: 'med-04', name: 'Cough Relief Formula 100ml', quantity: 1, price: 110.0, subtotal: 110.0 },
  ],
  activityLogs: [
    {
      id: 'act-demo-1',
      store_id: 'store-demo-01',
      store_name: 'City Care Pharmacy',
      action: 'LOGIN',
      ip_address: '103.255.4.18',
      location: 'New York, US',
      device: 'Desktop • Windows 10/11',
      browser: 'Google Chrome',
      status: 'success',
      created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
    {
      id: 'act-demo-2',
      store_id: 'store-demo-02',
      store_name: 'Apollo MedPlus Express',
      action: 'LOGIN',
      ip_address: '82.198.229.98',
      location: 'Frankfurt, DE',
      device: 'Mobile • iOS (iPhone)',
      browser: 'Apple Safari',
      status: 'success',
      created_at: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    },
    {
      id: 'act-demo-3',
      store_id: 'store-demo-03',
      store_name: 'Metro Cure Drugs',
      action: 'LOGIN',
      ip_address: '185.120.77.4',
      location: 'London, GB',
      device: 'Desktop • macOS',
      browser: 'Mozilla Firefox',
      status: 'blocked_expired',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

// Auto check and update expired stores
export function checkAndUpdateStoreExpiries() {
  const today = new Date().toISOString().split('T')[0];
  if (isConnectedToMySQL && pool) {
    pool.query(`
      UPDATE stores
      SET status = 'expired'
      WHERE subscription_expiry < ? AND status = 'active'
    `, [today]).catch((err) => console.error('Subscription expiry check error:', err));
  } else {
    for (const store of memoryDb.stores) {
      if (store.subscription_expiry < today && store.status === 'active') {
        store.status = 'expired';
      }
    }
  }
}

export async function initDb() {
  try {
    // Connect directly to configured database
    pool = mysql.createPool(DB_CONFIG);
    await pool.query('SELECT 1');

    isConnectedToMySQL = true;
    console.log(`✅ [MySQL] Successfully connected to database '${DB_CONFIG.database}' at ${DB_CONFIG.host}:${DB_CONFIG.port}`);

    // Create tables if not exist
    await createTablesIfNotExist();
    checkAndUpdateStoreExpiries();
  } catch (err) {
    // If database does not exist locally, attempt create
    if (err.code === 'ER_BAD_DB_ERROR') {
      try {
        const rootConn = await mysql.createConnection({
          host: DB_CONFIG.host,
          port: DB_CONFIG.port,
          user: DB_CONFIG.user,
          password: DB_CONFIG.password,
        });
        await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await rootConn.end();
        pool = mysql.createPool(DB_CONFIG);
        await pool.query('SELECT 1');
        isConnectedToMySQL = true;
        console.log(`✅ [MySQL] Created and connected to database '${DB_CONFIG.database}'`);
        await createTablesIfNotExist();
        checkAndUpdateStoreExpiries();
        return;
      } catch (e) {
        // Fall through
      }
    }
    isConnectedToMySQL = false;
    console.warn(`⚠️ [MySQL] Could not connect to MySQL server (${err.message}).`);
    console.log(`ℹ️ [Database] Running in Fallback Storage Mode. Once your MySQL database is active, configure .env to automatically connect.`);
  }
}

async function createTablesIfNotExist() {
  if (!pool) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS stores (
      id VARCHAR(64) PRIMARY KEY,
      store_name VARCHAR(255) NOT NULL,
      owner_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      phone VARCHAR(50) DEFAULT NULL,
      address TEXT DEFAULT NULL,
      status ENUM('active', 'inactive', 'pending', 'expired') DEFAULT 'active',
      subscription_expiry DATE NOT NULL,
      monthly_renewal_amount DECIMAL(10, 2) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_store_email (email),
      INDEX idx_store_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(64) PRIMARY KEY,
      store_id VARCHAR(64) DEFAULT NULL,
      name VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_category_store (store_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS medicines (
      id VARCHAR(64) PRIMARY KEY,
      store_id VARCHAR(64) NOT NULL,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      stock INT NOT NULL DEFAULT 0,
      expiry_date DATE NOT NULL,
      description TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_med_store (store_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS bills (
      id VARCHAR(64) PRIMARY KEY,
      store_id VARCHAR(64) NOT NULL,
      customer_name VARCHAR(255) DEFAULT 'Walk-in Customer',
      customer_phone VARCHAR(50) DEFAULT NULL,
      payment_method ENUM('cash', 'card', 'upi') DEFAULT 'cash',
      total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_bill_store (store_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS bill_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      bill_id VARCHAR(64) NOT NULL,
      medicine_id VARCHAR(64) DEFAULT NULL,
      name VARCHAR(255) NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      INDEX idx_item_bill (bill_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS store_activity_logs (
      id VARCHAR(64) PRIMARY KEY,
      store_id VARCHAR(64) NOT NULL,
      store_name VARCHAR(255) NOT NULL,
      action VARCHAR(50) NOT NULL DEFAULT 'LOGIN',
      ip_address VARCHAR(64) DEFAULT NULL,
      location VARCHAR(150) DEFAULT NULL,
      device VARCHAR(100) DEFAULT NULL,
      browser VARCHAR(100) DEFAULT NULL,
      status VARCHAR(50) DEFAULT 'success',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_activity_store (store_id),
      INDEX idx_activity_time (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Seed default admin if table is empty
  const [admins] = await pool.query('SELECT COUNT(*) as cnt FROM admins');
  if (admins[0].cnt === 0) {
    await pool.query('INSERT INTO admins (username, password) VALUES (?, ?)', ['admin', 'MediPOS#Secure2026!Admin']);
  }

  // Seed default categories if table is empty
  const [cats] = await pool.query('SELECT COUNT(*) as cnt FROM categories');
  if (cats[0].cnt === 0) {
    for (const c of memoryDb.categories) {
      await pool.query('INSERT IGNORE INTO categories (id, store_id, name) VALUES (?, ?, ?)', [c.id, c.store_id, c.name]);
    }
  }

  // Seed demo stores if empty
  const [stores] = await pool.query('SELECT COUNT(*) as cnt FROM stores');
  if (stores[0].cnt === 0) {
    for (const s of memoryDb.stores) {
      await pool.query(`
        INSERT INTO stores (id, store_name, owner_name, email, password, phone, address, status, subscription_expiry, monthly_renewal_amount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [s.id, s.store_name, s.owner_name, s.email, s.password, s.phone, s.address, s.status, s.subscription_expiry, s.monthly_renewal_amount]);
    }
  }

  // Seed medicines if empty
  const [meds] = await pool.query('SELECT COUNT(*) as cnt FROM medicines');
  if (meds[0].cnt === 0) {
    for (const m of memoryDb.medicines) {
      await pool.query(`
        INSERT INTO medicines (id, store_id, name, category, price, stock, expiry_date, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [m.id, m.store_id, m.name, m.category, m.price, m.stock, m.expiry_date, m.description]);
    }
  }

  // Seed initial activities if empty
  const [activities] = await pool.query('SELECT COUNT(*) as cnt FROM store_activity_logs');
  if (activities[0].cnt === 0 && memoryDb.activityLogs) {
    for (const a of memoryDb.activityLogs) {
      await pool.query(
        `INSERT IGNORE INTO store_activity_logs (id, store_id, store_name, action, ip_address, location, device, browser, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [a.id, a.store_id, a.store_name, a.action, a.ip_address, a.location, a.device, a.browser, a.status, a.created_at]
      );
    }
  }
}

export { pool, isConnectedToMySQL, memoryDb };
