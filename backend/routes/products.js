/* =====================================================
   routes/products.js — Browse & Manage Products
===================================================== */
const express    = require('express');
const Product    = require('../models/Product');
const { adminMiddleware } = require('../middleware/auth');
const router     = express.Router();
const multer     = require('multer');
const cloudinary = require('cloudinary').v2;

/* ── Cloudinary config (reads from .env / Render env vars) ── */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ── Multer: store file in memory before sending to Cloudinary ── */
const storage = multer.memoryStorage();
const upload  = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

/* POST /api/products/upload-image — Admin: upload product thumbnail */
router.post('/upload-image', adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image file provided' });

    /* Upload buffer to Cloudinary */
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'genezenz/products', resource_type: 'image' },
        (err, result) => { if (err) reject(err); else resolve(result); }
      );
      stream.end(req.file.buffer);
    });

    res.json({ imageUrl: result.secure_url });
  } catch (err) {
    console.error('[upload-image]', err.message);
    res.status(500).json({ message: err.message || 'Image upload failed' });
  }
});

/* GET /api/products — List / search products */
router.get('/', async (req, res) => {
  try {
    const { q, category, inStock, sort, page = 1, limit = 20 } = req.query;
    const filter = {};

    // Regex search — works for partial typing ("dol" → "Dolo 650")
    // Falls back gracefully with no index needed
    if (q && q.trim()) {
      const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name:         { $regex: escaped, $options: 'i' } },
        { category:     { $regex: escaped, $options: 'i' } },
        { manufacturer: { $regex: escaped, $options: 'i' } },
        { description:  { $regex: escaped, $options: 'i' } },
        { tags:         { $regex: escaped, $options: 'i' } },
      ];
    }

    if (category && category !== 'all') filter.category = category;
    if (inStock === 'true') filter.stock = { $gt: 0 };

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Product.countDocuments(filter);

    // Sort: when searching, rank name-starts-with higher by pulling them first
    let sortOpt = { name: 1 };
    if (sort === 'price_asc')  sortOpt = { price:  1 };
    if (sort === 'price_desc') sortOpt = { price: -1 };
    if (sort === 'rating')     sortOpt = { rating: -1 };

    const products = await Product.find(filter)
      .sort(sortOpt)
      .skip(skip)
      .limit(parseInt(limit));

    // If searching, re-sort: name starts-with query ranks above name contains
    if (q && q.trim() && products.length > 1) {
      const lower = q.trim().toLowerCase();
      products.sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(lower) ? 0 : 1;
        const bStarts = b.name.toLowerCase().startsWith(lower) ? 0 : 1;
        return aStarts - bStarts || a.name.localeCompare(b.name);
      });
    }

    res.json({ products, total, page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* GET /api/products/:id — Single product */
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* POST /api/products — Admin: add product */
router.post('/', adminMiddleware, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/* PUT /api/products/:id — Admin: update product */
router.put('/:id', adminMiddleware, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/* DELETE /api/products/:id — Admin: delete product */
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* POST /api/products/:id/decrease-stock — Decrease stock when order placed */
router.post('/:id/decrease-stock', async (req, res) => {
  try {
    const { qty = 1 } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.stock < qty) return res.status(400).json({ message: 'Insufficient stock' });
    product.stock = Math.max(0, product.stock - qty);
    await product.save();
    res.json({ stock: product.stock });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
