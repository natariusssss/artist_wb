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
  name: 'Анна Морозова',
  photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=900&q=80',
  shortBio: 'Художник-график. Работаю с пастелью, акварелью и печатной графикой.',
  education: 'МГАХИ им. В. И. Сурикова, факультет графики. Стажировка в École des Beaux-Arts, Париж.',
  practice: 'В своей практике исследую свет и воздух через бумагу. Работаю сериями.',
  exhibitions: [
    '2024 — «Тихие поверхности», Galerie Lumen, Париж',
    '2023 — «Бумага и свет», ЦТИ «Фабрика», Москва',
  ]
};
const contacts = {
  email: 'studio@annamorozova.art',
  instagram: '@anna.morozova.art',
  instagramUrl: 'https://instagram.com/',
  telegram: '@anna_studio',
  city: 'Париж / Москва',
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