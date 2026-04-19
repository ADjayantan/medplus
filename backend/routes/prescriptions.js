/* =====================================================
   routes/prescriptions.js — Upload & Manage Prescriptions
===================================================== */
const express      = require('express');
const multer       = require('multer');
const path         = require('path');
const fs           = require('fs');
const Prescription = require('../models/Prescription');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const router       = express.Router();

/* ── Multer setup ── */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `rx_${Date.now()}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.pdf'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only JPG, PNG and PDF files are allowed'));
  },
});

/* POST /api/prescriptions/upload — Upload prescription (called by frontend) */
router.post('/upload', authMiddleware, upload.single('prescription'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Prescription file is required' });
    const prescription = await Prescription.create({
      userId:   req.user.id,
      filename: req.file.filename,
      url:      `/uploads/${req.file.filename}`,
      notes:    req.body.notes || '',
    });
    res.status(201).json(prescription);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* POST /api/prescriptions — Upload prescription (alias) */
router.post('/', authMiddleware, upload.single('prescription'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Prescription file is required' });
    const prescription = await Prescription.create({
      userId:   req.user.id,
      filename: req.file.filename,
      url:      `/uploads/${req.file.filename}`,
      notes:    req.body.notes || '',
    });
    res.status(201).json(prescription);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* GET /api/prescriptions/my — Get current user's prescriptions */
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ userId: req.user.id }).sort({ uploadedAt: -1 });
    res.json({ prescriptions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* GET /api/prescriptions — Get current user's prescriptions (alias) */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ userId: req.user.id }).sort({ uploadedAt: -1 });
    res.json({ prescriptions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* GET /api/prescriptions/admin/all — Admin: get all prescriptions */
router.get('/admin/all', adminMiddleware, async (req, res) => {
  try {
    const prescriptions = await Prescription.find()
      .sort({ uploadedAt: -1 })
      .populate('userId', 'name email');
    res.json({ prescriptions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* PUT /api/prescriptions/admin/:id — Admin: approve or reject */
router.put('/admin/:id', adminMiddleware, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      { status, adminNote, reviewedBy: req.user.id, reviewedAt: new Date() },
      { new: true }
    );
    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });
    res.json(prescription);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
