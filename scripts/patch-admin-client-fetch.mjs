import fs from 'fs';

const files = [
  'src/app/admin/orders/page.tsx',
  'src/app/admin/customers/page.tsx',
  'src/app/admin/settings/page.tsx',
  'src/app/admin/reviews/page.tsx',
  'src/app/admin/products/page.tsx',
  'src/app/admin/analytics/page.tsx',
  'src/app/admin/products/promote/page.tsx',
  'src/components/admin/ProductForm.tsx',
  'src/components/admin/InstagramSettings.tsx',
  'src/app/(public)/settings/page.tsx',
  'src/app/(public)/shop/[slug]/page.tsx',
  'src/app/(public)/reviews/page.tsx',
];

const importLine = "import { authFetch, authDownload } from '@/lib/auth/clientFetch';";
const importLineFetchOnly = "import { authFetch } from '@/lib/auth/clientFetch';";

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.log('missing', file);
    continue;
  }
  let s = fs.readFileSync(file, 'utf8');
  const needsAuth = s.includes('/api/admin/');
  if (!needsAuth) continue;

  const useDownload = s.includes('window.open') && s.includes('/api/admin/');
  const line = useDownload ? importLine : importLineFetchOnly;
  if (!s.includes('@/lib/auth/clientFetch')) {
    const m = s.match(/^'use client';\s*\n/m);
    if (m) {
      s = s.replace(m[0], `${m[0]}${line}\n`);
    } else {
      s = `${line}\n${s}`;
    }
  }

  while (s.includes("fetch('/api/admin") || s.includes('fetch(`/api/admin') || s.includes('fetch("/api/admin')) {
    s = s.replace(/await fetch\((['`])\/api\/admin/g, 'await authFetch($1/api/admin');
    s = s.replace(/(?<!auth)fetch\((['`])\/api\/admin/g, 'authFetch($1/api/admin');
  }
  s = s.replace(/fetch\((['`])\/api\/admin/g, (match, q, offset, str) => {
    const before = str.slice(Math.max(0, offset - 12), offset);
    if (before.includes('authFetch')) return match;
    return `authFetch(${q}/api/admin`;
  });

  if (file.includes('orders/page.tsx') && s.includes('window.open(url.toString()')) {
    s = s.replace(
      /const handleExportDelivery = \(option: 'single' \| 'multi'\) => \{[\s\S]*?window\.open\(url\.toString\(\), '_blank'\);\s*\};/,
      `const handleExportDelivery = async (option: 'single' | 'multi') => {
    const url = new URL('/api/admin/orders/export', window.location.origin);
    url.searchParams.set('format', 'xlsx');
    url.searchParams.set('sheet_mode', option === 'multi' ? 'multi' : 'single');
    if (activeTab !== ADMIN_ALL_FILTER_VALUE) {
      url.searchParams.set('status', activeTab);
    }
    if (debouncedSearch) url.searchParams.set('search', debouncedSearch);
    if (dateFrom) url.searchParams.set('date_from', dateFrom);
    if (dateTo) url.searchParams.set('date_to', dateTo);
    if (selectedRegionId) url.searchParams.set('region_id', selectedRegionId);
    if (selectedDistrictId) url.searchParams.set('district_id', selectedDistrictId);
    if (selectedKhorooId) url.searchParams.set('khoroo_id', selectedKhorooId);
    if (viewingArchived) url.searchParams.set('archived', 'true');
    try {
      await authDownload(url.toString());
    } catch {
      showToast('Экспорт татахад алдаа гарлаа', 'error');
    }
  };`,
    );
  }

  fs.writeFileSync(file, s);
  console.log('patched', file);
}
