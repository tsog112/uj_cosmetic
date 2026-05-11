import { NextRequest, NextResponse } from 'next/server'
import { sendOrderStatusNotification } from '@/lib/emailService'
import {
  getOrderById,
  getUserById,
  updateOrderStatus,
} from '@/lib/services/firestoreService'

const EMAIL_STATUSES = ['confirmed', 'shipped', 'delivered', 'cancelled'] as const
type EmailStatus = typeof EMAIL_STATUSES[number]

function getOrderEmail(order: { customerEmail?: string; email?: string }) {
  return order.customerEmail || order.email || ''
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const status = body.status as EmailStatus

    if (!EMAIL_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Email is not configured for this status' }, { status: 400 })
    }

    const order = await getOrderById(id)
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const user = order.userId ? await getUserById(order.userId) : null
    const customerEmail = body.customerEmail || getOrderEmail(order) || user?.email || ''

    if (!customerEmail) {
      return NextResponse.json({ error: 'Customer email is missing' }, { status: 400 })
    }

    await updateOrderStatus(id, status)

    await sendOrderStatusNotification(customerEmail, {
      id,
      status,
      customerName: body.customerName || order.customerName || 'UJ customer',
      items: body.items || order.items || [],
      total: Number(body.total ?? order.total ?? 0),
      shippingCost: Number(body.shippingCost ?? order.shippingCost ?? 0),
      address: body.address || order.address || '',
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Status email route error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to send status email' }, { status: 500 })
  }
}
