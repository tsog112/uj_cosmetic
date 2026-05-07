import { NextResponse } from 'next/server'
import { sendNewOrderNotificationToAdmin } from '@/lib/emailService'
import { getSiteSettings } from '@/lib/services/firestoreService'

export async function POST(request: Request) {
  try {
    const orderData = await request.json()
    console.log('Order API called with:', orderData.id)

    let settings: { bankName?: string; bankAccount?: string } | null = null
    try {
      settings = await getSiteSettings()
    } catch (e) {
      console.error('getSiteSettings failed:', e)
      settings = { bankName: 'Банк', bankAccount: '-' }
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
