import { NextResponse } from 'next/server'
import { sendOrderConfirmationToCustomer } from '@/lib/emailService'
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
    console.log('Confirm API called for order:', id)

    const order = await getOrderById(id)
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    await updateOrderStatus(id, 'confirmed')
    console.log('Order status updated to confirmed')

    const user = order.userId ? await getUserById(order.userId) : null
    console.log('Customer user:', user?.email)

    if (user?.email) {
      await sendOrderConfirmationToCustomer(user.email, {
        id: order.id,
        customerName: order.customerName,
        items: order.items,
        total: order.total,
        shippingCost: order.shippingCost,
        address: order.address,
      })
      console.log('Confirmation email sent to:', user.email)
    } else {
      console.warn('No email found for userId:', order.userId)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Confirm route error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
