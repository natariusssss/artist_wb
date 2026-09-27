import { Router } from 'express';
import { z } from 'zod';
import slugify from 'slugify';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function mapRow(row) {
  if (!row) return null;
  const techniques = db.prepare(`
    SELECT t.slug, t.name FROM techniques t
    JOIN artwork_techniques at ON at.technique_id = t.id
    WHERE at.artwork_id = ?`).all(row.id);

  const images = db.prepare(`
    SELECT url, alt FROM artwork_images
    WHERE artwork_id = ? ORDER BY sort_order, id`).all(row.id);

  const sizes = db.prepare(`
    SELECT label, price FROM repro_sizes WHERE artwork_id = ?`).all(row.id);

  return {
    id: row.id,
    slug: row.slug,
    artist: row.artist,
    title: row.title,
    year: row.year,
    category: row.category,
    techniques: techniques.map(t => t.slug),
    techniqueNames: techniques.map(t => t.name),
    materials: row.materials,
    height: row.height,
    width: row.width,
    description: row.description,
    status: row.status,
    price: row.price,
    currency: row.currency,
    featured: !!row.featured,

    sheetHeight: row.sheet_height,
    sheetWidth: row.sheet_width,
    imageHeight: row.image_height,
    imageWidth: row.image_width,
    edition: row.edition,
    copyNumber: row.copy_number,
    signed: row.signed,

    originalTitle: row.original_title,
    reproductionType: row.repro_type,
    printMaterial: row.print_material,
    series: row.series,
    availableSizes: sizes,

    images,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function uniqueSlug(base, ignoreId = null) {
  let slug = slugify(base, { lower: true, strict: true }) || 'work-' + Date.now();
  let candidate = slug;
  let i = 1;
  while (true) {
    const row = ignoreId
      ? db.prepare('SELECT id FROM artworks WHERE slug = ? AND id != ?').get(candidate, ignoreId)
      : db.prepare('SELECT id FROM artworks WHERE slug = ?').get(candidate);
    if (!row) return candidate;
    candidate = `${slug}-${++i}`;
  }
}

router.get('/', (req, res) => {
  const { category, technique, year, available, featured, q } = req.query;
  const where = [];
  const params = [];

  if (category) { where.push('a.category = ?'); params.push(category); }
  if (year) { where.push('a.year = ?'); params.push(Number(year)); }
  if (available === 'true') where.push(`a.status = 'available'`);
  if (featured === 'true') where.push('a.featured = 1');
  if (q) { where.push('(a.title LIKE ? OR a.description LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }

  let join = '';
  if (technique) {
    join = `JOIN artwork_techniques at ON at.artwork_id = a.id
            JOIN techniques t ON t.id = at.technique_id AND t.slug = ?`;
    params.unshift(technique);
  }

  const sql = `
    SELECT DISTINCT a.* FROM artworks a ${join}
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY a.created_at DESC`;

  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(mapRow));
});

router.get('/:slug', (req, res) => {
  const row = db.prepare('SELECT * FROM artworks WHERE slug = ?').get(req.params.slug);
  if (!row) return res.status(404).json({ error: 'Не найдено' });
  res.json(mapRow(row));
});

const artworkSchema = z.object({
  slug: z.string().optional(),
  artist: z.string().min(1),
  title: z.string().min(1),
  year: z.number().int().nullable().optional(),
  category: z.enum(['original','engraving','reproduction']),
  techniques: z.array(z.string()).default([]),
  materials: z.string().nullable().optional(),
  height: z.number().nullable().optional(),
  width: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
  status: z.enum(['available','sold','not_for_sale']).default('available'),
  price: z.number().nullable().optional(),
  currency: z.string().default('EUR'),
  featured: z.boolean().default(false),

  sheetHeight: z.number().nullable().optional(),
  sheetWidth: z.number().nullable().optional(),
  imageHeight: z.number().nullable().optional(),
  imageWidth: z.number().nullable().optional(),
  edition: z.number().int().nullable().optional(),
  copyNumber: z.string().nullable().optional(),
  signed: z.string().nullable().optional(),

  originalTitle: z.string().nullable().optional(),
  reproductionType: z.string().nullable().optional(),
  printMaterial: z.string().nullable().optional(),
  series: z.string().nullable().optional(),
  availableSizes: z.array(z.object({ label: z.string(), price: z.number().nullable().optional() })).optional(),

  images: z.array(z.object({ url: z.string(), alt: z.string().optional() })).default([]),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
});

function persistRelations(artworkId, data) {
  db.prepare('DELETE FROM artwork_techniques WHERE artwork_id = ?').run(artworkId);
  const findTech = db.prepare('SELECT id FROM techniques WHERE slug = ?');
  const linkTech = db.prepare('INSERT INTO artwork_techniques (artwork_id, technique_id) VALUES (?,?)');
  for (const slug of data.techniques || []) {
    const t = findTech.get(slug);
    if (t) linkTech.run(artworkId, t.id);
  }

  db.prepare('DELETE FROM artwork_images WHERE artwork_id = ?').run(artworkId);
  const insImg = db.prepare('INSERT INTO artwork_images (artwork_id, url, alt, sort_order) VALUES (?,?,?,?)');
  (data.images || []).forEach((img, i) => insImg.run(artworkId, img.url, img.alt || '', i));

  db.prepare('DELETE FROM repro_sizes WHERE artwork_id = ?').run(artworkId);
  const insSize = db.prepare('INSERT INTO repro_sizes (artwork_id, label, price) VALUES (?,?,?)');
  (data.availableSizes || []).forEach(s => insSize.run(artworkId, s.label, s.price ?? null));
}

router.post('/', requireAuth, (req, res) => {
  const parsed = artworkSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Ошибка валидации', details: parsed.error.flatten() });
  const data = parsed.data;
  const slug = uniqueSlug(data.slug || data.title);

  const tx = db.transaction(() => {
    const info = db.prepare(`
  INSERT INTO artworks (
    slug, artist, title, year, category, materials, height, width, description,
    status, price, currency, featured,
    sheet_height, sheet_width, image_height, image_width, edition, copy_number, signed,
    original_title, repro_type, print_material, series,
    meta_title, meta_description
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
`).run(
  slug, data.artist, data.title, data.year ?? null, data.category,
  data.materials ?? null, data.height ?? null, data.width ?? null, data.description ?? null,
  data.status, data.price ?? null, data.currency, data.featured ? 1 : 0,
  data.sheetHeight ?? null, data.sheetWidth ?? null, data.imageHeight ?? null, data.imageWidth ?? null,
  data.edition ?? null, data.copyNumber ?? null, data.signed ?? null,
  data.originalTitle ?? null, data.reproductionType ?? null, data.printMaterial ?? null,
  data.series ?? null,
  data.metaTitle ?? null, data.metaDescription ?? null
);
    const id = info.lastInsertRowid;
    persistRelations(id, data);
    return id;
  });

  const id = tx();
  const row = db.prepare('SELECT * FROM artworks WHERE id = ?').get(id);
  res.status(201).json(mapRow(row));
});

router.put('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM artworks WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Не найдено' });

  const parsed = artworkSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Ошибка валидации', details: parsed.error.flatten() });
  const data = parsed.data;

  const slug = data.slug
    ? uniqueSlug(data.slug, existing.id)
    : uniqueSlug(existing.title, existing.id);

  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE artworks SET
        slug = ?, artist = ?, title = ?, year = ?, category = ?, materials = ?,
        height = ?, width = ?, description = ?, status = ?, price = ?, currency = ?,
        featured = ?,
        sheet_height = ?, sheet_width = ?, image_height = ?, image_width = ?,
        edition = ?, copy_number = ?, signed = ?,
        original_title = ?, repro_type = ?, print_material = ?,series = ?,
        meta_title = ?, meta_description = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      slug, data.artist, data.title, data.year ?? null, data.category,
      data.materials ?? null, data.height ?? null, data.width ?? null, data.description ?? null,
      data.status, data.price ?? null, data.currency, data.featured ? 1 : 0,
      data.sheetHeight ?? null, data.sheetWidth ?? null, data.imageHeight ?? null, data.imageWidth ?? null,
      data.edition ?? null, data.copyNumber ?? null, data.signed ?? null,
      data.originalTitle ?? null, data.reproductionType ?? null, data.printMaterial ?? null,
      data.series ?? null,
      data.metaTitle ?? null, data.metaDescription ?? null,
      existing.id
    );
    persistRelations(existing.id, data);
  });
  tx();

  const row = db.prepare('SELECT * FROM artworks WHERE id = ?').get(existing.id);
  res.json(mapRow(row));
});

router.delete('/:id', requireAuth, (req, res) => {
  const info = db.prepare('DELETE FROM artworks WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Не найдено' });
  res.json({ ok: true });
});

export default router;