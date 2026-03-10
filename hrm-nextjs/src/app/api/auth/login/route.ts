import { NextRequest, NextResponse } from 'next/server';

const USERS = [
  { username: 'admin', password: '1234' },
  { username: 'wanwisa', password: '1234' },
];

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  const user = USERS.find(u => u.username === username && u.password === password);
  if (user) {
    return NextResponse.json({ success: true, username: user.username });
  }
  return NextResponse.json({ success: false }, { status: 401 });
}
