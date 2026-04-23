import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import { sendMail } from '@/lib/mail';
import { logAudit } from '@/lib/audit';

// ============================================================
//  Validation: Conflict Check
// ============================================================

async function checkRoomConflict(
  roomId: number,
  startTime: string,
  endTime: string,
  excludeId: string
): Promise<string | null> {
  const [rows]: any = await pool.query(
    `SELECT b.booking_id, b.subject, r.room_name 
     FROM tbl_bookings b
     JOIN tbl_meeting_rooms r ON b.room_id = r.room_id
     WHERE b.room_id = ? 
       AND b.status != 'Cancelled'
       AND (b.start_time < ? AND b.end_time > ?)
       AND b.booking_id != ?`,
    [roomId, endTime, startTime, excludeId]
  );

  if (rows.length > 0) {
    const conflict = rows[0];
    return `ห้องประชุม "${conflict.room_name}" ถูกจองแล้วในช่วงเวลานี้สำหรับหัวข้อ "${conflict.subject}"`;
  }
  return null;
}

// ============================================================
//  Email Notification
// ============================================================

async function sendMeetingEmail(
  empId: string,
  action: 'updated' | 'deleted',
  details: {
    subject: string;
    room: string;
    startTime: string;
    endTime: string;
    note?: string;
  }
) {
  try {
    const [emp]: any = await pool.query('SELECT email FROM tbl_employees WHERE emp_id = ?', [empId]);
    const email = emp[0]?.email;
    if (!email) return;

    const actionLabel = action === 'updated' ? '✏️ อัปเดตข้อมูลการประชุม' : '🗑️ ยกเลิกการประชุม';

    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        <div style="background:#2563eb;padding:20px 24px">
          <h2 style="color:#fff;margin:0;font-size:18px">${actionLabel}</h2>
          <p style="color:#bfdbfe;margin:4px 0 0;font-size:13px">ระบบจัดการตารางประชุม HRM</p>
        </div>
        <div style="padding:24px">
          <p style="margin:0 0 16px;color:#374151">สวัสดี, พนักงานรหัส <strong>${empId}</strong></p>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr style="background:#f3f4f6">
              <td style="padding:8px;color:#6b7280;width:40%">หัวข้อประชุม</td>
              <td style="padding:8px"><strong>${details.subject}</strong></td>
            </tr>
            <tr>
              <td style="padding:8px;color:#6b7280">ห้องประชุม</td>
              <td style="padding:8px">${details.room}</td>
            </tr>
            <tr style="background:#f3f4f6">
              <td style="padding:8px;color:#6b7280">เวลา</td>
              <td style="padding:8px">${details.startTime} - ${details.endTime}</td>
            </tr>
          </table>
        </div>
      </div>`;

    await sendMail({ to: email, subject: `[HRM] ${actionLabel} — ${details.subject}`, html });
  } catch (err) {
    console.error('[sendMeetingEmail] Failed:', err);
  }
}

// ============================================================
//  PUT /api/schedules/[id]
// ============================================================

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { 
      nurseName, shift, department, date, startTime, endTime, note, requestedBy, bookerName, contactPhone, unitName,
      memoFile, projectFile, transportCost, accommodationCost, organizerPay, parentPay
    } = body;

    // 1. Validation
    if (!nurseName || !shift || !date) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบ' }, { status: 400 });
    }

    // Resolve Room ID
    const [roomRows]: any = await pool.query('SELECT room_id FROM tbl_meeting_rooms WHERE room_name = ?', [shift]);
    if (!roomRows.length) return NextResponse.json({ error: 'ไม่พบห้องประชุมที่ระบุ' }, { status: 404 });
    const roomId = roomRows[0].room_id;

    // Prepare timestamps
    const fullStart = `${date} ${startTime || '09:00:00'}`;
    const fullEnd = `${date} ${endTime || '10:00:00'}`;

    // 2. Conflict Check
    const conflict = await checkRoomConflict(roomId, fullStart, fullEnd, id);
    if (conflict) return NextResponse.json({ error: conflict }, { status: 409 });

    // 3. Update
    await pool.query(
      `UPDATE tbl_bookings 
       SET subject = ?, room_id = ?, organizer_id = ?, start_time = ?, end_time = ?, description = ?,
           booker_name = ?, contact_phone = ?, unit_name = ?,
           memo_file = ?, project_file = ?, transport_cost = ?, accommodation_cost = ?, organizer_pay = ?, parent_pay = ?
       WHERE booking_id = ?`,
      [
        nurseName, roomId, department, fullStart, fullEnd, note || '', bookerName || '', contactPhone || '', unitName || '', 
        memoFile || '', projectFile || '', transportCost || 0, accommodationCost || 0, organizerPay || 0, parentPay || 0,
        id
      ]
    );

    // 4. Email & Audit
    await logAudit(requestedBy || 'System', `UPDATE booking id=${id} subject=${nurseName} room=${shift}`);
    sendMeetingEmail(department, 'updated', {
      subject: nurseName,
      room: shift,
      startTime: startTime || '09:00',
      endTime: endTime || '10:00'
    });

    return NextResponse.json({ success: true, message: 'อัปเดตข้อมูลการประชุมสำเร็จ' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ============================================================
//  DELETE /api/schedules/[id]
// ============================================================

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const requestedBy = searchParams.get('requestedBy') ?? 'System';

    // 1. Get info before delete
    const [rows]: any = await pool.query(
      `SELECT b.subject, r.room_name, b.organizer_id, b.start_time, b.end_time 
       FROM tbl_bookings b
       JOIN tbl_meeting_rooms r ON b.room_id = r.room_id
       WHERE b.booking_id = ?`,
      [id]
    );
    if (!rows.length) return NextResponse.json({ error: 'ไม่พบข้อมูลที่ต้องการลบ' }, { status: 404 });
    const row = rows[0];

    // 2. Delete
    await pool.query('DELETE FROM tbl_bookings WHERE booking_id = ?', [id]);

    // 3. Audit & Email
    await logAudit(requestedBy, `DELETE booking id=${id} subject=${row.subject}`);
    sendMeetingEmail(row.organizer_id, 'deleted', {
      subject: row.subject,
      room: row.room_name,
      startTime: new Date(row.start_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      endTime: new Date(row.end_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    });

    return NextResponse.json({ success: true, message: 'ลบข้อมูลการประชุมสำเร็จ' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
