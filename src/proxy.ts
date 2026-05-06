import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // We use a helper cookie set by the client-side AdminLayout
    const isAdmin = request.cookies.get('is_admin')?.value;
    
    // Only strictly block if we explicitly know they are NOT admin.
    // If the cookie is missing, we let the client-side AuthContext load 
    // and handle the redirect, otherwise they can never reach the admin page to set the cookie.
    if (isAdmin === 'false') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
