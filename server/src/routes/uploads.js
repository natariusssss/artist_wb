import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.post('/', requireAuth, (req, res, next) => {
  upload.single('file')(req, res, (error) => {
    if (error) return next(error);
    if (!req.file) return res.status(400).json({ error: 'Файл не выбран' });

    res.status(201).json({
      url: `/uploads/${req.file.filename}`,
      filename: req.file.filename,
      size: req.file.size,
      mimeType: req.file.mimetype,
    });
  });
});

export default router;
