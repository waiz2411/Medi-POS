# MediPOS - Production Medical Store POS & Franchise System

A complete, production-ready Point of Sale, multi-store franchise management, and medicine inventory platform built with **React 19**, **TypeScript**, **Tailwind CSS v4**, **Node.js/Express**, and **MySQL**.

---

## 🚀 Running the Project

### Development (Runs both Backend API & Frontend Client)
```bash
npm run dev
```
- **Frontend App:** [http://localhost:5173](http://localhost:5173)
- **Backend API Server:** [http://localhost:5000](http://localhost:5000)

### Production Build & Launch
```bash
# 1. Build the optimized frontend bundle
npm run build

# 2. Launch the production Node.js server (serves API + static frontend)
npm start
```

---

## 🗄️ MySQL Database Setup & Hosting Deployment

The repository includes a ready-to-import production schema file: [`server/schema.sql`](file:///c:/Users/waizt/OneDrive/Desktop/Websites/Medi-POS/server/schema.sql).

### 1. Import Database Schema
On your MySQL server (via phpMyAdmin, MySQL Workbench, cPanel, or command line):
```bash
mysql -u root -p < server/schema.sql
```

### 2. Configure `.env`
Edit [`.env`](file:///c:/Users/waizt/OneDrive/Desktop/Websites/Medi-POS/.env) with your MySQL credentials:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=medipos_db
VITE_API_URL=/api
```
*(Note: If MySQL credentials are not configured or the service is temporarily offline, the server automatically boots in Fallback Storage Mode so development never breaks).*

---

## 🔑 Default Accounts (Ready to Test)

### 🏥 Store Login
- **Email:** `store@medipos.com`
- **Password:** `password123`
*(Note: Try logging in with `metro@medipos.com` / `password123` to test the automatic expired subscription block!)*

### 🛡️ Super Admin Portal
- **Access:** Click **"Admin Portal"** in the top navigation or click **"MediPOS"** 5 times.
- **Password:** `admin`

---

## ✨ Implemented Features

### 🛒 Store Terminal
1. **POS Billing Terminal**:
   - Customer Name and Phone Number are **100% OPTIONAL** (defaults to "Walk-in Customer").
   - Medicine catalog with live search, stock limit validation, and payment method selector (Cash, Card, UPI).
   - Instant printable invoice popup receipt generator (`window.print()`).
2. **Medicine Inventory**:
   - **Category Dropdown**: Select from existing categories, or choose **"+ Add New Category..."** to create a custom category on the fly.
   - **Filter Pills**: One-click filtering by **"All Medicines"**, **"Low Stock (< 10)"**, **"Expiring Soon (< 30 days)"**, or specific category.
3. **Store Dashboard**:
   - **"+ Create New Bill"** button prominently placed at the top banner to directly jump into billing.
   - Clickable **"Low Stock Items"** and **"Expiring Soon"** cards that jump directly to the filtered medicines page.
   - Sales overview (Today's sales, Week's sales, Top-selling medicines list, Recent transactions).

### 🛡️ Super Admin Control Center
1. **Subscription Expiry & Renewal Tracking**:
   - Set each store's **Subscription Expiry Date** and **Monthly Renewal Amount (Rs)**.
   - **Automatic Account Expiry**: Whenever the subscription date passes, the account automatically changes to `inactive` / `expired`.
   - **Access Denial**: Stores with `inactive`, `pending`, or `expired` status are strictly prohibited from logging in and receive a clear renewal prompt.
2. **Full Administrative Access**:
   - Change store passwords, owner details, contact info, and status (`active`, `inactive`, `pending`).
   - Quick renewal extension buttons: **+30 Days**, **+3 Months**, **+1 Year**.
3. **Admin Dashboard Filtration**:
   - Summary cards: **Total Stores**, **Active Subscriptions**, **Expiring Soon (≤ 15 days)**, **Expired / Inactive**.
   - Filter tabs: Filter store list instantly by Active, Expiring Soon, Expired/Inactive, and Pending.
