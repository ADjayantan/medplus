const express = require('express');
const Order   = require('../models/Order');
const router  = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// POST /api/orders
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { items, total, address, phone, paymentMethod } = req.body;
    if (!items?.length || !total || !address || !phone)
      return res.status(400).json({ message: 'items, total, address and phone are required' });
    const order = await Order.create({
      userId: req.user.id, items, total, address, phone,
      paymentMethod: paymentMethod || 'COD'
    });
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/my
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ orders, total: orders.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders — Admin: all orders
router.get('/', adminMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const safeLimit = Math.min(parseInt(limit) || 50, 200); // max 200 per page
    const filter = {};
    if (status) filter.status = status;
    const skip = (page - 1) * safeLimit;
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('userId', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(safeLimit),
      Order.countDocuments(filter)
    ]);
    res.json({ orders, total, page: Number(page), pages: Math.ceil(total / safeLimit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('userId', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.userId._id.toString() !== req.user.id && !req.user.isAdmin)
      return res.status(403).json({ message: 'Forbidden' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/orders/:id/status — Admin only
router.put('/:id/status', adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!valid.includes(status))
      return res.status(400).json({ message: 'Invalid status value' });
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
