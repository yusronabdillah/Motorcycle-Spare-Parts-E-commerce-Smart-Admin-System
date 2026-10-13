const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// CRITICAL: Load .env BEFORE any module that reads process.env
dotenv.config();

const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');
const paymentRoutes = require('./routes/payment.routes');
const adminRoutes = require('./routes/admin.routes');
const telegramBot = require('./services/telegram.bot'); // Initialize Telegram Bot AFTER dotenv

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// REQUEST LOGGER — logs every incoming request
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[HTTP ${req.method}] ${req.path} — ${new Date().toLocaleString('id-ID')}`);
  }
  next();
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api', (req, res) => {
  res.json({ message: 'MotoSpare API is running', version: '2.0' });
});

// Fallback to frontend for SPA — use regex for Express v5 compat
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
  } else {
    next();
  }
});

app.listen(PORT, () => {
  console.log(`🔧 MotoSpare Server running on http://localhost:${PORT}`);
});
