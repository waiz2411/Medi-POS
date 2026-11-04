import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const STRONG_ADMIN_PASS = 'MediPOS#Secure2026!Admin';

const DB_CONFIG = {
  host: process.env.DB_HOST || '82.198.229.98',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'u932536786_waiz24111',
  password: process.env.DB_PASSWORD || '&x3JnTz5*',
  database: process.env.DB_NAME || 'u932536786_Medi_POS',
  multipleStatements: true,
  connectTimeout: 15000,
};

async function seed() {
  console.log('Connecting to Hostinger Remote MySQL at', DB_CONFIG.host, 'as', DB_CONFIG.user, '...');
  let conn;
  try {
    conn = await mysql.createConnection(DB_CONFIG);
    console.log('Connected to Hostinger MySQL successfully!\n');

    // 1. Create Admins Table
    console.log('1. Creating `admins` table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`admins\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`username\` VARCHAR(100) NOT NULL UNIQUE,
        \`password\` VARCHAR(255) NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure strong password for super admin
    await conn.query(`
      INSERT INTO \`admins\` (\`username\`, \`password\`)
      VALUES ('admin', ?)
      ON DUPLICATE KEY UPDATE \`password\` = ?;
    `, [STRONG_ADMIN_PASS, STRONG_ADMIN_PASS]);
    console.log('   -> Super Admin created/updated with strong password.');

    // 2. Create Stores Table
    console.log('2. Creating `stores` table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`stores\` (
        \`id\` VARCHAR(64) PRIMARY KEY,
        \`store_name\` VARCHAR(255) NOT NULL,
        \`owner_name\` VARCHAR(255) NOT NULL,
        \`email\` VARCHAR(255) NOT NULL UNIQUE,
        \`password\` VARCHAR(255) NOT NULL,
        \`phone\` VARCHAR(50) DEFAULT NULL,
        \`address\` TEXT DEFAULT NULL,
        \`status\` ENUM('active', 'inactive', 'pending', 'expired') DEFAULT 'active',
        \`subscription_expiry\` DATE NOT NULL,
        \`monthly_renewal_amount\` DECIMAL(10, 2) DEFAULT 1500.00,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_store_email\` (\`email\`),
        INDEX \`idx_store_status\` (\`status\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const storesData = [
      ['store-demo-01', 'City Care Pharmacy', 'Dr. Sarah Jenkins', 'store@medipos.com', 'password123', '+1 (555) 234-5678', '452 Healthcare Blvd, Suite 101', 'active', 45, 1500.00],
      ['store-demo-02', 'Apollo MedPlus Express', 'Michael Chang', 'apollo@medipos.com', 'password123', '+1 (555) 876-5432', '88 Commercial Ave, Block B', 'active', 5, 1200.00],
      ['store-demo-03', 'Metro Cure Drugs', 'James Wilson', 'metro@medipos.com', 'password123', '+1 (555) 345-9876', '12 Downtown Medical Complex', 'inactive', -10, 1500.00]
    ];

    for (const [id, sName, oName, email, pass, phone, addr, status, days, amount] of storesData) {
      await conn.query(`
        INSERT INTO \`stores\` (\`id\`, \`store_name\`, \`owner_name\`, \`email\`, \`password\`, \`phone\`, \`address\`, \`status\`, \`subscription_expiry\`, \`monthly_renewal_amount\`)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(CURDATE(), INTERVAL ? DAY), ?)
        ON DUPLICATE KEY UPDATE
          \`store_name\` = VALUES(\`store_name\`),
          \`owner_name\` = VALUES(\`owner_name\`),
          \`phone\` = VALUES(\`phone\`),
          \`address\` = VALUES(\`address\`),
          \`status\` = VALUES(\`status\`),
          \`subscription_expiry\` = VALUES(\`subscription_expiry\`),
          \`monthly_renewal_amount\` = VALUES(\`monthly_renewal_amount\`);
      `, [id, sName, oName, email, pass, phone, addr, status, days, amount]);
    }
    console.log('   -> Stores seeded (3 demo stores: active, expiring soon, and expired).');

    // 3. Create Categories Table
    console.log('3. Creating `categories` table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`categories\` (
        \`id\` VARCHAR(64) PRIMARY KEY,
        \`store_id\` VARCHAR(64) DEFAULT NULL,
        \`name\` VARCHAR(100) NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_category_store\` (\`store_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const categories = [
      ['cat-01', 'Tablet'],
      ['cat-02', 'Syrup'],
      ['cat-03', 'Capsule'],
      ['cat-04', 'Injection'],
      ['cat-05', 'Ointment'],
      ['cat-06', 'Drops'],
      ['cat-07', 'Inhaler'],
      ['cat-08', 'Powder'],
      ['cat-09', 'Gel'],
    ];

    for (const [id, name] of categories) {
      await conn.query(`
        INSERT IGNORE INTO \`categories\` (\`id\`, \`store_id\`, \`name\`)
        VALUES (?, NULL, ?);
      `, [id, name]);
    }
    console.log('   -> Categories seeded (9 standard pharmaceutical categories).');

    // 4. Create Medicines Table
    console.log('4. Creating `medicines` table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`medicines\` (
        \`id\` VARCHAR(64) PRIMARY KEY,
        \`store_id\` VARCHAR(64) NOT NULL,
        \`name\` VARCHAR(255) NOT NULL,
        \`category\` VARCHAR(100) NOT NULL,
        \`price\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        \`stock\` INT NOT NULL DEFAULT 0,
        \`expiry_date\` DATE NOT NULL,
        \`description\` TEXT DEFAULT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_med_store\` (\`store_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const medicines = [
      ['med-01', 'store-demo-01', 'Paracetamol 500mg', 'Tablet', 25.00, 150, 365, 'Pain relief and fever reduction tablets'],
      ['med-02', 'store-demo-01', 'Amoxicillin 500mg', 'Capsule', 85.50, 45, 280, 'Broad spectrum antibiotic capsules'],
      ['med-03', 'store-demo-01', 'Cetirizine 10mg', 'Tablet', 35.00, 7, 180, 'Antihistamine for allergy symptoms (Low stock alert)'],
      ['med-04', 'store-demo-01', 'Cough Relief Formula 100ml', 'Syrup', 110.00, 25, 12, 'Non-drowsy cough suppressant oral syrup (Expiring soon)'],
      ['med-05', 'store-demo-01', 'Omeprazole 20mg', 'Capsule', 65.00, 80, 400, 'Acid reducer for heartburn and acid reflux relief'],
      ['med-06', 'store-demo-01', 'Vitamin D3 60,000 IU', 'Capsule', 120.00, 4, 500, 'High potency bone and immunity support (Low stock alert)'],
    ];

    for (const [id, sId, name, cat, price, stock, expiryDays, desc] of medicines) {
      await conn.query(`
        INSERT INTO \`medicines\` (\`id\`, \`store_id\`, \`name\`, \`category\`, \`price\`, \`stock\`, \`expiry_date\`, \`description\`)
        VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(CURDATE(), INTERVAL ? DAY), ?)
        ON DUPLICATE KEY UPDATE
          \`name\` = VALUES(\`name\`),
          \`category\` = VALUES(\`category\`),
          \`price\` = VALUES(\`price\`),
          \`stock\` = VALUES(\`stock\`),
          \`expiry_date\` = VALUES(\`expiry_date\`),
          \`description\` = VALUES(\`description\`);
      `, [id, sId, name, cat, price, stock, expiryDays, desc]);
    }
    console.log('   -> Medicines seeded (6 medicines with stock & expiry dates).');

    // 5. Create Bills Table
    console.log('5. Creating `bills` table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`bills\` (
        \`id\` VARCHAR(64) PRIMARY KEY,
        \`store_id\` VARCHAR(64) NOT NULL,
        \`customer_name\` VARCHAR(255) DEFAULT 'Walk-in Customer',
        \`customer_phone\` VARCHAR(50) DEFAULT NULL,
        \`payment_method\` ENUM('cash', 'card', 'upi') DEFAULT 'cash',
        \`total\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_bill_store\` (\`store_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      INSERT IGNORE INTO \`bills\` (\`id\`, \`store_id\`, \`customer_name\`, \`customer_phone\`, \`payment_method\`, \`total\`, \`created_at\`)
      VALUES ('bill-20261101-001', 'store-demo-01', 'Robert Langdon', '+1 (555) 345-6789', 'cash', 245.50, NOW());
    `);
    console.log('   -> Bills seeded.');

    // 6. Create Bill Items Table
    console.log('6. Creating `bill_items` table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`bill_items\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`bill_id\` VARCHAR(64) NOT NULL,
        \`medicine_id\` VARCHAR(64) DEFAULT NULL,
        \`name\` VARCHAR(255) NOT NULL,
        \`quantity\` INT NOT NULL DEFAULT 1,
        \`price\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        \`subtotal\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        INDEX \`idx_item_bill\` (\`bill_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const [bItemCnt] = await conn.query('SELECT COUNT(*) as cnt FROM \`bill_items\` WHERE \`bill_id\` = "bill-20261101-001"');
    if (bItemCnt[0].cnt === 0) {
      await conn.query(`
        INSERT INTO \`bill_items\` (\`bill_id\`, \`medicine_id\`, \`name\`, \`quantity\`, \`price\`, \`subtotal\`)
        VALUES
          ('bill-20261101-001', 'med-01', 'Paracetamol 500mg', 2, 25.00, 50.00),
          ('bill-20261101-001', 'med-02', 'Amoxicillin 500mg', 1, 85.50, 85.50),
          ('bill-20261101-001', 'med-04', 'Cough Relief Formula 100ml', 1, 110.00, 110.00);
      `);
    }
    console.log('   -> Bill items seeded.');

    // 7. Create Store Activity & Device Security Logs Table
    console.log('7. Creating `store_activity_logs` table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`store_activity_logs\` (
        \`id\` VARCHAR(64) PRIMARY KEY,
        \`store_id\` VARCHAR(64) NOT NULL,
        \`store_name\` VARCHAR(255) NOT NULL,
        \`action\` VARCHAR(50) NOT NULL DEFAULT 'LOGIN',
        \`ip_address\` VARCHAR(64) DEFAULT NULL,
        \`location\` VARCHAR(150) DEFAULT NULL,
        \`device\` VARCHAR(100) DEFAULT NULL,
        \`browser\` VARCHAR(100) DEFAULT NULL,
        \`status\` VARCHAR(50) DEFAULT 'success',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_activity_store\` (\`store_id\`),
        INDEX \`idx_activity_time\` (\`created_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const activities = [
      ['act-demo-1', 'store-demo-01', 'City Care Pharmacy', 'LOGIN', '103.255.4.18', 'New York, US', 'Desktop • Windows 10/11', 'Google Chrome', 'success'],
      ['act-demo-2', 'store-demo-02', 'Apollo MedPlus Express', 'LOGIN', '82.198.229.98', 'Frankfurt, DE', 'Mobile • iOS (iPhone)', 'Apple Safari', 'success'],
      ['act-demo-3', 'store-demo-03', 'Metro Cure Drugs', 'LOGIN', '185.120.77.4', 'London, GB', 'Desktop • macOS', 'Mozilla Firefox', 'blocked_expired'],
    ];

    for (const [id, sId, sName, action, ip, loc, dev, browser, status] of activities) {
      await conn.query(`
        INSERT IGNORE INTO \`store_activity_logs\` (\`id\`, \`store_id\`, \`store_name\`, \`action\`, \`ip_address\`, \`location\`, \`device\`, \`browser\`, \`status\`, \`created_at\`)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW());
      `, [id, sId, sName, action, ip, loc, dev, browser, status]);
    }
    console.log('   -> Activity logs seeded.');

    // 8. Verification
    console.log('\n================ VERIFICATION ================');
    const [tables] = await conn.query('SHOW TABLES;');
    console.log('Tables created in database:', tables.map(t => Object.values(t)[0]));

    for (const t of tables) {
      const tableName = Object.values(t)[0];
      const [countResult] = await conn.query(`SELECT COUNT(*) as cnt FROM \`${tableName}\``);
      console.log(`  Table [${tableName}]: ${countResult[0].cnt} records`);
    }

    const [adminCheck] = await conn.query('SELECT id, username, password, created_at FROM admins');
    console.log('\nSuper Admin User:');
    console.log(adminCheck);

    console.log('\nDATABASE FEED COMPLETED SUCCESSFULLY!');
    await conn.end();
  } catch (err) {
    console.error('Error during database feed:', err);
    if (conn) await conn.end();
    process.exit(1);
  }
}

seed();
