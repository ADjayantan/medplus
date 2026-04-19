/* =====================================================
   SERVER.JS — Genezenz Pharmacy Backend
===================================================== */
require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ── CORS — only your own origins ── */
// FIX: replaced the wildcard *.github.io regex with an explicit allowlist.
// Add your real GitHub Pages URL to FRONTEND_URL in your .env / Render env vars.
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'https://adjayantan.github.io',   // GitHub Pages deployment
  process.env.FRONTEND_URL || '',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Postman / curl
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
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
// NOTE: /uploads is NOT served statically — prescription files are gated
// behind authentication via GET /api/prescriptions/file/:filename

/* ── Database ── */
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('[ERROR] MONGO_URI is not set in environment variables!');
  process.exit(1);
}

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
})
  .then(() => console.log('[OK] MongoDB connected ✓'))
  .catch(err => {
    console.error('[ERROR] MongoDB connection failed:', err.message);
    process.exit(1);
  });

mongoose.connection.on('disconnected', () => console.warn('[WARN] MongoDB disconnected. Reconnecting...'));
mongoose.connection.on('reconnected',  () => console.log('[OK] MongoDB reconnected ✓'));

/* ── API Routes ── */
app.use('/api',               require('./routes/auth'));
app.use('/api/products',      require('./routes/products'));
app.use('/api/orders',        require('./routes/orders'));
app.use('/api/prescriptions', require('./routes/prescriptions'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/chat',          require('./routes/chat'));   // chatbot proxy
app.use('/api/fda',           require('./routes/fda'));    // FDA proxy

/* ── Health Check ── */
app.get('/api/health', (_req, res) => res.json({
  status: 'ok',
  time:   new Date(),
  db:     mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
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
  // FIX: never leak raw error messages to the client in production
  const isProd = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    message: isProd ? 'Internal Server Error' : (err.message || 'Internal Server Error'),
  });
});

// FIX: removed the line that printed admin credentials on every startup
app.listen(PORT, () => {
  console.log('[OK] Genezenz Pharmacy server running on port', PORT);
});

module.exports = app;
