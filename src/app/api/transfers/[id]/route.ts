import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/transfers/:id  — รายละเอียด transfer 1 รายการ
// ═══════════════════════════════════════════════════════════════════════════════
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id || typeof id !== 'string' || id.trim() === '') {
    return NextResponse.json(
      { success: false, message: 'ไม่พบ transfer_id' },
      { status: 400 }
    );
  }

  try {
    const [rows] = await pool.query(
      `SELECT
         t.*,
         CONCAT(COALESCE(e.prefix,''), e.first_name_th, ' ', e.last_name_th) AS emp_name,
         e.image AS emp_image,
         od.dept_name AS old_dept_name,
         nd.dept_name AS new_dept_name,
         COALESCE(op.pos_name, t.old_position) AS old_pos_name,
         COALESCE(np.pos_name, t.new_position) AS new_pos_name
       FROM tbl_transfers t
       LEFT JOIN tbl_employees  e  ON t.emp_id       = e.emp_id
       LEFT JOIN tbl_departments od ON t.old_dept_id  = od.dept_id
       LEFT JOIN tbl_departments nd ON t.new_dept_id  = nd.dept_id
       LEFT JOIN tbl_positions   op ON t.old_position = op.pos_id
       LEFT JOIN tbl_positions   np ON t.new_position = np.pos_id
       WHERE t.transfer_id = ?
       LIMIT 1`,
      [id]
    ) as any[];

    const record = (rows as any[])[0];

    if (!record) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลการโยกย้าย' },
        { status: 404 }
      );
    }

    // Append file_url for convenience
    const data = {
      ...record,
      file_url: record.transfer_file ? `/uploads/${record.transfer_file}` : null,
    };

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
