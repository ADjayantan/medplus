const express = require('express');
const Order   = require('../models/Order');
const Product = require('../models/Product');
const router  = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// POST /api/orders
// FIX: total is now computed server-side from DB prices — client value is ignored.
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { items, address, phone, paymentMethod } = req.body;
    if (!items?.length || !address || !phone)
      return res.status(400).json({ message: 'items, address and phone are required' });

    // Fetch real prices from DB for every item in the order
    const productIds = items.map(i => i.productId);
    const products   = await Product.find({ _id: { $in: productIds } });
    const priceMap   = Object.fromEntries(products.map(p => [p._id.toString(), p.price]));

    // Build verified items and compute total
    const verifiedItems = [];
    let computedTotal = 0;
    for (const item of items) {
      const price = priceMap[item.productId?.toString()];
      if (price === undefined)
        return res.status(400).json({ message: `Product not found: ${item.productId}` });
      const qty = Math.max(1, parseInt(item.qty) || 1);
      verifiedItems.push({
        productId: item.productId,
        name:      item.name,
        image:     item.image,
        price,        // always from DB
        qty,
      });
      computedTotal += price * qty;
    }

    const order = await Order.create({
      userId:        req.user.id,
      items:         verifiedItems,
      total:         Math.round(computedTotal * 100) / 100,  // server-computed
      address,
      phone,
      paymentMethod: paymentMethod || 'COD',
    });
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: 'Order creation failed' });
  }
});

// GET /api/orders/my
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ orders, total: orders.length });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// GET /api/orders — Admin: all orders
router.get('/', adminMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const safeLimit = Math.min(parseInt(limit) || 50, 200);
    const filter = {};
    if (status) filter.status = status;
    const skip = (page - 1) * safeLimit;
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('userId', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(safeLimit),
      Order.countDocuments(filter),
    ]);
    res.json({ orders, total, page: Number(page), pages: Math.ceil(total / safeLimit) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch orders' });
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
    res.status(500).json({ message: 'Failed to fetch order' });
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
    res.status(500).json({ message: 'Failed to update order status' });
  }
});

module.exports = router;
