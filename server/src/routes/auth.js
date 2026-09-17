import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db.js';
import { signToken, requireAuth } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Слишком много попыток. Попробуйте позже.' }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4)
});

router.post('/login', loginLimiter, (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Некорректные данные' });

  const { email, password } = parsed.data;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: 'Неверный e-mail или пароль' });

  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Неверный e-mail или пароль' });

  const token = signToken(user);
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role }
  });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;