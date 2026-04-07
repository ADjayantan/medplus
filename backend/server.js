 /* =====================================================
   SERVER.JS — MedPlus Pharmacy Backend
   FIXED: CORS, MongoDB reconnect, error logging
===================================================== */
require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ── CORS — allow GitHub Pages + localhost ── */
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5500',         // Live Server (VS Code)
  'http://127.0.0.1:5500',
  process.env.FRONTEND_URL || '',  // e.g. https://yourusername.github.io
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (Postman, mobile apps, curl)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    // Also allow any GitHub Pages URL pattern
    if (/^https:\/\/[^.]+\.github\.io$/.test(origin)) return callback(null, true);
    callback(new Error('CORS: origin not allowed → ' + origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

/* ── Middleware ── */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

/* ── Database ── */
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('[ERROR] MONGO_URI is not set in environment variables!');
  console.error('[ERROR] Add MONGO_URI to your Render environment variables.');
  process.exit(1);
}

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 10000,   // 10s timeout
  socketTimeoutMS: 45000,
})
  .then(() => console.log('[OK] MongoDB connected ✓'))
  .catch(err => {
    console.error('[ERROR] MongoDB connection failed:', err.message);
    process.exit(1);
  });

// Auto-reconnect on disconnect
mongoose.connection.on('disconnected', () => {
  console.warn('[WARN] MongoDB disconnected. Attempting to reconnect...');
});
mongoose.connection.on('reconnected', () => {
  console.log('[OK] MongoDB reconnected ✓');
});

/* ── API Routes ── */
app.use('/api',               require('./routes/auth'));
app.use('/api/products',      require('./routes/products'));
app.use('/api/orders',        require('./routes/orders'));
app.use('/api/prescriptions', require('./routes/prescriptions'));
app.use('/api/admin',         require('./routes/admin'));

/* ── Health Check ── */
app.get('/api/health', (_req, res) => res.json({
  status: 'ok',
  time: new Date(),
  db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
}));

/* ── SPA Fallback ── */
app.get('*', (req, res) => {
  const file = req.path;
  if (file.endsWith('.html') || file.endsWith('.css') || file.endsWith('.js')) {
    return res.sendFile(path.join(__dirname, '..', file), err => {
      if (err) res.sendFile(path.join(__dirname, '../index.html'));
    });
  }
  res.sendFile(path.join(__dirname, '../index.html'));
});

/* ── Global Error Handler ── */
app.use((err, _req, res, _next) => {
  console.error('[SERVER ERROR]', err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log('[OK] MedPlus server running on port', PORT);
  console.log('[OK] Admin: admin@medplus.com / Admin@123  (run: node seed.js first)');
});

module.exports = app;
