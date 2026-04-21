import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Use an environment variable for the secret in production
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_fallback_key_xyz_12345';
const secretKey = new TextEncoder().encode(JWT_SECRET);

// Array of paths that don't require authentication
const publicPaths = ['/login'];
const publicApiPaths = ['/api/auth/login', '/api/auth/logout'];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Static files and internal Next.js paths are allowed
  if (
    path.startsWith('/_next') ||
    path.startsWith('/favicon.ico') ||
    path.startsWith('/uploads/') ||
    path.match(/\.(png|jpg|jpeg|svg|webp|avif|gif)$/)
  ) {
    return NextResponse.next();
  }

  const isPublicPath = publicPaths.includes(path);
  const isPublicApiPath = publicApiPaths.some(p => path.startsWith(p));

  // Debug log for middleware
  try {
    const fs = require('fs');
    const msg = `[MIDDLEWARE] ${new Date().toISOString()} - Path: ${path} - isPublicApi: ${isPublicApiPath}\n`;
    fs.appendFileSync('login_debug.log', msg);
  } catch (e) { }

  if (isPublicApiPath) {
    return NextResponse.next();
  }

  // Check for the auth cookie
  const token = req.cookies.get('token')?.value;

  // Let's verify the token securely using 'jose'
  let isTokenValid = false;
  if (token) {
    try {
      await jwtVerify(token, secretKey);
      isTokenValid = true;
    } catch (err) {
      isTokenValid = false;
    }
  }

  // Logic for API Routes
  if (path.startsWith('/api/')) {
    if (!isTokenValid) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access. Please login.' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // Logic for UI Pages
  if (!isPublicPath && !isTokenValid) {
    // Redirect unauthenticated users to login
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  if (isPublicPath && isTokenValid) {
    // If user is already logged in and tries to access /login, redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  return NextResponse.next();
}

// Ensure middleware only runs on matching paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
