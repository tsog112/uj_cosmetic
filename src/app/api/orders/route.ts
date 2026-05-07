import { NextResponse } from 'next/server'
import { sendNewOrderNotificationToAdmin } from '@/lib/emailService'
import { getSiteSettings } from '@/lib/services/firestoreService'

export async function POST(request: Request) {
  try {
    const orderData = await request.json()
    const settings = await getSiteSettings()

    const bankAccount = settings
      ? `${settings.bankName}: ${settings.bankAccount}`
      : 'Хаан Банк: —'

    await sendNewOrderNotificationToAdmin({
      ...orderData,
      bankAccount,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Order notification error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
