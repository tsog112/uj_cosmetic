import { NextRequest, NextResponse } from 'next/server';
import { listAdminOrders } from '@/lib/services/firestoreAdminService';
import * as XLSX from 'xlsx';
import { formatMNT } from '@/lib/utils/format';
import { ORDER_STATUSES } from '@/lib/constants/admin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Fetch all matching orders (we set limit extremely high to get all)
    const { orders } = await listAdminOrders({ 
      status, 
      limit: 10000 
    });

    let filteredOrders = orders;

    if (dateFrom || dateTo) {
      filteredOrders = orders.filter((order: any) => {
        const orderDate = new Date(order.createdAt);
        if (dateFrom && orderDate < new Date(dateFrom)) return false;
        if (dateTo && orderDate > new Date(dateTo)) return false;
        return true;
      });
    }

    const rows = filteredOrders.flatMap((order: any) => {
      const statusLabel = ORDER_STATUSES.find(s => s.value === order.status)?.label || order.status;
      const orderDate = new Intl.DateTimeFormat('mn-MN', {
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
      }).format(order.createdAt);

      return (order.items || []).map((item: any) => ({
        'Дугаар': order.id,
        'Огноо': orderDate,
        'Төлөв': statusLabel,
        'Харилцагч': order.customerName || order.user?.name || 'Зочин',
        'Утас': order.customerPhone || order.user?.phone || '',
        'Бүтээгдэхүүн': item.product?.name || 'Тодорхойгүй',
        'Тоо': item.quantity || 0,
        'Нэгж үнэ': formatMNT(item.price || 0),
        'Мөрийн дүн': formatMNT((item.price || 0) * (item.quantity || 0)),
        'Нийт дүн': formatMNT(order.total || 0),
        'Хаяг': order.shippingAddress || ''
      }));
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
    
    // Auto-size columns roughly
    const colWidths = [
      { wch: 25 }, // Дугаар
      { wch: 18 }, // Огноо
      { wch: 15 }, // Төлөв
      { wch: 20 }, // Харилцагч
      { wch: 12 }, // Утас
      { wch: 30 }, // Бүтээгдэхүүн
      { wch: 8 },  // Тоо
      { wch: 15 }, // Нэгж үнэ
      { wch: 15 }, // Мөрийн дүн
      { wch: 15 }, // Нийт дүн
      { wch: 40 }, // Хаяг
    ];
    worksheet['!cols'] = colWidths;

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="uj-orders-${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    });

  } catch (error) {
    console.error('Error exporting orders:', error);
    return NextResponse.json({ error: 'Failed to export orders' }, { status: 500 });
  }
}
