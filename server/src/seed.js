import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db } from './db.js';

const email = process.env.ADMIN_EMAIL || 'admin@studio.art';
const password = process.env.ADMIN_PASSWORD || 'admin123';

const hash = bcrypt.hashSync(password, 10);
db.prepare(`
  INSERT INTO users (email, password_hash, name, role)
  VALUES (?, ?, ?, 'admin')
  ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash
`).run(email, hash, 'Administrator');

const techs = [
  ['pastel','Пастель'], ['watercolor','Акварель'], ['gouache','Гуашь'],
  ['pencil','Карандаш'], ['mixed','Смешанная техника'],
  ['linocut','Линогравюра'], ['xylography','Ксилография'], ['etching','Офорт'],
];
const insTech = db.prepare('INSERT OR IGNORE INTO techniques (slug, name) VALUES (?,?)');
techs.forEach(([slug, name]) => insTech.run(slug, name));

const about = {
  artists: [
    {
      name: "София Парфенова\n        Sofia Parfenova",
      photo: '/uploads/bd52f7cd4ca22997e7c9f7c9.png',
      shortBio: 'Художница, историк искусства\n Artist, Art Historian',
      education: 'Академия художеств в Санкт-Петербурге, Докторат в École du Louvre\n St. Petersburg Academy of Fine Arts; PhD candidate at the École du Louvre ',
    },
    {
      name: 'Егор Шишков\n Egor Shishkov',
      photo: '/uploads/1f5c5287a09f52d2f1055969.png',
      shortBio: 'Художник- график, Архитектор\n Graphic Artist, Architect',
      education: 'Диплом архитектора école nationale supérieure d’architecture Paris-Belleville\n Degree in Architecture, École nationale supérieure d’architecture de Paris-Belleville',
    },
  ],
};
const contacts = {
  email: 'studio.asnieres.contact@gmail.com',
  instagram: '@studio_asnieres',
  instagramUrl: 'https://instagram.com/',
  telegram: '@sonchor',
  city: 'Париж',
};
const insPage = db.prepare(`
  INSERT INTO pages (key, json) VALUES (?, ?)
  ON CONFLICT(key) DO NOTHING
`);
insPage.run('about', JSON.stringify(about));
insPage.run('contacts', JSON.stringify(contacts));

console.log('✅ Seed готов');
console.log(`   Логин: ${email}`);
console.log(`   Пароль: ${password}`);