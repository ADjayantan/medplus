/* =====================================================
   routes/orders.js — Place / View / Cancel Orders
   FIX: Stock check and decrement are now a single atomic
   findOneAndUpdate operation, eliminating the race condition
   where two concurrent orders could both pass the stock check
   and push stock negative.
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

    /* ── FIX: Atomic stock check + decrement in one step per item.
       Old approach: read stock → (race window) → decrement
       New approach: findOneAndUpdate with { stock: { $gte: qty } } condition
       Maintains a `decremented` list so we can rollback on failure. ── */
    const decremented = [];

    for (const item of items) {
      if (!item.productId) continue;
      const qty = item.qty || 1;

      const updated = await Product.findOneAndUpdate(
        { _id: item.productId, stock: { $gte: qty } },
        { $inc: { stock: -qty } },
        { new: true }
      );

      if (!updated) {
        /* Rollback all already-decremented products before returning error */
        for (const d of decremented) {
          await Product.findByIdAndUpdate(d.id, { $inc: { stock: d.qty } });
        }
        const existing = await Product.findById(item.productId);
        if (!existing)
          return res.status(404).json({ message: `Product not found: ${item.name}` });
        return res.status(400).json({
          message: `"${existing.name}" only has ${existing.stock} unit(s) left in stock.`
        });
      }

      decremented.push({ id: item.productId, qty });
    }

    /* ── Create order after all stock is successfully reserved ── */
    let order;
    try {
      order = await Order.create({
        userId: req.user.id,
        items,
        total,
        address,
        phone,
        paymentMethod: paymentMethod || 'COD',
      });
    } catch (err) {
      /* Rollback stock if order creation fails */
      for (const d of decremented) {
        await Product.findByIdAndUpdate(d.id, { $inc: { stock: d.qty } });
      }
      return res.status(500).json({ message: err.message });
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

/* GET /api/orders/admin/all — Admin: get all orders
   NOTE: This route must stay defined BEFORE /:id so Express doesn't
   try to cast "admin" as a MongoDB ObjectId. */
router.get('/admin/all', adminMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const filter = status ? { status } : {};
    const skip   = (parseInt(page) - 1) * parseInt(limit);
    const total  = await Order.countDocuments(filter);

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email');

    res.json({ orders, total, page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* PUT /api/orders/admin/:id — Admin: update order status */
router.put('/admin/:id', adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!allowed.includes(status))
      return res.status(400).json({ message: `Invalid status. Must be one of: ${allowed.join(', ')}` });

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
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

    /* Restore stock on cancellation */
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

module.exports = router;
