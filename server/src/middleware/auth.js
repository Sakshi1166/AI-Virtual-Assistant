import jwt from 'jsonwebtoken';

export function authRequired(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'changeme');
    req.user = { id: decoded.sub, role: decoded.role };
    next();
  } catch (err) {
    console.error('JWT verification failed', err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function signAccessToken(user) {
  const payload = {
    sub: user._id.toString(),
    role: user.role,
  };
  const secret = process.env.JWT_SECRET || 'changeme';
  const expiresIn = process.env.JWT_EXPIRES_IN || '15m';

  return jwt.sign(payload, secret, { expiresIn });
}

export function signRefreshToken(user) {
  const payload = {
    sub: user._id.toString(),
    type: 'refresh',
  };
  const secret = process.env.JWT_REFRESH_SECRET || 'changeme-refresh';
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyRefreshToken(token) {
  const secret = process.env.JWT_REFRESH_SECRET || 'changeme-refresh';
  return jwt.verify(token, secret);
}

