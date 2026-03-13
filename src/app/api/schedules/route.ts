import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

// GET /api/schedules?month=2026-03
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month'); // "YYYY-MM"

    let sql = 'SELECT * FROM tbl_schedules';
    const values: string[] = [];

    if (month) {
      sql += ' WHERE DATE_FORMAT(schedule_date, "%Y-%m") = ?';
      values.push(month);
    }

    sql += ' ORDER BY schedule_date ASC, shift ASC';

    const [rows] = await pool.query(sql, values);
    return NextResponse.json(rows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/schedules
export async function POST(req: NextRequest) {
  try {
    const { nurseName, shift, department, date, note } = await req.json();

    if (!nurseName || !shift || !department || !date) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบ' }, { status: 400 });
    }

    // ตรวจสอบ duplicate: พยาบาล 1 คน ห้ามมีมากกว่า 1 เวร ต่อวัน
    const [dup] = await pool.query(
      'SELECT id FROM tbl_schedules WHERE nurse_name = ? AND schedule_date = ?',
      [nurseName.trim(), date]
    ) as [{ id: string }[], unknown];
    if ((dup as { id: string }[]).length > 0) {
      return NextResponse.json({ error: `${nurseName} มีเวรในวันนี้แล้ว` }, { status: 409 });
    }

    const id = 'SCH' + Date.now().toString().slice(-7);
    await pool.query(
      'INSERT INTO tbl_schedules (id, nurse_name, shift, department, schedule_date, note) VALUES (?,?,?,?,?,?)',
      [id, nurseName.trim(), shift, department, date, note || '']
    );

    return NextResponse.json({ success: true, id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
