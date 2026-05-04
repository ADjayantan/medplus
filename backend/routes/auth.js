/* =====================================================
   routes/auth.js — Register / Login / Profile
   FIXES:
   - Removed manual bcrypt.hash() — User model pre-save hook handles it
   - Added rate limiting on login & register
===================================================== */
const express    = require('express');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const rateLimit  = require('express-rate-limit');
const User       = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const router     = express.Router();

const SECRET = process.env.JWT_SECRET || 'genezenz-pharmacy_INSECURE_fallback_set_JWT_SECRET_in_env';

/* ── Rate limiter: 5 attempts per 15 minutes per IP ── */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: req => req.ip,
  message: { message: 'Too many attempts. Please wait 15 minutes and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/* ── Register limiter: 3 accounts per hour per IP ── */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyGenerator: req => req.ip,
  message: { message: 'Too many registrations from this IP. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/* POST /api/register */
router.post('/register', registerLimiter, async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });

    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return res.status(409).json({ message: 'Email already registered' });

    /* FIX: Pass plain password — the User model pre('save') hook hashes it.
       Previously this was bcrypt.hash(password, 12) here AND hashed again
       in the model, causing double-hashing and permanent login failure. */
    const user = await User.create({
      name:  name.trim(),
      email: email.toLowerCase().trim(),
      password,          // plain — model hook hashes it once
      phone: phone || '',
    });

    const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, SECRET, { expiresIn: '7d' });
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* POST /api/login */
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(401).json({ message: 'Invalid email or password' });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* GET /api/profile */
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* PUT /api/profile */
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    /* FIX: Only allow safe fields — never expose isAdmin via profile update */
    const { name, phone, address } = req.body;

    if (name !== undefined && !name.trim())
      return res.status(400).json({ message: 'Name cannot be empty' });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name: name?.trim(), phone, address },
      { new: true, runValidators: true }   // FIX: runValidators ensures schema rules run
    ).select('-password');

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
