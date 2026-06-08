/**
 * Prisma CLI-д .env уншуулж, DIRECT_URL байхгүй бол DATABASE_URL-аар дүүргэнэ.
 * Ингэснээр `npx prisma migrate deploy` шууд ажиллахгүй тохиолдолд
 * `npm run db:migrate` ашиглахад хангалттай.
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const root = process.cwd();

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

// Next.js-тэй ижил дараалал: .env → .env.local
parseEnvFile(path.join(root, '.env'));
parseEnvFile(path.join(root, '.env.local'));

if (!process.env.DATABASE_URL) {
  console.error(
    '❌ DATABASE_URL олдсонгүй. .env файлд Postgres холболтын мөрөө нэмнэ үү.\n' +
      '   Жишээ: DATABASE_URL="postgresql://user:pass@host:5432/dbname"',
  );
  process.exit(1);
}

if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
  console.warn('⚠️  DIRECT_URL байхгүй тул DATABASE_URL-ийг ашиглаж байна (migrate-д зөв).');
}

const args = process.argv.slice(2);
if (!args.length) {
  console.error('Usage: node scripts/prisma-with-env.mjs <prisma-args...>');
  process.exit(1);
}

execSync(`npx prisma ${args.map((a) => `"${a.replace(/"/g, '\\"')}"`).join(' ')}`, {
  stdio: 'inherit',
  env: process.env,
  shell: true,
});
