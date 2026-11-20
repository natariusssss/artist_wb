import { Router } from 'express';
import nodemailer from 'nodemailer';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { db } from '../db.js';

const router = Router();

// Ограничение: не более 5 писем в час с одного IP
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Слишком много сообщений. Попробуйте позже.' }
});

const schema = z.object({
  name: z.string().min(1, 'Укажите имя').max(100),
  email: z.string().email('Некорректный e-mail'),
  message: z.string().min(5, 'Слишком короткое сообщение').max(5000),
  artwork: z.string().optional().nullable(),
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

router.post('/', contactLimiter, async (req, res, next) => {
  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Некорректные данные'
      });
    }

    const { name, email, message, artwork } = parsed.data;
    const artworkRow = artwork
      ? db.prepare('SELECT title FROM artworks WHERE slug = ?').get(artwork)
      : null;
    const artworkTitle = artworkRow?.title || null;

    const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, CONTACT_TO } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !CONTACT_TO) {
      return res.status(500).json({ error: 'SMTP не настроен на сервере' });
    }

    const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT) || 587,
  secure: SMTP_SECURE === 'true',
  auth: { user: SMTP_USER, pass: SMTP_PASS },
  tls: {
    servername: 'smtp.gmail.com',
  },
});

    const subjectArtwork = artworkTitle ? ` по работе «${artworkTitle}»` : '';
    const subject = `Новое сообщение с сайта${subjectArtwork} — от ${name}`;

    const html = `
      <div style="font-family: -apple-system, Arial, sans-serif; max-width: 600px; color:#1a1a1a;">
        <h2 style="font-family: Georgia, serif; font-weight: 400;">Новое сообщение с сайта</h2>
        <p><strong>От:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
        ${artworkTitle ? `<p><strong>Работа:</strong> ${escapeHtml(artworkTitle)}</p>` : ''}
        <hr style="border:none; border-top:1px solid #eee;" />
        <p style="white-space: pre-line; line-height:1.6;">${escapeHtml(message)}</p>
        <hr style="border:none; border-top:1px solid #eee;" />
        <p style="color:#8a8378; font-size:12px;">
          Отвечайте на это письмо — ответ уйдёт напрямую автору сообщения.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Портфолио" <${SMTP_USER}>`,
      to: CONTACT_TO,
      replyTo: `"${name}" <${email}>`,
      subject,
      text: `От: ${name} <${email}>\n${artwork ? `Работа: ${artwork}\n` : ''}\n${message}`,
      html,
    });

    res.json({ ok: true });
  } catch (e) {
    console.error('[contact] Ошибка отправки:', e);
    next(e);
  }
});

export default router;