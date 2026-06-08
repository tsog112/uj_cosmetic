/** Нэг tab/session дотор нэг удаа л true буцаана (view count г.м.). */
export function sessionOnce(key: string): boolean {
  if (typeof window === 'undefined') return true;
  try {
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, '1');
    return true;
  } catch {
    return true;
  }
}
