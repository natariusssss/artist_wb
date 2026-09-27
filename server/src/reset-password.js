import 'dotenv/config';
import bcrypt from 'bcryptjs';
import readline from 'node:readline';
import { db } from './db.js';

/* ============================================================
   Сброс пароля администратора

   Использование:
     npm run reset-password                          → интерактивно
     npm run reset-password admin@studio.art         → спросит пароль
     npm run reset-password admin@studio.art новый   → сразу
   ============================================================ */

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => { rl.close(); resolve(answer); });
  });
}

function askHidden(question) {
  return new Promise(resolve => {
    const stdin = process.stdin;
    const stdout = process.stdout;

    stdout.write(question);
    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    let password = '';

    const onData = (char) => {
      char = char.toString();

      if (char === '\n' || char === '\r' || char === '\u0004') {
        stdin.setRawMode?.(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        stdout.write('\n');
        resolve(password);
      } else if (char === '\u0003') {
        // Ctrl+C
        stdout.write('\n');
        process.exit(1);
      } else if (char === '\u007F' || char === '\b') {
        // Backspace
        if (password.length > 0) {
          password = password.slice(0, -1);
          stdout.write('\b \b');
        }
      } else {
        password += char;
        stdout.write('*');
      }
    };

    stdin.on('data', onData);
  });
}

async function main() {
  console.log('\n🔐 Сброс пароля администратора\n');

  let [email, newPassword] = process.argv.slice(2);

  // 1. Email
  if (!email) {
    email = (await ask('E-mail администратора: ')).trim();
  }
  if (!email) {
    console.error('❌ E-mail обязателен');
    process.exit(1);
  }

  // 2. Проверяем, что пользователь существует
  const user = db.prepare('SELECT id, email FROM users WHERE email = ?').get(email);
  if (!user) {
    console.error(`❌ Пользователь с e-mail "${email}" не найден.`);
    console.log('\nСуществующие администраторы:');
    const all = db.prepare('SELECT id, email, role FROM users').all();
    if (!all.length) {
      console.log('  (нет ни одного)');
      console.log('\n💡 Создайте первого админа: npm run seed');
    } else {
      all.forEach(u => console.log(`  #${u.id}  ${u.email}  [${u.role}]`));
    }
    process.exit(1);
  }

  // 3. Пароль
  if (!newPassword) {
    newPassword = await askHidden('Новый пароль: ');
    if (!newPassword || newPassword.length < 4) {
      console.error('❌ Пароль должен быть не короче 4 символов');
      process.exit(1);
    }
    const confirm = await askHidden('Повторите пароль: ');
    if (confirm !== newPassword) {
      console.error('❌ Пароли не совпадают');
      process.exit(1);
    }
  } else if (newPassword.length < 4) {
    console.error('❌ Пароль должен быть не короче 4 символов');
    process.exit(1);
  }

  // 4. Хешируем и сохраняем
  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user.id);

  console.log(`\n✅ Пароль для "${user.email}" обновлён.\n`);
  console.log('Теперь можно войти:');
  console.log('  🌐 http://localhost:4000/#/admin');
  console.log(`  📧 ${user.email}`);
  console.log(`  🔑 (пароль, который вы только что задали)\n`);
}

main().catch(err => {
  console.error('\n❌ Ошибка:', err.message);
  process.exit(1);
});