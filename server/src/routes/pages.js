import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const aboutSchema = z.object({
  artists: z.array(z.object({
    name: z.string(),
    photo: z.string(),
    shortBio: z.string(),
    education: z.string(),
  })).min(1).max(10),
});
const contactsSchema = z.object({
  email: z.string().email(),
  instagram: z.string(),
  instagramUrl: z.string().url(),
  telegram: z.string().optional(),
  city: z.string(),
});

router.get('/about', (_req, res) => {
  const row = db.prepare('SELECT json FROM pages WHERE key = ?').get('about');
  res.json(row ? JSON.parse(row.json) : {});
});

router.put('/about', requireAuth, (req, res) => {
  const parsed = aboutSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Ошибка валидации', details: parsed.error.flatten() });
  const json = JSON.stringify(parsed.data);
  db.prepare(`
    INSERT INTO pages (key, json, updated_at) VALUES ('about', ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET json = excluded.json, updated_at = excluded.updated_at
  `).run(json);
  res.json(parsed.data);
});

router.get('/contacts', (_req, res) => {
  const row = db.prepare('SELECT json FROM pages WHERE key = ?').get('contacts');
  res.json(row ? JSON.parse(row.json) : {});
});

router.put('/contacts', requireAuth, (req, res) => {
  const parsed = contactsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Ошибка валидации', details: parsed.error.flatten() });
  const json = JSON.stringify(parsed.data);
  db.prepare(`
    INSERT INTO pages (key, json, updated_at) VALUES ('contacts', ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET json = excluded.json, updated_at = excluded.updated_at
  `).run(json);
  res.json(parsed.data);
});

export default router;