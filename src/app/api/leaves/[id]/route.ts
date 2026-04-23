import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import { logAudit } from '@/lib/audit';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status, stage } = await req.json(); // stage: 'Head of Dept', 'Admin', 'Housekeeper', 'Director'

    // Fetch leave record first
    const [leaveRows]: any = await pool.query('SELECT * FROM tbl_leaves WHERE leave_id = ?', [params.id]);
    const leave = leaveRows[0];
    if (!leave) return NextResponse.json({ error: 'Leave not found' }, { status: 404 });

    const emp_id = leave.emp_id;
    let updateFields = [];
    let values = [];
    let nextStage = leave.current_stage;
    let finalStatus = 'Pending';

    if (status === 'Rejected') {
      finalStatus = 'Rejected';
      updateFields.push('status = ?', 'current_stage = ?');
      values.push('Rejected', 'Rejected');
    } else if (status === 'Approved') {
      if (stage === 'Head of Dept') {
        updateFields.push('dept_head_status = ?', 'current_stage = ?');
        values.push('Approved', 'Administration');
      } else if (stage === 'Administration') {
        updateFields.push('admin_status = ?', 'status = ?', 'current_stage = ?');
        values.push('Approved', 'Approved', 'Completed');
      }
    }

    if (updateFields.length > 0) {
      values.push(params.id);
      await pool.query(`UPDATE tbl_leaves SET ${updateFields.join(', ')} WHERE leave_id = ?`, values);
    }

    // Refresh final status for notification
    const [updatedLeaveRows]: any = await pool.query('SELECT status, current_stage FROM tbl_leaves WHERE leave_id = ?', [params.id]);
    const updatedStatus = updatedLeaveRows[0].status;

    if (emp_id) {
       let title = 'อัปเดตใบลาของคุณ';
       let message = `ใบลาที่รหัส ${params.id} กำลังอยู่ในขั้นตอน ${updatedLeaveRows[0].current_stage}`;
       
       if (updatedStatus === 'Approved') {
         title = 'ใบลาของคุณได้รับอนุมัติเรียบร้อยแล้ว';
         message = `คำขอลาที่รหัส ${params.id} ได้รับอนุมัติครบทุกขั้นตอนแล้ว`;
       } else if (updatedStatus === 'Rejected') {
         title = 'ใบลาของคุณไม่ได้รับอนุมัติ';
         message = `คำขอลาที่รหัส ${params.id} ถูกปฏิเสธ`;
       }
       
       await pool.query(
         'INSERT INTO tbl_notifications (emp_id, title, message) VALUES (?, ?, ?)',
         [emp_id, title, message]
       );
    }

    await logAudit(req.headers.get('x-user-id'), `อัปเดตสถานะการลา รหัส ${params.id} เป็น ${status}`);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
