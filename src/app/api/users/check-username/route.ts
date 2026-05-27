import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username')?.trim();
    const excludeUserId = searchParams.get('excludeUserId')?.trim();

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const db = getAdminDb();
    const usersRef = db.collection('users');
    
    // Check if any other user has this displayName or username
    const displaySnap = await usersRef.where('displayName', '==', username).get();
    const usernameSnap = await usersRef.where('username', '==', username).get();
    
    let isAvailable = true;

    for (const doc of displaySnap.docs) {
      if (excludeUserId && doc.id === excludeUserId) continue;
      isAvailable = false;
    }

    for (const doc of usernameSnap.docs) {
      if (excludeUserId && doc.id === excludeUserId) continue;
      isAvailable = false;
    }

    return NextResponse.json({ available: isAvailable });
  } catch (error: any) {
    console.error('Error checking username:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
