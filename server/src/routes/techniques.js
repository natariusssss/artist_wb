import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT id, slug, name FROM techniques ORDER BY sort_order, name').all();
  res.json(rows);
});

const techSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/i),
  name: z.string().min(1),
  sort_order: z.number().int().optional()
});

router.post('/', requireAuth, (req, res) => {
  const parsed = techSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Некорректные данные' });
  const { slug, name, sort_order = 0 } = parsed.data;
  try {
    const info = db.prepare('INSERT INTO techniques (slug, name, sort_order) VALUES (?,?,?)')
      .run(slug, name, sort_order);
    res.status(201).json({ id: info.lastInsertRowid, slug, name });
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) return res.status(409).json({ error: 'Slug занят' });
    throw e;
  }
});

router.delete('/:id', requireAuth, (req, res) => {
  const info = db.prepare('DELETE FROM techniques WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Не найдено' });
  res.json({ ok: true });
});

export default router;