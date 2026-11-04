-- =====================================================
-- MediPOS Production MySQL Schema & Initial Data
-- Target Database: u932536786_Medi_POS
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Super Admin Table
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `admins` (`id`, `username`, `password`) VALUES
(1, 'admin', 'admin');


-- 2. Medical Stores Table
CREATE TABLE IF NOT EXISTS `stores` (
  `id` VARCHAR(64) PRIMARY KEY,
  `store_name` VARCHAR(255) NOT NULL,
  `owner_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `status` ENUM('active', 'inactive', 'pending', 'expired') DEFAULT 'active',
  `subscription_expiry` DATE NOT NULL,
  `monthly_renewal_amount` DECIMAL(10, 2) DEFAULT 1500.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_store_email` (`email`),
  INDEX `idx_store_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `stores` (`id`, `store_name`, `owner_name`, `email`, `password`, `phone`, `address`, `status`, `subscription_expiry`, `monthly_renewal_amount`) VALUES
('store-demo-01', 'City Care Pharmacy', 'Dr. Sarah Jenkins', 'store@medipos.com', 'password123', '+1 (555) 234-5678', '452 Healthcare Blvd, Suite 101', 'active', DATE_ADD(CURDATE(), INTERVAL 45 DAY), 1500.00),
('store-demo-02', 'Apollo MedPlus Express', 'Michael Chang', 'apollo@medipos.com', 'password123', '+1 (555) 876-5432', '88 Commercial Ave, Block B', 'active', DATE_ADD(CURDATE(), INTERVAL 5 DAY), 1200.00),
('store-demo-03', 'Metro Cure Drugs', 'James Wilson', 'metro@medipos.com', 'password123', '+1 (555) 345-9876', '12 Downtown Medical Complex', 'inactive', DATE_SUB(CURDATE(), INTERVAL 10 DAY), 1500.00);


-- 3. Categories Table
CREATE TABLE IF NOT EXISTS `categories` (
  `id` VARCHAR(64) PRIMARY KEY,
  `store_id` VARCHAR(64) DEFAULT NULL,
  `name` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_category_store` (`store_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `categories` (`id`, `store_id`, `name`) VALUES
('cat-01', NULL, 'Tablet'),
('cat-02', NULL, 'Syrup'),
('cat-03', NULL, 'Capsule'),
('cat-04', NULL, 'Injection'),
('cat-05', NULL, 'Ointment'),
('cat-06', NULL, 'Drops'),
('cat-07', NULL, 'Inhaler'),
('cat-08', NULL, 'Powder'),
('cat-09', NULL, 'Gel');


-- 4. Medicines Table
CREATE TABLE IF NOT EXISTS `medicines` (
  `id` VARCHAR(64) PRIMARY KEY,
  `store_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `stock` INT NOT NULL DEFAULT 0,
  `expiry_date` DATE NOT NULL,
  `description` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_med_store` (`store_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `medicines` (`id`, `store_id`, `name`, `category`, `price`, `stock`, `expiry_date`, `description`) VALUES
('med-01', 'store-demo-01', 'Paracetamol 500mg', 'Tablet', 25.00, 150, DATE_ADD(CURDATE(), INTERVAL 365 DAY), 'Pain relief and fever reduction tablets'),
('med-02', 'store-demo-01', 'Amoxicillin 500mg', 'Capsule', 85.50, 45, DATE_ADD(CURDATE(), INTERVAL 280 DAY), 'Broad spectrum antibiotic capsules'),
('med-03', 'store-demo-01', 'Cetirizine 10mg', 'Tablet', 35.00, 7, DATE_ADD(CURDATE(), INTERVAL 180 DAY), 'Antihistamine for allergy symptoms (Low stock alert)'),
('med-04', 'store-demo-01', 'Cough Relief Formula 100ml', 'Syrup', 110.00, 25, DATE_ADD(CURDATE(), INTERVAL 12 DAY), 'Non-drowsy cough suppressant oral syrup (Expiring soon)'),
('med-05', 'store-demo-01', 'Omeprazole 20mg', 'Capsule', 65.00, 80, DATE_ADD(CURDATE(), INTERVAL 400 DAY), 'Acid reducer for heartburn and acid reflux relief'),
('med-06', 'store-demo-01', 'Vitamin D3 60,000 IU', 'Capsule', 120.00, 4, DATE_ADD(CURDATE(), INTERVAL 500 DAY), 'High potency bone and immunity support (Low stock alert)');


-- 5. Bills Ledger Table
CREATE TABLE IF NOT EXISTS `bills` (
  `id` VARCHAR(64) PRIMARY KEY,
  `store_id` VARCHAR(64) NOT NULL,
  `customer_name` VARCHAR(255) DEFAULT 'Walk-in Customer',
  `customer_phone` VARCHAR(50) DEFAULT NULL,
  `payment_method` ENUM('cash', 'card', 'upi') DEFAULT 'cash',
  `total` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_bill_store` (`store_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `bills` (`id`, `store_id`, `customer_name`, `customer_phone`, `payment_method`, `total`, `created_at`) VALUES
('bill-20261101-001', 'store-demo-01', 'Robert Langdon', '+1 (555) 345-6789', 'cash', 245.50, NOW());


-- 6. Bill Items Breakdown Table
CREATE TABLE IF NOT EXISTS `bill_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `bill_id` VARCHAR(64) NOT NULL,
  `medicine_id` VARCHAR(64) DEFAULT NULL,
  `name` VARCHAR(255) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `subtotal` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  INDEX `idx_item_bill` (`bill_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `bill_items` (`bill_id`, `medicine_id`, `name`, `quantity`, `price`, `subtotal`) VALUES
('bill-20261101-001', 'med-01', 'Paracetamol 500mg', 2, 25.00, 50.00),
('bill-20261101-001', 'med-02', 'Amoxicillin 500mg', 1, 85.50, 85.50),
('bill-20261101-001', 'med-04', 'Cough Relief Formula 100ml', 1, 110.00, 110.00);


-- 7. Store Activity & Device Security Audit Logs Table
CREATE TABLE IF NOT EXISTS `store_activity_logs` (
  `id` VARCHAR(64) PRIMARY KEY,
  `store_id` VARCHAR(64) NOT NULL,
  `store_name` VARCHAR(255) NOT NULL,
  `action` VARCHAR(50) NOT NULL DEFAULT 'LOGIN',
  `ip_address` VARCHAR(64) DEFAULT NULL,
  `location` VARCHAR(150) DEFAULT NULL,
  `device` VARCHAR(100) DEFAULT NULL,
  `browser` VARCHAR(100) DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT 'success',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_activity_store` (`store_id`),
  INDEX `idx_activity_time` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `store_activity_logs` (`id`, `store_id`, `store_name`, `action`, `ip_address`, `location`, `device`, `browser`, `status`, `created_at`) VALUES
('act-demo-1', 'store-demo-01', 'City Care Pharmacy', 'LOGIN', '103.255.4.18', 'New York, US', 'Desktop • Windows 10/11', 'Google Chrome', 'success', DATE_SUB(NOW(), INTERVAL 15 MINUTE)),
('act-demo-2', 'store-demo-02', 'Apollo MedPlus Express', 'LOGIN', '82.198.229.98', 'Frankfurt, DE', 'Mobile • iOS (iPhone)', 'Apple Safari', 'success', DATE_SUB(NOW(), INTERVAL 48 MINUTE)),
('act-demo-3', 'store-demo-03', 'Metro Cure Drugs', 'LOGIN', '185.120.77.4', 'London, GB', 'Desktop • macOS', 'Mozilla Firefox', 'blocked_expired', DATE_SUB(NOW(), INTERVAL 2 HOUR));

SET FOREIGN_KEY_CHECKS = 1;
