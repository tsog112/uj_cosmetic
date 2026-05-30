import { NextRequest, NextResponse } from 'next/server';
import { sendContactMessageToAdmin } from '@/lib/emailService';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Нэр, имэйл, зурвас зэргийг бүрэн оруулна уу.' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Зөв имэйл хаяг оруулна уу.' }, { status: 400 });
    }

    await sendContactMessageToAdmin(name.trim(), email.trim(), message.trim());

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Contact API error:', error);
    return NextResponse.json({ error: error.message || 'Зурвас илгээхэд алдаа гарлаа.' }, { status: 500 });
  }
}
