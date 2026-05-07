import { NextResponse } from 'next/server'
import { sendShippingNotification } from '@/lib/emailService'
import {
  getOrderById,
  getUserById,
} from '@/lib/services/firestoreService'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const order = await getOrderById(id)
    if (!order) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Email should not block the admin status update.
    try {
      const user = order.userId ? await getUserById(order.userId) : null
      if (user?.email) {
        await sendShippingNotification(user.email, {
          id: order.id,
          customerName: order.customerName,
          address: order.address,
        })
      }
    } catch (emailError) {
      console.warn('Order shipping email failed (non-blocking):', emailError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Order ship error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
