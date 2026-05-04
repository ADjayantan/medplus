/* =====================================================
   routes/products.js — Browse & Manage Products
   FIXES:
   - Added GET /categories route (was missing → CastError on every page load)
   - Protected decrease-stock with authMiddleware
   - Fixed mass assignment: destructure only allowed fields in create/update
   - Added runValidators: true to findByIdAndUpdate
===================================================== */
const express    = require('express');
const Product    = require('../models/Product');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const router     = express.Router();
const multer     = require('multer');
const cloudinary = require('cloudinary').v2;

/* ── Cloudinary config ── */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ── Multer: memory storage before Cloudinary ── */
const storage = multer.memoryStorage();
const upload  = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

/* POST /api/products/upload-image — Admin: upload product thumbnail */
router.post('/upload-image', adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image file provided' });

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

/* FIX: GET /api/products/categories — must come BEFORE /:id to avoid CastError.
   Without this route, /api/products/categories hit GET /:id with id="categories",
   Mongoose threw a CastError, and the frontend silently fell back to hardcoded data. */
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json({ categories: categories.sort() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* GET /api/products — List / search products */
router.get('/', async (req, res) => {
  try {
    const { q, category, inStock, sort, page = 1, limit = 20 } = req.query;
    const filter = {};

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

    let sortOpt = { name: 1 };
    if (sort === 'price_asc')  sortOpt = { price:  1 };
    if (sort === 'price_desc') sortOpt = { price: -1 };
    if (sort === 'rating')     sortOpt = { rating: -1 };

    const products = await Product.find(filter)
      .sort(sortOpt)
      .skip(skip)
      .limit(parseInt(limit));

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

/* ── Helper: whitelist allowed product fields to prevent mass assignment ── */
function pickProductFields(body) {
  const {
    name, price, mrp, category, description,
    image, stock, requiresPrescription, manufacturer,
    rating, reviews, tags,
  } = body;
  return {
    ...(name         !== undefined && { name:                 String(name).trim()       }),
    ...(price        !== undefined && { price:                Number(price)              }),
    ...(mrp          !== undefined && { mrp:                  Number(mrp)                }),
    ...(category     !== undefined && { category:             String(category).trim()    }),
    ...(description  !== undefined && { description:          String(description)        }),
    ...(image        !== undefined && { image:                String(image)              }),
    ...(stock        !== undefined && { stock:                Number(stock)              }),
    ...(requiresPrescription !== undefined && { requiresPrescription: Boolean(requiresPrescription) }),
    ...(manufacturer !== undefined && { manufacturer:         String(manufacturer)       }),
    ...(rating       !== undefined && { rating:               Number(rating)             }),
    ...(reviews      !== undefined && { reviews:              Number(reviews)            }),
    ...(tags         !== undefined && { tags:                 Array.isArray(tags) ? tags : [] }),
  };
}

/* POST /api/products — Admin: add product */
router.post('/', adminMiddleware, async (req, res) => {
  try {
    /* FIX: Use pickProductFields() instead of passing raw req.body to prevent
       mass assignment (e.g. attacker setting arbitrary DB fields). */
    const product = await Product.create(pickProductFields(req.body));
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/* PUT /api/products/:id — Admin: update product */
router.put('/:id', adminMiddleware, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      pickProductFields(req.body),        // FIX: whitelisted fields only
      { new: true, runValidators: true }  // FIX: run schema validators on update
    );
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

/* POST /api/products/:id/decrease-stock
   FIX: Added authMiddleware — previously unauthenticated callers could drain stock.
   NOTE: Stock is also decremented inside orders.js when orders are placed;
   this route is kept for direct admin/internal use only. */
router.post('/:id/decrease-stock', authMiddleware, async (req, res) => {
  try {
    const qty = Math.max(1, parseInt(req.body.qty) || 1);

    /* Atomic check-and-decrement — prevents race conditions */
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, stock: { $gte: qty } },
      { $inc: { stock: -qty } },
      { new: true }
    );

    if (!product) {
      const existing = await Product.findById(req.params.id);
      if (!existing) return res.status(404).json({ message: 'Product not found' });
      return res.status(400).json({ message: `Insufficient stock (${existing.stock} available)` });
    }

    res.json({ stock: product.stock });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
