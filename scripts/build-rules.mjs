// Builds firestore.rules and storage.rules with the admin emails from
// NEXT_PUBLIC_ADMIN_EMAILS (read from the environment, .env.local or .env).
// Usage: npm run rules   →   firebase deploy --only firestore:rules,storage
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

function fromDotenv(file) {
  if (!existsSync(file)) return undefined;
  const line = readFileSync(file, 'utf8').split(/\r?\n/).find(l => l.trim().startsWith('NEXT_PUBLIC_ADMIN_EMAILS='));
  return line?.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '');
}

const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? fromDotenv('.env.local') ?? fromDotenv('.env');
const emails = (raw || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

if (!emails.length) {
  console.error('NEXT_PUBLIC_ADMIN_EMAILS is empty. Set it in .env.local (or the environment) first.');
  process.exit(1);
}
if (emails.some(e => !/^[^@\s"']+@[^@\s"']+$/.test(e))) {
  console.error('NEXT_PUBLIC_ADMIN_EMAILS contains an invalid email.');
  process.exit(1);
}

const list = `[${emails.map(e => `'${e}'`).join(', ')}]`;
for (const name of ['firestore.rules', 'storage.rules']) {
  const tpl = readFileSync(`firebase/${name}.template`, 'utf8');
  writeFileSync(name, tpl.replace(/__ADMIN_EMAILS__/g, list));
  console.log(`wrote ${name}  (admins: ${emails.join(', ')})`);
}
