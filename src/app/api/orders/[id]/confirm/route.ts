import { NextResponse } from 'next/server'
import { sendOrderConfirmationToCustomer } from '@/lib/emailService'
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
    await updateOrderStatus(id, 'confirmed')

    // Email should not block the admin status update.
    try {
      const user = order.userId ? await getUserById(order.userId) : null
      if (user?.email) {
        await sendOrderConfirmationToCustomer(user.email, {
          id: order.id,
          customerName: order.customerName,
          items: order.items,
          total: order.total,
          shippingCost: order.shippingCost,
          address: order.address,
        })
      }
    } catch (emailError) {
      console.warn('Order confirmation email failed (non-blocking):', emailError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Order confirm error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
