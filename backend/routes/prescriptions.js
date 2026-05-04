/* =====================================================
   routes/prescriptions.js — Upload & Manage Prescriptions
   FIXES:
   - Removed duplicate POST / route (identical to POST /upload)
   - Added GET /file/:filename with auth + path-traversal guard
     so prescription files can be viewed securely
===================================================== */
const express      = require('express');
const multer       = require('multer');
const path         = require('path');
const fs           = require('fs');
const Prescription = require('../models/Prescription');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const router       = express.Router();

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

/* ── Multer setup ── */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    cb(null, `rx_${Date.now()}${ext}`);
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

/* POST /api/prescriptions/upload — Upload prescription */
router.post('/upload', authMiddleware, upload.single('prescription'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Prescription file is required' });
    const prescription = await Prescription.create({
      userId:   req.user.id,
      filename: req.file.filename,
      url:      `/api/prescriptions/file/${req.file.filename}`, // FIX: point to gated route
      notes:    req.body.notes || '',
    });
    res.status(201).json(prescription);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* FIX: GET /api/prescriptions/file/:filename
   Serves prescription files with authentication and path-traversal protection.
   Previously, files were stored at /uploads/ which was not statically served,
   making prescription viewing completely broken. */
router.get('/file/:filename', authMiddleware, (req, res) => {
  /* Path traversal guard: strip any directory separators */
  const safeFilename = path.basename(req.params.filename);
  const filePath = path.join(UPLOADS_DIR, safeFilename);

  /* Verify the resolved path is still inside UPLOADS_DIR */
  if (!filePath.startsWith(UPLOADS_DIR + path.sep) && filePath !== UPLOADS_DIR) {
    return res.status(400).json({ message: 'Invalid filename' });
  }

  /* Admin can view any file; regular users can only view their own */
  if (!req.user.isAdmin) {
    Prescription.findOne({ filename: safeFilename, userId: req.user.id })
      .then(rx => {
        if (!rx) return res.status(403).json({ message: 'Access denied' });
        res.sendFile(filePath, err => {
          if (err) res.status(404).json({ message: 'File not found' });
        });
      })
      .catch(() => res.status(500).json({ message: 'Server error' }));
  } else {
    res.sendFile(filePath, err => {
      if (err) res.status(404).json({ message: 'File not found' });
    });
  }
});

/* GET /api/prescriptions/admin/all — Admin: get all prescriptions */
router.get('/admin/all', adminMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const filter = status ? { status } : {};
    const skip   = (parseInt(page) - 1) * parseInt(limit);
    const total  = await Prescription.countDocuments(filter);

    const prescriptions = await Prescription.find(filter)
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email');

    res.json({ prescriptions, total, page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* PUT /api/prescriptions/admin/:id — Admin: approve or reject */
router.put('/admin/:id', adminMiddleware, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const allowed = ['pending', 'approved', 'rejected'];
    if (!allowed.includes(status))
      return res.status(400).json({ message: `Invalid status. Must be one of: ${allowed.join(', ')}` });

    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      { status, adminNote: adminNote || '', reviewedBy: req.user.id, reviewedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });
    res.json(prescription);
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

/* FIX: Removed duplicate POST / route that was identical to POST /upload.
   If any old frontend code called POST /api/prescriptions directly, update
   it to call POST /api/prescriptions/upload instead. */

module.exports = router;
