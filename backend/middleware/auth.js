const jwt    = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'medplus_secret_key_2024';

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer '))
    return res.status(401).json({ message: 'Unauthorized — token missing' });
  try {
    req.user = jwt.verify(auth.split(' ')[1], SECRET);
    next();
  } catch {
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
