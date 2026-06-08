'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatMNT } from '@/lib/utils/format';
import SkeletonCard from '@/components/admin/SkeletonCard';

type Props = {
  labels: string[];
  revenue: number[];
  orders?: number[];
  loading?: boolean;
  height?: number;
  barSize?: number;
};

export default function AdminRevenueBarChart({ labels, revenue, loading, height = 280, barSize = 20 }: Props) {
  const rows = labels.map((name, index) => ({
    name,
    revenue: revenue[index] || 0,
  }));

  if (loading) return <SkeletonCard className="h-[280px]" />;

  if (!rows.length) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-[18px] bg-[var(--color-bg)]">
        <p className="text-sm font-bold text-[var(--color-text-muted)]">Харуулах дата алга байна</p>
      </div>
    );
  }

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 12, right: 4, left: -12, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="4 4" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-text-muted)', fontWeight: 600 }} dy={8} />
          <YAxis hide />
          <Tooltip
            formatter={(value) => [formatMNT(Number(value || 0)), 'Орлого']}
            contentStyle={{ borderRadius: 14, border: '1px solid var(--color-border)', fontSize: 12, fontWeight: 700 }}
            cursor={{ fill: 'var(--color-brand-light)', opacity: 0.35 }}
          />
          <Bar dataKey="revenue" fill="var(--color-brand)" radius={[10, 10, 0, 0]} barSize={barSize} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
