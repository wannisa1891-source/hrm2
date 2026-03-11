import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrn_db';

export async function GET(_req: NextRequest, { params }: { params: { deptId: string } }) {
  try {
    const sql = `SELECT e.*, p.pos_name FROM tbl_employees e 
      LEFT JOIN tbl_positions p ON e.pos_id = p.pos_id 
      WHERE e.dept_id = ? AND e.status = 'Active'`;
    const [rows] = await pool.query(sql, [params.deptId]);
    return NextResponse.json(rows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
