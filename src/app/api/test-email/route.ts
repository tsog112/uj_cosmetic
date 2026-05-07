import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function GET() {
  const apiKey = process.env.RESEND_API_KEY
  const adminEmail = process.env.ADMIN_EMAIL

  if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 })
  if (!adminEmail) return NextResponse.json({ error: 'ADMIN_EMAIL not set' }, { status: 500 })

  const resend = new Resend(apiKey)

  try {
    const result = await resend.emails.send({
      from: 'UJ Cosmetic <onboarding@resend.dev>',
      to: adminEmail,
      subject: '✅ UJ Cosmetic email тест амжилттай!',
      html: `
        <h1>Имэйл ажиллаж байна!</h1>
        <p>Энэ бол тест и-мэйл. Email систем зөв тохируулагдсан байна.</p>
      `,
    })
    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      statusCode: error.statusCode,
      details: error,
    }, { status: 500 })
  }
}
