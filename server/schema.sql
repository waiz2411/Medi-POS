-- ========================================================
-- MediPOS - Production MySQL Database Schema
-- Compatible with MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+
-- ========================================================

CREATE DATABASE IF NOT EXISTS `medipos_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `medipos_db`;

-- 1. Super Admins Table
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  `monthly_renewal_amount` DECIMAL(10, 2) DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_store_email` (`email`),
  INDEX `idx_store_status` (`status`),
  INDEX `idx_store_subscription` (`subscription_expiry`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Medicine Categories Table
CREATE TABLE IF NOT EXISTS `categories` (
  `id` VARCHAR(64) PRIMARY KEY,
  `store_id` VARCHAR(64) DEFAULT NULL,
  `name` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_category_store` (`store_id`),
  UNIQUE KEY `uq_store_category` (`store_id`, `name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Medicines / Inventory Table
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
  INDEX `idx_med_store` (`store_id`),
  INDEX `idx_med_name` (`name`),
  INDEX `idx_med_expiry` (`expiry_date`),
  INDEX `idx_med_stock` (`stock`),
  CONSTRAINT `fk_medicines_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Bills Table
CREATE TABLE IF NOT EXISTS `bills` (
  `id` VARCHAR(64) PRIMARY KEY,
  `store_id` VARCHAR(64) NOT NULL,
  `customer_name` VARCHAR(255) DEFAULT 'Walk-in Customer',
  `customer_phone` VARCHAR(50) DEFAULT NULL,
  `payment_method` ENUM('cash', 'card', 'upi') DEFAULT 'cash',
  `total` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_bill_store` (`store_id`),
  INDEX `idx_bill_date` (`created_at`),
  CONSTRAINT `fk_bills_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Bill Line Items Table
CREATE TABLE IF NOT EXISTS `bill_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `bill_id` VARCHAR(64) NOT NULL,
  `medicine_id` VARCHAR(64) DEFAULT NULL,
  `name` VARCHAR(255) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `subtotal` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  INDEX `idx_item_bill` (`bill_id`),
  CONSTRAINT `fk_items_bill` FOREIGN KEY (`bill_id`) REFERENCES `bills` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================
-- Initial Seed Data
-- ========================================================

-- Insert Default Admin (password: admin)
INSERT INTO `admins` (`username`, `password`)
VALUES ('admin', 'admin')
ON DUPLICATE KEY UPDATE `username`=`username`;

-- Insert Global Default Categories
INSERT IGNORE INTO `categories` (`id`, `store_id`, `name`) VALUES
('cat-01', NULL, 'Tablet'),
('cat-02', NULL, 'Syrup'),
('cat-03', NULL, 'Capsule'),
('cat-04', NULL, 'Injection'),
('cat-05', NULL, 'Ointment'),
('cat-06', NULL, 'Drops'),
('cat-07', NULL, 'Inhaler'),
('cat-08', NULL, 'Powder'),
('cat-09', NULL, 'Gel'),
('cat-10', NULL, 'Suppository');

-- Insert Demo Stores
INSERT INTO `stores` (`id`, `store_name`, `owner_name`, `email`, `password`, `phone`, `address`, `status`, `subscription_expiry`, `monthly_renewal_amount`)
VALUES
('store-demo-01', 'City Care Pharmacy', 'Dr. Sarah Jenkins', 'store@medipos.com', 'password123', '+1 (555) 234-5678', '104 Healthcare Boulevard, Suite A, Metro City', 'active', DATE_ADD(CURRENT_DATE, INTERVAL 45 DAY), 1500.00),
('store-demo-02', 'Apollo MedPlus Express', 'Vikram Patel', 'apollo@medipos.com', 'password123', '+1 (555) 876-5432', '42 Central Station Road, East Wing', 'active', DATE_ADD(CURRENT_DATE, INTERVAL 6 DAY), 1200.00),
('store-demo-03', 'Metro Cure Drugs', 'James Wilson', 'metro@medipos.com', 'password123', '+1 (555) 345-9876', '12 Downtown Medical Complex', 'inactive', DATE_SUB(CURRENT_DATE, INTERVAL 10 DAY), 1500.00)
ON DUPLICATE KEY UPDATE `store_name`=`store_name`;

-- Insert Demo Medicines for Store 1
INSERT INTO `medicines` (`id`, `store_id`, `name`, `category`, `price`, `stock`, `expiry_date`, `description`)
VALUES
('med-01', 'store-demo-01', 'Paracetamol 500mg', 'Tablet', 25.00, 150, DATE_ADD(CURRENT_DATE, INTERVAL 365 DAY), 'Pain relief and fever reduction tablets'),
('med-02', 'store-demo-01', 'Amoxicillin 500mg', 'Capsule', 85.50, 45, DATE_ADD(CURRENT_DATE, INTERVAL 280 DAY), 'Broad spectrum antibiotic capsules'),
('med-03', 'store-demo-01', 'Cetirizine 10mg', 'Tablet', 35.00, 7, DATE_ADD(CURRENT_DATE, INTERVAL 180 DAY), 'Antihistamine for allergy symptoms and hay fever'),
('med-04', 'store-demo-01', 'Cough Relief Formula 100ml', 'Syrup', 110.00, 25, DATE_ADD(CURRENT_DATE, INTERVAL 14 DAY), 'Non-drowsy cough suppressant oral syrup'),
('med-05', 'store-demo-01', 'Omeprazole 20mg', 'Capsule', 65.00, 80, DATE_ADD(CURRENT_DATE, INTERVAL 400 DAY), 'Acid reducer for heartburn and acid reflux relief'),
('med-06', 'store-demo-01', 'Vitamin D3 60,000 IU', 'Capsule', 120.00, 5, DATE_ADD(CURRENT_DATE, INTERVAL 500 DAY), 'High potency bone and immunity support'),
('med-07', 'store-demo-01', 'Ibuprofen 400mg', 'Tablet', 45.00, 120, DATE_ADD(CURRENT_DATE, INTERVAL 300 DAY), 'Anti-inflammatory and muscle pain relief'),
('med-08', 'store-demo-01', 'Eye Lubricant Drops 10ml', 'Drops', 90.00, 30, DATE_ADD(CURRENT_DATE, INTERVAL 200 DAY), 'Refreshing eye drops for dry and irritated eyes')
ON DUPLICATE KEY UPDATE `name`=`name`;
