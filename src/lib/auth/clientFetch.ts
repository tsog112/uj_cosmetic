'use client';

import { auth } from '@/lib/firebase';

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

/** Firebase ID token-тэй fetch (admin + хэрэглэгчийн хамгаалалттай API) */
export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  const authHeaders = await getAuthHeaders();
  for (const [key, value] of Object.entries(authHeaders)) {
    headers.set(key, value);
  }
  return fetch(input, { ...init, headers });
}

/** Bearer шаардлагатай файл татах (export, тайлан г.м.) */
export async function authDownload(url: string, filename?: string) {
  const res = await authFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Татахад алдаа гарлаа');
  }
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^"]+)"?/i);
  const resolvedName = filename || match?.[1] || 'download';
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = resolvedName;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}
