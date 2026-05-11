import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'UJ Cosmetic <noreply@uj-cosmetic.kro.kr>'

type EmailOptions = {
  to: string
  subject: string
  html: string
}

type EmailItem = {
  name_mn?: string
  name?: string
  quantity: number
  price: number
}

const colors = {
  bg: '#FFF8FB',
  panel: '#FFFFFF',
  blush: '#FFB7D5',
  blushSoft: '#FFF0F6',
  border: '#F2A8C8',
  text: '#1A1A1A',
  muted: '#8B6B78',
  warning: '#9A6A14',
  warningBg: '#FFF7E6',
  warningBorder: '#F1D28A',
}

async function sendEmail(options: EmailOptions) {
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

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function money(value: number) {
  return `${Number(value || 0).toLocaleString('mn-MN')}₮`
}

function orderCode(orderId: string) {
  return orderId.slice(-6).toUpperCase()
}

function itemName(item: EmailItem) {
  return escapeHtml(item.name_mn || item.name || 'Бүтээгдэхүүн')
}

function emailShell(options: {
  eyebrow: string
  title: string
  subtitle?: string
  children: string
  footerNote?: string
}) {
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(options.title)}</title>
      </head>
      <body style="margin:0;padding:0;background:${colors.bg};font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;color:${colors.text};">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${colors.bg};margin:0;padding:32px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:${colors.panel};border:1px solid rgba(242,168,200,0.45);">
                <tr>
                  <td style="padding:34px 28px 28px;text-align:center;background:${colors.blushSoft};border-bottom:1px solid rgba(242,168,200,0.55);">
                    <div style="font-family:Georgia,'Times New Roman',serif;font-size:34px;letter-spacing:0.14em;font-weight:400;color:${colors.text};line-height:1;">UJ</div>
                    <div style="margin-top:14px;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${colors.muted};font-weight:600;">UJ Cosmetic</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:34px 28px 10px;">
                    <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${colors.muted};font-weight:600;margin-bottom:12px;">${escapeHtml(options.eyebrow)}</div>
                    <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.18;font-weight:400;color:${colors.text};">${escapeHtml(options.title)}</h1>
                    ${options.subtitle ? `<p style="margin:14px 0 0;font-size:14px;line-height:1.7;color:${colors.muted};">${escapeHtml(options.subtitle)}</p>` : ''}
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 28px 34px;">
                    ${options.children}
                  </td>
                </tr>
                <tr>
                  <td style="padding:22px 28px;background:${colors.bg};border-top:1px solid rgba(242,168,200,0.45);text-align:center;">
                    <p style="margin:0;font-size:12px;line-height:1.7;color:${colors.muted};">
                      ${escapeHtml(options.footerNote || 'UJ Cosmetic · Монгол арьсанд зориулсан Солонгос гоо сайхны арчилгаа')}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `
}

function section(title: string, content: string) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${colors.panel};border:1px solid rgba(242,168,200,0.45);margin:0 0 18px;">
      <tr>
        <td style="padding:18px 18px 0;">
          <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${colors.muted};font-weight:600;">${escapeHtml(title)}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 18px 18px;">
          ${content}
        </td>
      </tr>
    </table>
  `
}

function orderItemsTable(items: EmailItem[], total: number, shippingCost?: number) {
  const rows = (items || []).map(item => `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid rgba(242,168,200,0.35);font-size:14px;line-height:1.5;color:${colors.text};">
        ${itemName(item)}
      </td>
      <td style="padding:14px 12px;border-bottom:1px solid rgba(242,168,200,0.35);font-size:13px;color:${colors.muted};text-align:center;white-space:nowrap;">
        × ${Number(item.quantity || 1)}
      </td>
      <td style="padding:14px 0;border-bottom:1px solid rgba(242,168,200,0.35);font-size:14px;color:${colors.text};text-align:right;white-space:nowrap;">
        ${money(Number(item.price || 0) * Number(item.quantity || 1))}
      </td>
    </tr>
  `).join('')

  return section('Захиалгын дэлгэрэнгүй', `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      <thead>
        <tr>
          <th align="left" style="padding:0 0 10px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${colors.muted};font-weight:600;border-bottom:1px solid rgba(242,168,200,0.55);">Бараа</th>
          <th align="center" style="padding:0 12px 10px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${colors.muted};font-weight:600;border-bottom:1px solid rgba(242,168,200,0.55);">Тоо</th>
          <th align="right" style="padding:0 0 10px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${colors.muted};font-weight:600;border-bottom:1px solid rgba(242,168,200,0.55);">Дүн</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    ${shippingCost !== undefined ? `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:14px;">
        <tr>
          <td style="padding:6px 0;font-size:14px;color:${colors.muted};">Хүргэлт</td>
          <td align="right" style="padding:6px 0;font-size:14px;color:${colors.text};">${shippingCost === 0 ? 'Үнэгүй' : money(shippingCost)}</td>
        </tr>
      </table>
    ` : ''}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:14px;border-top:1px solid rgba(242,168,200,0.65);">
      <tr>
        <td style="padding-top:16px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:${colors.muted};font-weight:600;">Нийт дүн</td>
        <td align="right" style="padding-top:16px;font-size:22px;font-family:Georgia,'Times New Roman',serif;color:${colors.text};">${money(total)}</td>
      </tr>
    </table>
  `)
}

function infoRows(rows: { label: string; value?: string | number }[]) {
  return rows.map(row => `
    <tr>
      <td style="padding:7px 0;font-size:13px;color:${colors.muted};vertical-align:top;width:34%;">${escapeHtml(row.label)}</td>
      <td style="padding:7px 0;font-size:14px;line-height:1.6;color:${colors.text};vertical-align:top;">${escapeHtml(row.value || '-')}</td>
    </tr>
  `).join('')
}

export async function sendNewOrderNotificationToAdmin(order: {
  id: string
  customerName: string
  phone: string
  address: string
  items: EmailItem[]
  total: number
  bankAccount: string
}) {
  const code = orderCode(order.id)
  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `Шинэ захиалга #${code} - ${money(order.total)}`,
    html: emailShell({
      eyebrow: 'Шинэ захиалга',
      title: `Захиалга #${code}`,
      subtitle: 'Админ хэсэгт орж төлбөр болон захиалгын мэдээллийг шалгана уу.',
      children: `
        ${orderItemsTable(order.items || [], order.total)}
        ${section('Харилцагчийн мэдээлэл', `
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            ${infoRows([
              { label: 'Нэр', value: order.customerName },
              { label: 'Утас', value: order.phone },
              { label: 'Хаяг', value: order.address },
            ])}
          </table>
        `)}
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${colors.warningBg};border:1px solid ${colors.warningBorder};">
          <tr>
            <td style="padding:18px;">
              <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${colors.warning};font-weight:700;margin-bottom:12px;">Төлбөр шалгах</div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                ${infoRows([
                  { label: 'Гүйлгээний утга', value: `#${code}` },
                  { label: 'Банк', value: order.bankAccount },
                  { label: 'Дүн', value: money(order.total) },
                ])}
              </table>
            </td>
          </tr>
        </table>
      `,
    }),
  })
}

export async function sendOrderConfirmationToCustomer(
  customerEmail: string,
  order: {
    id: string
    customerName: string
    items: EmailItem[]
    total: number
    shippingCost: number
    address: string
  }
) {
  const code = orderCode(order.id)
  await sendEmail({
    to: customerEmail,
    subject: `Захиалга баталгаажлаа #${code}`,
    html: emailShell({
      eyebrow: 'Захиалга баталгаажлаа',
      title: `Баярлалаа, ${order.customerName}`,
      subtitle: `Таны #${code} дугаартай захиалга баталгаажлаа. Бид захиалгыг бэлтгээд хүргэлтэнд гармагц дахин мэдэгдэнэ.`,
      children: `
        ${orderItemsTable(order.items || [], order.total, order.shippingCost)}
        ${section('Хүргэлтийн мэдээлэл', `
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            ${infoRows([
              { label: 'Хүлээн авагч', value: order.customerName },
              { label: 'Хаяг', value: order.address },
            ])}
          </table>
        `)}
      `,
    }),
  })
}

export async function sendShippingNotification(
  customerEmail: string,
  order: { id: string; customerName: string; address: string }
) {
  const code = orderCode(order.id)
  await sendEmail({
    to: customerEmail,
    subject: `Захиалга хүргэлтэнд гарлаа #${code}`,
    html: emailShell({
      eyebrow: 'Хүргэлтийн мэдэгдэл',
      title: 'Таны захиалга замдаа гарлаа',
      subtitle: `Сайн байна уу, ${order.customerName}. #${code} дугаартай захиалга хүргэлтэнд гарлаа.`,
      children: section('Хүргэлтийн хаяг', `
        <p style="margin:0;font-size:14px;line-height:1.8;color:${colors.text};">${escapeHtml(order.address)}</p>
      `),
    }),
  })
}

export async function sendOrderStatusNotification(
  customerEmail: string,
  order: {
    id: string
    customerName: string
    items?: EmailItem[]
    total?: number
    shippingCost?: number
    address?: string
    status: 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  }
) {
  const code = orderCode(order.id)
  const copy = {
    confirmed: {
      subject: `Захиалга баталгаажлаа #${code}`,
      eyebrow: 'Захиалга баталгаажлаа',
      title: `Баярлалаа, ${order.customerName}`,
      subtitle: `Таны #${code} дугаартай захиалга баталгаажлаа. Бид захиалгыг бэлтгээд хүргэлтийн явцыг дахин мэдэгдэнэ.`,
    },
    shipped: {
      subject: `Захиалга хүргэлтэнд гарлаа #${code}`,
      eyebrow: 'Хүргэлтийн мэдээлэл',
      title: 'Таны захиалга замдаа гарлаа',
      subtitle: `${order.customerName}, таны #${code} дугаартай захиалга хүргэлтэнд гарлаа.`,
    },
    delivered: {
      subject: `Захиалга хүргэгдлээ #${code}`,
      eyebrow: 'Захиалга хүргэгдлээ',
      title: 'Таны захиалга амжилттай хүргэгдлээ',
      subtitle: `UJ Cosmetic-ийг сонгосонд баярлалаа. Бүтээгдэхүүнээ хэрэглээд сэтгэгдлээ үлдээвэл бидэнд их тус болно.`,
    },
    cancelled: {
      subject: `Захиалга цуцлагдлаа #${code}`,
      eyebrow: 'Захиалга цуцлагдлаа',
      title: 'Таны захиалгын төлөв шинэчлэгдлээ',
      subtitle: `Таны #${code} дугаартай захиалга цуцлагдсан төлөвтэй боллоо. Асуух зүйл байвал бидэнтэй холбогдоорой.`,
    },
  }[order.status]

  await sendEmail({
    to: customerEmail,
    subject: copy.subject,
    html: emailShell({
      eyebrow: copy.eyebrow,
      title: copy.title,
      subtitle: copy.subtitle,
      children: `
        ${order.items?.length ? orderItemsTable(order.items, Number(order.total || 0), order.shippingCost) : ''}
        ${section('Захиалгын мэдээлэл', `
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            ${infoRows([
              { label: 'Захиалгын дугаар', value: `#${code}` },
              { label: 'Төлөв', value: copy.eyebrow },
              { label: 'Хүлээн авагч', value: order.customerName },
              { label: 'Хаяг', value: order.address || '-' },
            ])}
          </table>
        `)}
      `,
      footerNote: 'UJ Cosmetic · Захиалгын төлөв шинэчлэгдсэн тухай мэдэгдэл',
    }),
  })
}
