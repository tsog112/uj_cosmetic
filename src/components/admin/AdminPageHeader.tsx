type AdminPageHeaderProps = {
  /** Optional count or short context — not the page title (layout shows that). */
  meta?: string;
  action?: React.ReactNode;
};

export default function AdminPageHeader({ meta, action }: AdminPageHeaderProps) {
  if (!meta && !action) return null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {meta ? (
        <p className="text-[13px] font-semibold text-[var(--color-text-muted)]">{meta}</p>
      ) : (
        <span aria-hidden className="hidden sm:block" />
      )}
      {action ? <div className="flex shrink-0 flex-wrap gap-2 sm:ml-auto">{action}</div> : null}
    </div>
  );
}
