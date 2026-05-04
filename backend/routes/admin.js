/* =====================================================
   routes/admin.js — Admin Stats & User Management
   FIX: Added pagination to GET /users (was fetching ALL
   users at once — slow and memory-heavy at scale)
===================================================== */
const express      = require('express');
const User         = require('../models/User');
const Order        = require('../models/Order');
const Product      = require('../models/Product');
const Prescription = require('../models/Prescription');
const router       = express.Router();
const { adminMiddleware } = require('../middleware/auth');

/* GET /api/admin/stats */
router.get('/stats', adminMiddleware, async (req, res) => {
  try {
    const [
      totalProducts, totalOrders, totalUsers, pendingPrescriptions,
      recentOrders, ordersByStatus
    ] = await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      User.countDocuments({ isAdmin: false }),
      Prescription.countDocuments({ status: 'pending' }),
      Order.find().sort({ createdAt: -1 }).limit(5).populate('userId', 'name email'),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
    ]);

    const revenue = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    res.json({
      totalProducts, totalOrders, totalUsers, pendingPrescriptions,
      totalRevenue: revenue[0]?.total || 0,
      recentOrders, ordersByStatus
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* GET /api/admin/users
   FIX: Added pagination — page & limit query params (default 50/page).
   Previously fetched all users at once with no limit. */
router.get('/users', adminMiddleware, async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip  = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find({}, '-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(),
    ]);

    res.json({
      users,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
