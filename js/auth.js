/* =====================================================
   middleware/auth.js — JWT Authentication
   FIXED: warns if JWT_SECRET is missing
===================================================== */
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  console.warn('[WARN] JWT_SECRET is not set! Using insecure fallback. Set it in your .env file.');
}
const EFFECTIVE_SECRET = SECRET || 'medplus_INSECURE_fallback_set_JWT_SECRET_in_env';

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer '))
    return res.status(401).json({ message: 'Unauthorized — token missing' });
  try {
    req.user = jwt.verify(auth.split(' ')[1], EFFECTIVE_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function adminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (!req.user.isAdmin)
      return res.status(403).json({ message: 'Admin access required' });
    next();
  });
}

module.exports = { authMiddleware, adminMiddleware };
