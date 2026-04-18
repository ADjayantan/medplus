const express      = require('express');
const multer       = require('multer');
const path         = require('path');
const fs           = require('fs');
const Prescription = require('../models/Prescription');
const router       = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// ── Upload directory ──────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../../uploads/prescriptions');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ── Multer: store in memory first so we can inspect magic bytes ───────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// ── Magic-byte signatures for allowed types ───────────────────────────────────
const ALLOWED_SIGNATURES = [
  { mime: 'image/jpeg', magic: [0xFF, 0xD8, 0xFF] },
  { mime: 'image/png',  magic: [0x89, 0x50, 0x4E, 0x47] },
  { mime: 'application/pdf', magic: [0x25, 0x50, 0x44, 0x46] }, // %PDF
];

function detectMimeFromBuffer(buf) {
  for (const { mime, magic } of ALLOWED_SIGNATURES) {
    if (magic.every((byte, i) => buf[i] === byte)) return mime;
  }
  return null;
}

// ── POST /api/prescriptions/upload ───────────────────────────────────────────
router.post('/upload', authMiddleware, upload.single('prescription'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    // Verify actual file content via magic bytes (not just the extension)
    const detectedMime = detectMimeFromBuffer(req.file.buffer);
    if (!detectedMime) {
      return res.status(400).json({ message: 'Invalid file type. Only JPG, PNG and PDF files are allowed.' });
    }

    // Also reject if the extension doesn't match the detected type (e.g. malware.pdf.jpg)
    const ext = path.extname(req.file.originalname).toLowerCase();
    const extToMime = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.pdf': 'application/pdf' };
    if (extToMime[ext] !== detectedMime) {
      return res.status(400).json({ message: 'File extension does not match its content.' });
    }

    // Safe to write — use detected extension, not original filename
    const safeExt  = ext;
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
    const filepath = path.join(uploadDir, filename);
    fs.writeFileSync(filepath, req.file.buffer);

    const url = '/uploads/prescriptions/' + filename;
    const prescription = await Prescription.create({
      userId:   req.user.id,
      filename: req.file.originalname.replace(/[^a-zA-Z0-9._\- ]/g, '_'), // sanitize
      url,
    });
    res.status(201).json(prescription);
  } catch (err) {
    res.status(500).json({ message: 'Upload failed' });
  }
});

// ── GET /api/prescriptions/my ─────────────────────────────────────────────────
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ userId: req.user.id }).sort({ uploadedAt: -1 });
    res.json({ prescriptions, total: prescriptions.length });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch prescriptions' });
  }
});

// ── GET /api/prescriptions — Admin ───────────────────────────────────────────
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
      Prescription.countDocuments(filter),
    ]);
    res.json({ prescriptions, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch prescriptions' });
  }
});

// ── PUT /api/prescriptions/:id/review — Admin ────────────────────────────────
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
    res.status(500).json({ message: 'Review failed' });
  }
});

module.exports = router;
