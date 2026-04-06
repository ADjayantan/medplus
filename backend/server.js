 /* =====================================================
   SERVER.JS — MedPlus Pharmacy Backend (Stage 7 Final)
===================================================== */
require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ── Middleware ── */
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

/* ── Database ── */
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medplus';
mongoose.connect(MONGO_URI)
  .then(() => console.log('[OK] MongoDB connected to', MONGO_URI))
  .catch(err => console.error('[ERROR] MongoDB connection failed:', err.message));

/* ── API Routes ── */
app.use('/api',               require('./routes/auth'));
app.use('/api/products',      require('./routes/products'));
app.use('/api/orders',        require('./routes/orders'));
app.use('/api/prescriptions', require('./routes/prescriptions'));
app.use('/api/admin',         require('./routes/admin'));

/* ── Health Check ── */
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));

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
  console.log('[OK] MedPlus server running at http://localhost:' + PORT);
  console.log('[OK] Admin: admin@medplus.com / Admin@123  (run: node seed.js first)');
});

module.exports = app;
