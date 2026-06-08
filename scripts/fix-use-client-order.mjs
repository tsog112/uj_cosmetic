import fs from 'fs';

const files = [
  'src/app/admin/customers/page.tsx',
  'src/app/admin/products/page.tsx',
  'src/app/admin/products/promote/page.tsx',
  'src/app/admin/reviews/page.tsx',
  'src/app/admin/settings/page.tsx',
];

for (const file of files) {
  let s = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  if (s.startsWith("import { authFetch")) {
    const authImport = s.match(/^import \{ authFetch[^;]+;\n/)?.[0] || '';
    s = s.replace(authImport, '');
    if (!s.startsWith("'use client'")) {
      s = `'use client';\n\n${authImport}${s}`;
    } else {
      s = `'use client';\n\n${authImport}${s.replace(/^'use client';\s*\n?/, '')}`;
    }
  }
  fs.writeFileSync(file, s, 'utf8');
  console.log('fixed', file);
}
