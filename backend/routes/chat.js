/* =====================================================
   routes/chat.js — Secure backend proxy for OpenRouter
   The OPENROUTER_API_KEY never leaves the server.
===================================================== */
const express    = require('express');
const router     = express.Router();
const rateLimit  = require('express-rate-limit');

// Rate-limit chat to avoid runaway costs: 30 messages / user / 10 min
const chatLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  keyGenerator: req => (req.headers.authorization || req.ip),
  message: { message: 'Too many chat requests. Please wait a few minutes.' },
});

// POST /api/chat
router.post('/', chatLimiter, async (req, res) => {
  try {
    const { messages, systemPrompt } = req.body;

    if (!Array.isArray(messages) || messages.length === 0)
      return res.status(400).json({ message: 'messages array is required' });

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      // Graceful fallback when key is not configured
      return res.json({ reply: "I'm not available right now. Please call us at 📞 1800-123-456 for assistance." });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer':  process.env.FRONTEND_URL || 'https://medplus.example.com',
        'X-Title':       'MedPlus AI Chatbot',
      },
      body: JSON.stringify({
        model:    'meta-llama/llama-3.3-8b-instruct:free',
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          // Limit to last 20 turns to cap token usage
          ...messages.slice(-20),
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[CHAT] OpenRouter error:', data?.error?.message);
      return res.status(502).json({ message: 'AI service unavailable. Please try again shortly.' });
    }

    const reply = data.choices?.[0]?.message?.content || "I couldn't get a response. Please try again.";
    res.json({ reply });
  } catch (err) {
    console.error('[CHAT] Proxy error:', err.message);
    res.status(500).json({ message: 'Chat service error' });
  }
});

module.exports = router;
