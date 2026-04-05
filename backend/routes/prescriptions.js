const express      = require('express');
const multer       = require('multer');
const path         = require('path');
const fs           = require('fs');
const Prescription = require('../models/Prescription');
const router       = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Multer setup
const uploadDir = path.join(__dirname, '../../frontend/uploads/prescriptions');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only JPG, PNG and PDF files are allowed'));
  }
});

// POST /api/prescriptions/upload
router.post('/upload', authMiddleware, upload.single('prescription'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const url = '/uploads/prescriptions/' + req.file.filename;
    const prescription = await Prescription.create({
      userId: req.user.id,
      filename: req.file.originalname,
      url
    });
    res.status(201).json(prescription);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/prescriptions/my
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ userId: req.user.id }).sort({ uploadedAt: -1 });
    res.json({ prescriptions, total: prescriptions.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/prescriptions — Admin
router.get('/', adminMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const skip = (page - 1) * limit;
    const [prescriptions, total] = await Promise.all([
      Prescription.find(filter)
        .populate('userId', 'name email phone')
        .populate('reviewedBy', 'name')
        .sort({ uploadedAt: -1 })
        .skip(Number(skip))
        .limit(Number(limit)),
      Prescription.countDocuments(filter)
    ]);
    res.json({ prescriptions, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/prescriptions/:id/review — Admin
router.put('/:id/review', adminMiddleware, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    if (!['approved', 'rejected'].includes(status))
      return res.status(400).json({ message: 'Status must be "approved" or "rejected"' });
    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      { status, adminNote: adminNote || '', reviewedBy: req.user.id, reviewedAt: new Date() },
      { new: true }
    ).populate('userId', 'name email');
    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });
    res.json(prescription);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
