import { NextResponse } from 'next/server';
import { CANCELLED_ORDER_STATUS, PAID_ORDER_STATUS_VALUES } from '@/lib/constants/admin';
import { getMonthlyReport } from '@/lib/services/firestoreAdminService';
import { authorizeAdminRequest } from '@/lib/auth/serverAuth';

function csvEscape(value: unknown) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(req: Request) {
  const denied = await authorizeAdminRequest(req);
  if (denied) return denied;
  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const year = Number(searchParams.get('year') || now.getFullYear());
    const month = Number(searchParams.get('month') || now.getMonth() + 1);

    const orders = await getMonthlyReport(year, month);

    const rows = [
      ['Огноо', 'Захиалга', 'Хэрэглэгч', 'Утас', 'Email', 'Төлөв', 'Бүтээгдэхүүн', 'Тоо', 'Нэгж үнэ', 'Мөрийн дүн', 'Захиалгын нийт дүн'],
      ...orders.flatMap((order) => {
        const customer = order.customerName || '';
        const phone = order.customerPhone || '';
        const email = order.customerEmail || '';
        return (order.items || []).map((item: any) => [
          order.createdAt.toISOString(),
          order.id,
          customer,
          phone,
          email,
          order.status,
          String(item.product?.name || item.name_mn || ''),
          item.quantity,
          item.price,
          Number(item.quantity || 0) * Number(item.price || 0),
          order.total,
        ]);
      }),
      [],
      ['Тайлангийн хураангуй'],
      ['Нийт захиалга', orders.length],
      [
        'Төлөгдсөн/баталгаажсан орлого',
        orders
          .filter((order) => PAID_ORDER_STATUS_VALUES.includes(order.status as (typeof PAID_ORDER_STATUS_VALUES)[number]))
          .reduce((sum, order) => sum + order.total, 0),
      ],
      ['Цуцлагдсан захиалга', orders.filter((order) => order.status === CANCELLED_ORDER_STATUS).length],
    ];

    const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\r\n');

    return new NextResponse(`\uFEFF${csv}`, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="uj-cosmetic-${year}-${String(month).padStart(2, '0')}-report.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting monthly report:', error);
    return NextResponse.json({ error: 'Failed to export monthly report' }, { status: 500 });
  }
}
