import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import './db.js';
import authRouter from './routes/auth.js';
import artworksRouter from './routes/artworks.js';
import techniquesRouter from './routes/techniques.js';
import pagesRouter from './routes/pages.js';
import uploadsRouter from './routes/uploads.js';
import { errorHandler } from './middleware/error.js';
import contactRouter from './routes/contact.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: (process.env.CORS_ORIGIN || '*').split(',').map(s => s.trim()),
  credentials: false
}));
app.use(express.json({ limit: '2mb' }));

app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_DIR || './uploads'), {
  maxAge: '7d',
  immutable: true
}));

app.use('/api/auth', authRouter);
app.use('/api/artworks', artworksRouter);
app.use('/api/techniques', techniquesRouter);
app.use('/api', pagesRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/contact', contactRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use(express.static(path.join(__dirname, '..', '..', 'public')));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next();
  res.sendFile(path.join(__dirname, '..', '..', 'public', 'index.html'));
});

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🎨 Server: http://localhost:${PORT}`);
  console.log('🔐 Панель администратора доступна по адресу /#/admin');
});

