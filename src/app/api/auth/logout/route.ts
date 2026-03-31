import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  // To clear a cookie, we set it with an expired date or maxAge 0
  cookies().set({
    name: 'token',
    value: '',
    httpOnly: true,
    path: '/',
    expires: new Date(0),
  });

  return NextResponse.json({ success: true, message: 'Logged out successfully' });
}
