import { NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT * FROM tbl_departments ORDER BY dept_id');
    const data = (rows as Record<string, unknown>[]).map((d) => ({ ...d, isOpen: false }));
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { dept_id, dept_name, description, head_emp_id, phone, org_chart_url, sop_url, rules_url } = body;

    if (!dept_id || !dept_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if dept_id already exists
    const [existing] = await pool.query('SELECT dept_id FROM tbl_departments WHERE dept_id = ?', [dept_id]);
    if ((existing as any[]).length > 0) {
      return NextResponse.json({ error: 'Department ID already exists' }, { status: 400 });
    }

    await pool.query(
      'INSERT INTO tbl_departments (dept_id, dept_name, description, head_emp_id, phone, org_chart_url, sop_url, rules_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [dept_id, dept_name, description || null, head_emp_id || null, phone || null, org_chart_url || null, sop_url || null, rules_url || null]
    );

    return NextResponse.json({ message: 'Department created successfully' }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
