import fs from 'fs';
import path from 'path';

const IMPORT_LINE =
  "import { authorizeAdminRequest } from '@/lib/auth/serverAuth';";

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name === 'route.ts') out.push(p);
  }
  return out;
}

const skip = new Set([
  path.normalize('src/app/api/admin/metrics/rebuild/route.ts'),
]);

function injectGuard(body) {
  const lines = body.split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const match = line.match(
      /^export async function (GET|POST|PUT|PATCH|DELETE)\(([^)]*)\) \{$/,
    );
    if (match) {
      const params = match[2];
      const hasReq =
        /\breq\b/.test(params) ||
        /\brequest\b/.test(params);
      out.push(line);
      i += 1;
      if (hasReq) {
        const next = lines[i] ?? '';
        if (!next.includes('authorizeAdminRequest')) {
          const indent = (next.match(/^(\s*)/) || ['', '  '])[1];
          const reqName = /\brequest\b/.test(params) && !/\breq\b/.test(params)
            ? 'request'
            : 'req';
          out.push(`${indent}const denied = await authorizeAdminRequest(${reqName});`);
          out.push(`${indent}if (denied) return denied;`);
        }
      }
      continue;
    }
    out.push(line);
    i += 1;
  }
  return out.join('\n');
}

const files = walk('src/app/api/admin').filter((f) => !skip.has(path.normalize(f)));

for (const file of files) {
  let s = fs.readFileSync(file, 'utf8');
  if (s.includes('authorizeAdminRequest')) {
    console.log('skip (already)', file);
    continue;
  }
  if (!s.includes(IMPORT_LINE)) {
    const lastImport = [...s.matchAll(/^import .+$/gm)].pop();
    if (lastImport) {
      const insertAt = lastImport.index + lastImport[0].length;
      s = s.slice(0, insertAt) + '\n' + IMPORT_LINE + s.slice(insertAt);
    } else {
      s = IMPORT_LINE + '\n' + s;
    }
  }
  s = injectGuard(s);
  fs.writeFileSync(file, s);
  console.log('patched', file);
}

console.log('done', files.length);
