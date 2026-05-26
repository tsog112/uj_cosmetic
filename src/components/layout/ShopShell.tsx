import { shopShellClass } from '@/lib/layout/shell';

export default function ShopShell({ children }: { children: React.ReactNode }) {
  return <div className={shopShellClass}>{children}</div>;
}
