import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

// Helper to map UI shift strings to DB shift_type_ids
const shiftMap: Record<string, number> = {
  'Morning': 1,
  'Afternoon': 2,
  'Night': 3
};

// GET /api/schedules?month=2026-03
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month'); // "YYYY-MM"

    // Fetch schedules and join with shift types to get names
    let sql = `
      SELECT s.id, s.emp_id as nurse_name, s.role as department, 
             s.schedule_date, t.code as shift_code, s.notes as note
      FROM tbl_schedules s
      LEFT JOIN tbl_shift_types t ON s.shift_type_id = t.id
      WHERE 1=1
    `;
    const values: string[] = [];

    if (month) {
      sql += ' AND DATE_FORMAT(s.schedule_date, "%Y-%m") = ?';
      values.push(month);
    }

    sql += ' ORDER BY s.schedule_date ASC, s.shift_type_id ASC';

    const [rows]: any = await pool.query(sql, values);
    
    const mappedRows = rows.map((r: any) => {
        // Map back to 'Morning', 'Afternoon', 'Night' for legacy frontend rendering
        let mappedShift = 'Morning';
        if (r.shift_code === 'บ') mappedShift = 'Afternoon';
        if (r.shift_code === 'ด') mappedShift = 'Night';

        return {
           id: r.id.toString(),
           nurse_name: r.nurse_name,
           shift: mappedShift,
           department: r.department,
           schedule_date: r.schedule_date,
           note: r.note
        };
    });

    return NextResponse.json(mappedRows);
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

    const shift_type_id = shiftMap[shift] || 1;

    // Check duplicate logic based on the new schema (emp_id = nurse_name, schedule_date = date)
    const [dup]: any = await pool.query(
      'SELECT id FROM tbl_schedules WHERE emp_id = ? AND schedule_date = ? AND shift_type_id = ?',
      [nurseName.trim(), dateStrSafe(date), shift_type_id]
    );

    if (dup.length > 0) {
      return NextResponse.json({ error: `${nurseName} มีเวร ${shift} ในวันนี้แล้ว` }, { status: 409 });
    }

    // Insert to new tbl_schedules (emp_id=nurseName, role=department)
    const [result]: any = await pool.query(
      'INSERT INTO tbl_schedules (emp_id, shift_type_id, role, schedule_date, notes, status) VALUES (?,?,?,?,?,?)',
      [nurseName.trim(), shift_type_id, department, dateStrSafe(date), note || '', 'Published']
    );

    return NextResponse.json({ success: true, id: result.insertId.toString() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Ensure proper date string format for SQL
function dateStrSafe(dateStr: string) {
    if (!dateStr) return null;
    return dateStr; // Already in YYYY-MM-DD from frontend
}
