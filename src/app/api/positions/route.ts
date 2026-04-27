import { NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT * FROM tbl_positions ORDER BY pos_id');
    return NextResponse.json(rows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pos_name, description } = body;
    let { pos_id } = body;

    if (!pos_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Check if position name already exists
    const [existing]: any = await pool.query(
      'SELECT pos_id FROM tbl_positions WHERE pos_name = ?',
      [pos_name.trim()]
    );

    if (existing.length > 0) {
      return NextResponse.json({ 
        pos_id: existing[0].pos_id, 
        message: 'Existing position found' 
      }, { status: 200 });
    }

    // 2. Generate pos_id if not provided
    if (!pos_id) {
      const [rows]: any = await pool.query('SELECT pos_id FROM tbl_positions');
      let maxNum = 0;
      rows.forEach((r: any) => {
        const match = r.pos_id.match(/POS(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      });
      const nextNum = maxNum + 1;
      pos_id = 'POS' + String(nextNum).padStart(3, '0');
    }

    // 3. Insert new position
    await pool.query(
      'INSERT INTO tbl_positions (pos_id, pos_name, description) VALUES (?, ?, ?)',
      [pos_id, pos_name.trim(), description || null]
    );

    return NextResponse.json({ 
      pos_id, 
      message: 'Position created successfully' 
    }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
