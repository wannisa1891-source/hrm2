import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import { sendMail } from '@/lib/mail';

const shiftMap: Record<string, number> = {
    'Morning': 1,
    'Afternoon': 2,
    'Night': 3
};

// GET current time in Thailand (GMT+7)
function getThailandTime() {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 7));
}

async function getEmployeeEmail(empId: string) {
    const [rows]: any = await pool.query('SELECT email, first_name_th, last_name_th FROM tbl_employees WHERE emp_id = ?', [empId]);
    return rows[0] || null;
}

// PUT /api/schedules/[id]
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { nurseName, shift, department, note } = await req.json();
        const { id } = params;
        const changer = decodeURIComponent(req.headers.get('x-user-id') || 'Unknown');

        if (!nurseName || !shift || !department) {
            return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบ' }, { status: 400 });
        }

        const shift_type_id = shiftMap[shift] || 1;

        // Fetch old data for comparison
        const [oldRows]: any = await pool.query('SELECT * FROM tbl_schedules WHERE id = ?', [id]);
        if (oldRows.length === 0) return NextResponse.json({ error: 'ไม่พบข้อมูลเวร' }, { status: 404 });
        
        const oldData = oldRows[0];

        await pool.query(
            'UPDATE tbl_schedules SET emp_id=?, shift_type_id=?, role=?, notes=? WHERE id=?',
            [nurseName.trim(), shift_type_id, department, note || '', id]
        );

        // Notify if changed by someone else
        if (nurseName.trim() !== changer) {
            const emp = await getEmployeeEmail(nurseName.trim());
            if (emp && emp.email) {
                const dateStr = new Date(oldData.schedule_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
                await sendMail({
                    to: emp.email,
                    subject: `[HRM] แจ้งเตือนการแก้ไขตารางเวรวันที่ ${dateStr}`,
                    html: `
                        <div style="font-family: sans-serif; line-height: 1.6;">
                            <h2>แจ้งเตือนการแก้ไขตารางเวร</h2>
                            <p>เรียนคุณ ${emp.first_name_th} ${emp.last_name_th},</p>
                            <p>ตารางเวรของคุณในวันที่ <b>${dateStr}</b> ได้รับการแก้ไขโดย <b>${changer}</b></p>
                            <hr/>
                            <p><b>รายละเอียดใหม่:</b></p>
                            <ul>
                                <li><b>ประเภทเวร:</b> ${shift}</li>
                                <li><b>แผนก:</b> ${department}</li>
                                <li><b>หมายเหตุ:</b> ${note || '-'}</li>
                            </ul>
                            <p>กรุณากรวจสอบรายละเอียดเพิ่มเติมในระบบ HRM</p>
                        </div>
                    `
                }).catch(e => console.error('Email failed:', e));
            }
        }

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'DB Error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// DELETE /api/schedules/[id]
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const changer = decodeURIComponent(req.headers.get('x-user-id') || 'Unknown');

        // Fetch schedule info before deleting
        const [rows]: any = await pool.query('SELECT * FROM tbl_schedules WHERE id = ?', [id]);
        if (rows.length === 0) return NextResponse.json({ error: 'ไม่พบข้อมูล' }, { status: 404 });

        const schedule = rows[0];
        const scheduleDate = new Date(schedule.schedule_date);
        
        // Block past deletion
        const today = getThailandTime();
        today.setHours(0, 0, 0, 0);
        
        if (scheduleDate < today) {
            return NextResponse.json({ error: 'ไม่สามารถลบเวรที่ผ่านมาแล้วได้' }, { status: 403 });
        }

        await pool.query('DELETE FROM tbl_schedules WHERE id=?', [id]);

        // Notify cancellation
        if (schedule.emp_id !== changer) {
            const emp = await getEmployeeEmail(schedule.emp_id);
            if (emp && emp.email) {
                const dateStr = scheduleDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
                await sendMail({
                    to: emp.email,
                    subject: `[HRM] แจ้งเตือนการยกเลิกเวรวันที่ ${dateStr}`,
                    html: `
                        <div style="font-family: sans-serif; line-height: 1.6;">
                            <h2>แจ้งเตือนการยกเลิกเวร</h2>
                            <p>เรียนคุณ ${emp.first_name_th} ${emp.last_name_th},</p>
                            <p>เวรของคุณในวันที่ <b>${dateStr}</b> ได้ถูก<b>ยกเลิก</b>โดย <b>${changer}</b> เรียบร้อยแล้ว</p>
                            <p>กรุณากรวจสอบตารางเวรล่าสุดอีกครั้งในระบบ HRM</p>
                        </div>
                    `
                }).catch(e => console.error('Email failed:', e));
            }
        }

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'DB Error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
