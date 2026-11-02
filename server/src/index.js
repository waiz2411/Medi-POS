import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, checkAndUpdateStoreExpiries } from './db.js';

import adminRoutes from './routes/admin.js';
import storeRoutes from './routes/stores.js';
import categoryRoutes from './routes/categories.js';
import medicineRoutes from './routes/medicines.js';
import billRoutes from './routes/bills.js';
import analyticsRoutes from './routes/analytics.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/admin', adminRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'MediPOS MySQL API Server',
  });
});

// Serve frontend static build if in production
const distPath = path.resolve(__dirname, '../../dist');
app.use(express.static(distPath));

// Fallback for SPA routing in Express 5
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) next();
    });
  }
  next();
});

// Periodic background check for store subscription expiries (runs every hour)
setInterval(() => {
  checkAndUpdateStoreExpiries();
}, 60 * 60 * 1000);

// Start server
async function startServer() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`🚀 [Server] MediPOS Backend running on http://localhost:${PORT}`);
  });
}

startServer();
