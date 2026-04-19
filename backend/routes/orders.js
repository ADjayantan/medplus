/* =====================================================
   routes/orders.js — Place / View / Cancel Orders
===================================================== */
const express = require('express');
const Order   = require('../models/Order');
const Product = require('../models/Product');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const router  = express.Router();

/* POST /api/orders — Place a new order */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { items, total, address, phone, paymentMethod } = req.body;
    if (!items || !items.length || !total || !address || !phone)
      return res.status(400).json({ message: 'items, total, address and phone are required' });

    /* ── Stock validation before placing order ── */
    for (const item of items) {
      if (!item.productId) continue;
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ message: `Product not found: ${item.name}` });
      if (product.stock < (item.qty || 1)) {
        return res.status(400).json({
          message: `"${product.name}" only has ${product.stock} unit(s) left in stock.`
        });
      }
    }

    /* ── Create order ── */
    const order = await Order.create({
      userId: req.user.id,
      items,
      total,
      address,
      phone,
      paymentMethod: paymentMethod || 'COD',
    });

    /* ── Decrease stock for each item ── */
    for (const item of items) {
      if (!item.productId) continue;
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -(item.qty || 1) }
      });
    }

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* GET /api/orders — Get current user's orders */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* GET /api/orders/:id — Get single order */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* PUT /api/orders/:id/cancel — Cancel an order */
router.put('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== 'pending')
      return res.status(400).json({ message: 'Only pending orders can be cancelled' });

    order.status = 'cancelled';
    await order.save();

    /* ── Restore stock on cancellation ── */
    for (const item of order.items) {
      if (!item.productId) continue;
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.qty || 1 }
      });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* GET /api/orders/admin/all — Admin: get all orders */
router.get('/admin/all', adminMiddleware, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).populate('userId', 'name email');
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* PUT /api/orders/admin/:id — Admin: update order status */
router.put('/admin/:id', adminMiddleware, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
