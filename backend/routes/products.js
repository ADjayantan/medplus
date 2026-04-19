/* =====================================================
   routes/products.js — Browse & Manage Products
===================================================== */
const express = require('express');
const Product = require('../models/Product');
const { adminMiddleware } = require('../middleware/auth');
const router  = express.Router();

/* GET /api/products — List / search products */
router.get('/', async (req, res) => {
  try {
    const { q, category, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (q) filter.$text = { $search: q };
    if (category && category !== 'all') filter.category = category;

    const skip    = (parseInt(page) - 1) * parseInt(limit);
    const total   = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort(q ? { score: { $meta: 'textScore' } } : { name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

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
