import Link from 'next/link';

export default function AdminSeedPage() {
  return (
    <div className="space-y-5 p-4 pb-[104px]">
      <section className="rounded-[28px] bg-white p-6 shadow-[var(--shadow-mobile-card)]">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-brand-accent)]">Data import</p>
        <h1 className="mt-2 text-[24px] font-extrabold text-[var(--color-brand-text)]">Seed дата идэвхгүй</h1>
        <p className="mt-3 text-[13px] leading-relaxed text-[var(--color-brand-muted)]">
          Админ source code дотор demo бүтээгдэхүүн хадгалахгүй байхаар seed хуудсыг идэвхгүй болголоо. Барааг зөвхөн бүтээгдэхүүн нэмэх form эсвэл import API-аар оруулна.
        </p>
      </section>
      <Link href="/admin/products/new" className="flex h-12 items-center justify-center rounded-full bg-[var(--color-brand-accent)] text-sm font-extrabold text-white">
        Бараа нэмэх
      </Link>
    </div>
  );
}
