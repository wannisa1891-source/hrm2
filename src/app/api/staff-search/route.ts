import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrn_db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const sql = `SELECT e.emp_id as id, 
      CONCAT(e.prefix, e.first_name_th, ' ', e.last_name_th) as name, 
      p.pos_name as pos, d.dept_name as dept, e.base_salary as salary 
      FROM tbl_employees e 
      LEFT JOIN tbl_positions p ON e.pos_id = p.pos_id 
      LEFT JOIN tbl_departments d ON e.dept_id = d.dept_id 
      WHERE e.first_name_th LIKE ? OR e.emp_id LIKE ?`;
    const [rows] = await pool.query(sql, [`%${query}%`, `%${query}%`]);
    return NextResponse.json(rows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
