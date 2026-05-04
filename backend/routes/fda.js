/* =====================================================
   routes/fda.js — Secure backend proxy for FDA FAERS
   FIX: Added input whitelist validation on the `drug`
   param to prevent URL injection via crafted values.
===================================================== */
const express   = require('express');
const router    = express.Router();
const rateLimit = require('express-rate-limit');

const fdaLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { message: 'Too many FDA requests. Please slow down.' },
});

/* Allowed characters: letters, digits, spaces, hyphens, parentheses */
const DRUG_SAFE = /^[a-zA-Z0-9 \-().]+$/;

/* GET /api/fda?drug=paracetamol */
router.get('/', fdaLimiter, async (req, res) => {
  try {
    const { drug } = req.query;

    if (!drug || drug.trim().length < 2)
      return res.status(400).json({ message: 'drug query param is required (min 2 chars)' });

    if (drug.trim().length > 100)
      return res.status(400).json({ message: 'drug name is too long (max 100 chars)' });

    /* FIX: Whitelist validation — reject anything with URL-special or injection chars */
    if (!DRUG_SAFE.test(drug.trim()))
      return res.status(400).json({ message: 'drug name contains invalid characters' });

    const apiKey   = process.env.FDA_API_KEY;
    const keyParam = apiKey ? `&api_key=${apiKey}` : '';
    const url = `https://api.fda.gov/drug/event.json?search=patient.drug.medicinalproduct:"${encodeURIComponent(drug.trim())}"&limit=5${keyParam}`;

    const response = await fetch(url);
    if (!response.ok) return res.json(null);

    const data = await response.json();
    if (!data.results?.length) return res.json(null);

    const reactionCounts = {};
    data.results.forEach(report => {
      (report.patient?.reaction || []).forEach(r => {
        const term = r.reactionmeddrapt;
        if (term) reactionCounts[term] = (reactionCounts[term] || 0) + 1;
      });
    });

    const topReactions = Object.entries(reactionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([term]) => term);

    if (!topReactions.length) return res.json(null);

    res.json({
      drug: drug.trim(),
      reportCount: data.meta?.results?.total || data.results.length,
      reactions:   topReactions,
    });
  } catch (err) {
    console.error('[FDA] Proxy error:', err.message);
    res.json(null);
  }
});

module.exports = router;
