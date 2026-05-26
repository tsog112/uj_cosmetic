import { NextRequest, NextResponse } from 'next/server'
import { sendOrderStatusNotification } from '@/lib/emailService'

export const runtime = 'nodejs'

const EMAIL_STATUSES = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const
type EmailStatus = typeof EMAIL_STATUSES[number]

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const status = body.status as EmailStatus
    const customerEmail = body.customerEmail as string

    if (!EMAIL_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Email is not configured for this status' }, { status: 400 })
    }

    if (!customerEmail) {
      return NextResponse.json({ error: 'Customer email is missing' }, { status: 400 })
    }

    await sendOrderStatusNotification(customerEmail, {
      id,
      status,
      customerName: body.customerName || 'UJ customer',
      items: body.items || [],
      total: Number(body.total || 0),
      shippingCost: Number(body.shippingCost || 0),
      address: body.address || '',
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Status email route error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to send status email' }, { status: 500 })
  }
}
