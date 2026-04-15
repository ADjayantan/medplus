const express = require('express');
const Product = require('../models/Product');
const router  = express.Router();
const { adminMiddleware } = require('../middleware/auth');
const multer     = require('multer');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

// ── Cloudinary Config ─────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ── Multer (memory storage — file goes to Cloudinary, not disk) ───────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },   // 5 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    if (allowed.test(file.mimetype.split('/')[1])) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpg, png, gif, webp) are allowed'));
    }
  }
});

// ── Helper: upload buffer to Cloudinary ──────────────────────────────────────
function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'medplus/products' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    Readable.from(buffer).pipe(stream);
  });
}

// POST /api/products/upload-image — Admin only
router.post('/upload-image', adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const result   = await uploadToCloudinary(req.file.buffer);
    const imageUrl = result.secure_url;   // permanent Cloudinary URL
    res.json({ imageUrl, message: 'Image uploaded successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Cloudinary upload failed: ' + err.message });
  }
});
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { category, search, inStock, autocomplete, limit } = req.query;
    const filter = {};
    if (category) filter.category = { $regex: `^${category}$`, $options: 'i' };
    if (search) filter.$or = [
      { name:        { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags:        { $regex: search, $options: 'i' } }
    ];
    if (inStock === 'true') filter.stock = true;

    let query = Product.find(filter).sort({ name: 1 });
    if (limit) query = query.limit(parseInt(limit));
    const products = await query;

    if (autocomplete === 'true') {
      return res.json(products.map(p => ({ _id: p._id, name: p.name, category: p.category, image: p.image })));
    }
    res.json({ products, total: products.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/products/categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json({ categories: categories.sort() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/products — Admin only
router.post('/', adminMiddleware, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/products/:id — Admin only
router.put('/:id', adminMiddleware, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/products/:id — Admin only
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product deleted' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
