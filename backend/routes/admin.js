const express      = require('express');
const User         = require('../models/User');
const Order        = require('../models/Order');
const Product      = require('../models/Product');
const Prescription = require('../models/Prescription');
const router       = express.Router();
const { adminMiddleware } = require('../middleware/auth');

// GET /api/admin/stats
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

// GET /api/admin/users
router.get('/users', adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json({ users, total: users.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
