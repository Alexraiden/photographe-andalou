import 'dotenv/config';
import readline from 'readline';
import { getDb, closeDb } from './db.js';
import { hashPassword } from '../services/authService.js';

function prompt(question, hidden = false) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function seed() {
  const email = process.env.ADMIN_EMAIL || await prompt('Admin email: ');
  const password = process.env.ADMIN_PASSWORD || await prompt('Admin password: ');

  if (!email || !password) {
    console.error('Email and password are required.');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  const hash = await hashPassword(password);
  const db = getDb();

  db.prepare(
    'INSERT OR REPLACE INTO admin_users (id, email, password, updated_at) VALUES (1, ?, ?, datetime(\'now\'))'
  ).run(email, hash);

  console.log(`Admin user created: ${email}`);
  closeDb();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
