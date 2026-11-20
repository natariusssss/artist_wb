import jwt from 'jsonwebtoken';

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET обязателен и должен содержать не менее 32 символов');
  }
  return secret;
}

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    getSecret(),
    { expiresIn: process.env.JWT_EXPIRES || '7d' }
  );
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Нет токена' });
  try {
    req.user = jwt.verify(token, getSecret());
    next();
  } catch (error) {
    if (error.message?.includes('JWT_SECRET')) return res.status(500).json({ error: 'Сервер не настроен: отсутствует JWT_SECRET' });
    return res.status(401).json({ error: 'Токен недействителен или истёк' });
  }
}