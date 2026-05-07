import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL!

// Email 1: Admin gets notified of new order
export async function sendNewOrderNotificationToAdmin(order: {
  id: string
  customerName: string
  phone: string
  address: string
  items: { name_mn: string; quantity: number; price: number }[]
  total: number
  bankAccount: string
}) {
  const itemsHtml = order.items.map(item =>
    `<tr>
      <td style="padding:10px 16px;border-bottom:1px solid #f0e6d3;">${item.name_mn}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #f0e6d3;text-align:center;">${item.quantity}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #f0e6d3;text-align:right;">${item.price.toLocaleString()}₮</td>
    </tr>`
  ).join('')

  await resend.emails.send({
    from: 'UJ Cosmetic <noreply@ujcosmetic.mn>',
    to: ADMIN_EMAIL,
    subject: `🛒 Шинэ захиалга #${order.id.slice(-6).toUpperCase()} — ${order.total.toLocaleString()}₮`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fdf8f3;">
        <div style="background:#c8a97e;padding:28px 32px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:2px;">UJ COSMETIC</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Шинэ захиалга ирлээ!</p>
        </div>

        <div style="padding:32px;">
          <h2 style="color:#5a3e2b;font-size:18px;margin:0 0 20px;">Захиалга #${order.id.slice(-6).toUpperCase()}</h2>

          <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
            <thead>
              <tr style="background:#f7efe5;">
                <th style="padding:12px 16px;text-align:left;color:#7a6045;font-size:13px;">Бараа</th>
                <th style="padding:12px 16px;text-align:center;color:#7a6045;font-size:13px;">Тоо</th>
                <th style="padding:12px 16px;text-align:right;color:#7a6045;font-size:13px;">Үнэ</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>

          <p style="text-align:right;font-size:18px;font-weight:bold;color:#c8a97e;margin:16px 0 24px;">
            Нийт: ${order.total.toLocaleString()}₮
          </p>

          <div style="background:#fff;border-radius:8px;padding:20px;margin-bottom:20px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
            <h3 style="color:#5a3e2b;font-size:15px;margin:0 0 12px;">Харилцагчийн мэдээлэл</h3>
            <p style="margin:6px 0;color:#555;font-size:14px;">Нэр: <strong>${order.customerName}</strong></p>
            <p style="margin:6px 0;color:#555;font-size:14px;">Утас: <strong>${order.phone}</strong></p>
            <p style="margin:6px 0;color:#555;font-size:14px;">Хаяг: <strong>${order.address}</strong></p>
          </div>

          <div style="background:#fff8ed;border:1px solid #f0d9b5;border-radius:8px;padding:20px;">
            <p style="margin:0 0 8px;font-weight:bold;color:#b8860b;font-size:14px;">⚠️ Төлбөр шалгах:</p>
            <p style="margin:4px 0;color:#555;font-size:14px;">Гүйлгээний утга: <strong>#${order.id.slice(-6).toUpperCase()}</strong></p>
            <p style="margin:4px 0;color:#555;font-size:14px;">Данс: <strong>${order.bankAccount}</strong></p>
            <p style="margin:4px 0;color:#555;font-size:14px;">Дүн: <strong>${order.total.toLocaleString()}₮</strong></p>
          </div>
        </div>
      </div>
    `
  })
}

// Email 2: Customer gets order confirmation
export async function sendOrderConfirmationToCustomer(
  customerEmail: string,
  order: {
    id: string
    customerName: string
    items: { name_mn: string; quantity: number; price: number }[]
    total: number
    shippingCost: number
    address: string
  }
) {
  await resend.emails.send({
    from: 'UJ Cosmetic <noreply@ujcosmetic.mn>',
    to: customerEmail,
    subject: `✅ Захиалга баталгаажлаа — #${order.id.slice(-6).toUpperCase()}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fdf8f3;">
        <div style="background:#c8a97e;padding:28px 32px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:2px;">UJ COSMETIC</h1>
        </div>

        <div style="padding:32px;">
          <h2 style="color:#5a3e2b;font-size:20px;margin:0 0 12px;">Сайн байна уу, ${order.customerName}!</h2>
          <p style="color:#555;font-size:15px;margin:0 0 8px;">
            Таны захиалга <strong>#${order.id.slice(-6).toUpperCase()}</strong> амжилттай баталгаажлаа.
          </p>
          <p style="color:#555;font-size:14px;margin:0 0 24px;">
            Бид тантай удахгүй холбогдож, хүргэлтийн мэдээллийг мэдэгдэнэ.
          </p>

          <div style="background:#fff;border-radius:8px;padding:20px;box-shadow:0 1px 4px rgba(0,0,0,0.06);margin-bottom:20px;">
            <h3 style="color:#5a3e2b;font-size:14px;margin:0 0 14px;text-transform:uppercase;letter-spacing:1px;">Захиалгын дэлгэрэнгүй:</h3>
            ${order.items.map(i => `
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f5ede2;font-size:14px;color:#444;">
                <span>${i.name_mn} × ${i.quantity}</span>
                <span>${i.price.toLocaleString()}₮</span>
              </div>
            `).join('')}
            <div style="display:flex;justify-content:space-between;padding:10px 0;font-size:14px;color:#777;">
              <span>Хүргэлт:</span>
              <span>${order.shippingCost === 0 ? 'Үнэгүй' : order.shippingCost.toLocaleString() + '₮'}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:10px 0;font-weight:bold;font-size:16px;color:#c8a97e;border-top:2px solid #f0e6d3;">
              <span>Нийт:</span>
              <span>${order.total.toLocaleString()}₮</span>
            </div>
          </div>

          <p style="color:#555;font-size:14px;margin:0 0 8px;">Хүргэлтийн хаяг: <strong>${order.address}</strong></p>
          <p style="color:#888;font-size:13px;margin:16px 0 0;">Асуух зүйл байвал Instagram-д <strong>@uj_cosmetic</strong>-д бичнэ үү.</p>
        </div>
      </div>
    `
  })
}

// Email 3: Shipping notification
export async function sendShippingNotification(
  customerEmail: string,
  order: { id: string; customerName: string; address: string }
) {
  await resend.emails.send({
    from: 'UJ Cosmetic <noreply@ujcosmetic.mn>',
    to: customerEmail,
    subject: `📦 Таны захиалга хүргэлтэнд гарлаа! — #${order.id.slice(-6).toUpperCase()}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fdf8f3;">
        <div style="background:#c8a97e;padding:28px 32px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:2px;">UJ COSMETIC</h1>
        </div>

        <div style="padding:32px;text-align:center;">
          <p style="font-size:48px;margin:0 0 16px;">📦</p>
          <h2 style="color:#5a3e2b;font-size:22px;margin:0 0 12px;">Таны захиалга замдаа!</h2>

          <p style="color:#555;font-size:15px;margin:0 0 8px;">Сайн байна уу, <strong>${order.customerName}</strong>!</p>
          <p style="color:#555;font-size:15px;margin:0 0 24px;">
            Захиалга <strong>#${order.id.slice(-6).toUpperCase()}</strong> хүргэлтэнд гарлаа.
          </p>

          <div style="background:#fff;border-radius:8px;padding:20px;box-shadow:0 1px 4px rgba(0,0,0,0.06);text-align:left;">
            <p style="color:#555;font-size:14px;margin:0 0 8px;">Хүргэлтийн хаяг: <strong>${order.address}</strong></p>
            <p style="color:#888;font-size:13px;margin:8px 0 0;">Асуух зүйл байвал <strong>@uj_cosmetic</strong>-д холбогдоно уу.</p>
          </div>
        </div>
      </div>
    `
  })
}
