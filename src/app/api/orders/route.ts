import { NextResponse } from 'next/server'
import { sendNewOrderNotificationToAdmin } from '@/lib/emailService'
import { getAdminDb } from '@/lib/firebaseAdmin'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const db = getAdminDb()
    const orderSnap = body.id ? await db.collection('orders').doc(body.id).get() : null
    const orderData = orderSnap?.exists ? { id: orderSnap.id, ...orderSnap.data() } : body
    console.log('Order API called with:', orderData.id)

    let settings: { bankName?: string; bankAccount?: string } | null = null
    try {
      settings = (await db.collection('settings').doc('main').get()).data() || {}
    } catch (e) {
      console.error('getSiteSettings failed:', e)
      settings = { bankName: '', bankAccount: '' }
    }

    try {
      await sendNewOrderNotificationToAdmin({
        ...orderData,
        bankAccount: `${settings?.bankName || 'Банк'}: ${settings?.bankAccount || '-'}`,
      })
      console.log('Admin email sent successfully')
    } catch (emailError: any) {
      console.error('Admin email failed:', emailError.message)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Order route error:', error)
    return NextResponse.json({
      error: error.message,
    }, { status: 500 })
  }
}
