import { NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // YYYY-MM
    const empId = searchParams.get('emp_id');
    
    let query = `
      SELECT s.*, t.code as shift_code, t.name as shift_name, t.color_code 
      FROM tbl_schedules s
      JOIN tbl_shift_types t ON s.shift_type_id = t.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (month) {
      query += ` AND DATE_FORMAT(s.schedule_date, '%Y-%m') = ?`;
      params.push(month);
    }
    
    if (empId) {
       query += ` AND s.emp_id = ?`;
       params.push(empId);
    }

    query += ` ORDER BY s.schedule_date ASC`;

    const [rows] = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
  }
}

// POST create or update schedule (can handle an array of updates for drag/drop)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { schedules } = body; // expect an array of schedules

    if (!Array.isArray(schedules)) {
      return NextResponse.json({ error: 'Expected an array of schedules' }, { status: 400 });
    }

    // Begin transaction for bulk updates
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      for (const sched of schedules) {
        const { id, emp_id, schedule_date, shift_type_id, role, status, notes, created_by } = sched;

        if (id) {
          // Update existing
          await connection.query(
            `UPDATE tbl_schedules SET shift_type_id=?, role=?, status=?, notes=?, updated_at=NOW() WHERE id=?`,
            [shift_type_id, role || 'Staff', status || 'Draft', notes || '', id]
          );
        } else {
          // Insert new
          await connection.query(
            `INSERT INTO tbl_schedules (emp_id, schedule_date, shift_type_id, role, status, notes, created_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE shift_type_id=VALUES(shift_type_id), role=VALUES(role), status=VALUES(status), notes=VALUES(notes)`,
            [emp_id, schedule_date, shift_type_id, role || 'Staff', status || 'Draft', notes || '', created_by || 'Admin']
          );
        }
      }
      
      await connection.commit();
      connection.release();
      
      return NextResponse.json({ message: 'Schedules saved successfully' }, { status: 200 });
    } catch (txError) {
      await connection.rollback();
      connection.release();
      throw txError;
    }
  } catch (error) {
    console.error('Error saving schedules:', error);
    return NextResponse.json({ error: 'Failed to save schedules' }, { status: 500 });
  }
}
