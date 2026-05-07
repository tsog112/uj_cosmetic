import { NextResponse } from 'next/server'
import { sendShippingNotification } from '@/lib/emailService'
import {
  getOrderById,
  updateOrderStatus,
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

    // Update Firestore status
    await updateOrderStatus(id, 'shipped')

    // Get customer email and send shipping notification
    const user = order.userId ? await getUserById(order.userId) : null
    if (user?.email) {
      await sendShippingNotification(user.email, {
        id: order.id,
        customerName: order.customerName,
        address: order.address,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Order ship error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
