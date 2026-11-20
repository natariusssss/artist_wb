import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Only authenticated administrators may add artwork images.
router.post('/', requireAuth, (req, res, next) => {
  upload.single('file')(req, res, (error) => {
    if (error) return next(error);
    if (!req.file) return res.status(400).json({ error: 'Выберите изображение' });
    res.status(201).json({
      ok: true,
      url: `/uploads/${req.file.filename}`,
      filename: req.file.filename,
      size: req.file.size,
      mimeType: req.file.mimetype,
    });
  });
});

export default router;
