type AdminPageHeaderProps = {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
};

export default function AdminPageHeader({ eyebrow, title, action }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-brand-accent)]">{eyebrow}</p>
        <h1 className="mt-1 font-serif text-[26px] leading-tight text-[var(--color-brand-text)]">{title}</h1>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
