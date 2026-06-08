import type { ReactNode } from 'react';

type AdminPageShellProps = {
  children: ReactNode;
  className?: string;
};

export default function AdminPageShell({ children, className = '' }: AdminPageShellProps) {
  const extra = className ? ` ${className}` : '';
  return <div className={`admin-page${extra}`}>{children}</div>;
}
