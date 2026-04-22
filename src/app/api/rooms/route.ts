import { NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [rows]: any = await pool.query('SELECT room_id as value, room_name as label, color, location, capacity FROM tbl_meeting_rooms WHERE is_active = 1');
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
