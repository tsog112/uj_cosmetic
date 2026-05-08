import { NextResponse } from 'next/server'
import { sendShippingNotification } from '@/lib/emailService'
import {
  getOrderById,
  getUserById,
  updateOrderStatus,
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

    await updateOrderStatus(id, 'shipped')

    const user = order.userId ? await getUserById(order.userId) : null
    if (user?.email) {
      await sendShippingNotification(user.email, {
        id: order.id,
        customerName: order.customerName,
        address: order.address,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Order ship error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
