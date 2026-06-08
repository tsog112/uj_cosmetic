const STATUS_COPY: Record<string, { title: string; body: string }> = {
  pending: {
    title: 'Захиалга хүлээгдэж байна',
    body: 'Таны захиалгын төлбөрийг шалгаж байна. Баталгаажсаны дараа бэлтгэл эхэлнэ.',
  },
  confirmed: {
    title: 'Төлбөр баталгаажлаа',
    body: 'Захиалгаа бэлтгэж эхлэхэд бэлэн болно.',
  },
  processing: {
    title: 'Захиалга бэлдэж байна',
    body: 'Бүтээгдэхүүнүүдийг баглаж, илгээхэд бэлдэж байна.',
  },
  shipped: {
    title: 'Хүргэлтэд гарсан',
    body: 'Захиалга таны хаяг руу явж байна.',
  },
  delivered: {
    title: 'Захиалга хүргэгдлээ',
    body: 'Баярлалаа! Худалдан авсан бүтээгдэхүүн дээрээ сэтгэгдэл үлдэж болно.',
  },
  cancelled: {
    title: 'Захиалга цуцлагдлаа',
    body: 'Захиалга цуцлагдсан төлөвт шилжлээ. Асуулт байвал бидэнтэй холбогдоно уу.',
  },
};

export function orderStatusNotificationContent(status: string, orderNumber?: string) {
  const base = STATUS_COPY[status] || { title: 'Захиалгын шинэчлэл', body: 'Таны захиалгын төлөв өөрчлөгдлөө.' };
  const suffix = orderNumber ? ` (${orderNumber})` : '';
  return {
    title: `${base.title}${suffix}`,
    body: base.body,
    href: '/profile/orders',
  };
}
