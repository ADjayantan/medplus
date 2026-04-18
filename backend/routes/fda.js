/* =====================================================
   routes/fda.js — Secure backend proxy for FDA FAERS
   The FDA_API_KEY never leaves the server.
===================================================== */
const express   = require('express');
const router    = express.Router();
const rateLimit = require('express-rate-limit');

const fdaLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { message: 'Too many FDA requests. Please slow down.' },
});

// GET /api/fda?drug=paracetamol
router.get('/', fdaLimiter, async (req, res) => {
  try {
    const { drug } = req.query;
    if (!drug || drug.trim().length < 2)
      return res.status(400).json({ message: 'drug query param is required' });

    const apiKey  = process.env.FDA_API_KEY;
    const keyParam = apiKey ? `&api_key=${apiKey}` : '';
    const url = `https://api.fda.gov/drug/event.json?search=patient.drug.medicinalproduct:"${encodeURIComponent(drug.trim())}"&limit=5${keyParam}`;

    const response = await fetch(url);
    if (!response.ok) return res.json(null); // No data — not an error

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
      drug,
      reportCount: data.meta?.results?.total || data.results.length,
      reactions:   topReactions,
    });
  } catch (err) {
    console.error('[FDA] Proxy error:', err.message);
    res.json(null); // fail silently — FDA data is supplementary
  }
});

module.exports = router;
