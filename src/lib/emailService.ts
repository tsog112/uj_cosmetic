import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''
const FROM_EMAIL = 'UJ Cosmetic <onboarding@resend.dev>'

async function sendEmail(options: {
  to: string
  subject: string
  html: string
}) {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set!')
    return
  }

  if (!options.to) {
    console.error('Email recipient is empty!')
    return
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
    })
    console.log('Email sent successfully:', result)
    return result
  } catch (error: any) {
    console.error('Email send FAILED:', {
      message: error.message,
      statusCode: error.statusCode,
      name: error.name,
    })
    throw error
  }
}

function money(value: number) {
  return `${Number(value || 0).toLocaleString('mn-MN')}₮`
}

function orderItemsHtml(items: { name_mn: string; quantity: number; price: number }[]) {
  return items.map(item => `
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid #f0e6d3;">${item.name_mn}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #f0e6d3;text-align:center;">${item.quantity}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #f0e6d3;text-align:right;">${money(item.price)}</td>
    </tr>
  `).join('')
}

export async function sendNewOrderNotificationToAdmin(order: {
  id: string
  customerName: string
  phone: string
  address: string
  items: { name_mn: string; quantity: number; price: number }[]
  total: number
  bankAccount: string
}) {
  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `Шинэ захиалга #${order.id.slice(-6).toUpperCase()} - ${money(order.total)}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fdf8f3;">
        <div style="background:#FFB7D5;padding:28px 32px;text-align:center;">
          <h1 style="color:#1A1A1A;margin:0;font-size:22px;letter-spacing:2px;">UJ COSMETIC</h1>
          <p style="color:#1A1A1A;margin:8px 0 0;font-size:14px;">Шинэ захиалга ирлээ!</p>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#1A1A1A;font-size:18px;margin:0 0 20px;">Захиалга #${order.id.slice(-6).toUpperCase()}</h2>
          <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;">
            <thead>
              <tr style="background:#fff0f6;">
                <th style="padding:12px 16px;text-align:left;color:#555;font-size:13px;">Бараа</th>
                <th style="padding:12px 16px;text-align:center;color:#555;font-size:13px;">Тоо</th>
                <th style="padding:12px 16px;text-align:right;color:#555;font-size:13px;">Үнэ</th>
              </tr>
            </thead>
            <tbody>${orderItemsHtml(order.items || [])}</tbody>
          </table>
          <p style="text-align:right;font-size:18px;font-weight:bold;color:#1A1A1A;margin:16px 0 24px;">
            Нийт: ${money(order.total)}
          </p>
          <div style="background:#fff;border-radius:8px;padding:20px;margin-bottom:20px;">
            <h3 style="color:#1A1A1A;font-size:15px;margin:0 0 12px;">Харилцагчийн мэдээлэл</h3>
            <p style="margin:6px 0;color:#555;font-size:14px;">Нэр: <strong>${order.customerName}</strong></p>
            <p style="margin:6px 0;color:#555;font-size:14px;">Утас: <strong>${order.phone}</strong></p>
            <p style="margin:6px 0;color:#555;font-size:14px;">Хаяг: <strong>${order.address}</strong></p>
          </div>
          <div style="background:#fff8ed;border:1px solid #f0d9b5;border-radius:8px;padding:20px;">
            <p style="margin:0 0 8px;font-weight:bold;color:#b8860b;font-size:14px;">Төлбөр шалгах:</p>
            <p style="margin:4px 0;color:#555;font-size:14px;">Гүйлгээний утга: <strong>#${order.id.slice(-6).toUpperCase()}</strong></p>
            <p style="margin:4px 0;color:#555;font-size:14px;">Банк: <strong>${order.bankAccount}</strong></p>
            <p style="margin:4px 0;color:#555;font-size:14px;">Дүн: <strong>${money(order.total)}</strong></p>
          </div>
        </div>
      </div>
    `,
  })
}

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
  await sendEmail({
    to: customerEmail,
    subject: `Захиалга баталгаажлаа #${order.id.slice(-6).toUpperCase()}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fdf8f3;">
        <div style="background:#FFB7D5;padding:28px 32px;text-align:center;">
          <h1 style="color:#1A1A1A;margin:0;font-size:22px;letter-spacing:2px;">UJ COSMETIC</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#1A1A1A;font-size:20px;margin:0 0 12px;">Сайн байна уу, ${order.customerName}!</h2>
          <p style="color:#555;font-size:15px;margin:0 0 24px;">
            Таны захиалга <strong>#${order.id.slice(-6).toUpperCase()}</strong> амжилттай баталгаажлаа.
          </p>
          <div style="background:#fff;border-radius:8px;padding:20px;margin-bottom:20px;">
            <h3 style="color:#1A1A1A;font-size:14px;margin:0 0 14px;text-transform:uppercase;letter-spacing:1px;">Захиалгын дэлгэрэнгүй:</h3>
            ${(order.items || []).map(i => `
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f5ede2;font-size:14px;color:#444;">
                <span>${i.name_mn} x ${i.quantity}</span>
                <span>${money(i.price)}</span>
              </div>
            `).join('')}
            <div style="display:flex;justify-content:space-between;padding:10px 0;font-size:14px;color:#777;">
              <span>Хүргэлт:</span>
              <span>${order.shippingCost === 0 ? 'Үнэгүй' : money(order.shippingCost)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:10px 0;font-weight:bold;font-size:16px;color:#1A1A1A;border-top:2px solid #f0e6d3;">
              <span>Нийт:</span>
              <span>${money(order.total)}</span>
            </div>
          </div>
          <p style="color:#555;font-size:14px;margin:0 0 8px;">Хүргэлтийн хаяг: <strong>${order.address}</strong></p>
        </div>
      </div>
    `,
  })
}

export async function sendShippingNotification(
  customerEmail: string,
  order: { id: string; customerName: string; address: string }
) {
  await sendEmail({
    to: customerEmail,
    subject: `Таны захиалга хүргэлтэнд гарлаа #${order.id.slice(-6).toUpperCase()}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fdf8f3;">
        <div style="background:#FFB7D5;padding:28px 32px;text-align:center;">
          <h1 style="color:#1A1A1A;margin:0;font-size:22px;letter-spacing:2px;">UJ COSMETIC</h1>
        </div>
        <div style="padding:32px;text-align:center;">
          <h2 style="color:#1A1A1A;font-size:22px;margin:0 0 12px;">Таны захиалга замдаа!</h2>
          <p style="color:#555;font-size:15px;margin:0 0 8px;">Сайн байна уу, <strong>${order.customerName}</strong>!</p>
          <p style="color:#555;font-size:15px;margin:0 0 24px;">
            Захиалга <strong>#${order.id.slice(-6).toUpperCase()}</strong> хүргэлтэнд гарлаа.
          </p>
          <div style="background:#fff;border-radius:8px;padding:20px;text-align:left;">
            <p style="color:#555;font-size:14px;margin:0;">Хүргэлтийн хаяг: <strong>${order.address}</strong></p>
          </div>
        </div>
      </div>
    `,
  })
}
