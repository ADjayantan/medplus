const express = require('express');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const router  = express.Router();
const SECRET  = process.env.JWT_SECRET || 'medplus_secret_key_2024';
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 attempts per IP per window
  message: { message: 'Too many attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already registered' });
    const user  = await User.create({ name, email, password, phone: phone || '' });
    const token = jwt.sign({ id: user._id, email: user.email, isAdmin: user.isAdmin }, SECRET, { expiresIn: '7d' });
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, isAdmin: user.isAdmin }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });
    const token = jwt.sign({ id: user._id, email: user.email, isAdmin: user.isAdmin }, SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, isAdmin: user.isAdmin }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
