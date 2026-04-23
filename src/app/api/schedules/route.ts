import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import { sendMail } from '@/lib/mail';
import { logAudit } from '@/lib/audit';

// ============================================================
//  Types
// ============================================================

interface BookingRow {
  booking_id: number;
  subject: string;
  description: string;
  room_id: number;
  room_name: string;
  organizer_id: string;
  start_time: string;
  end_time: string;
  status: string;
}

// ============================================================
//  Validation Functions
// ============================================================

/**
 * Check for room booking conflict (overlapping time in same room)
 */
async function checkRoomConflict(
  roomId: number,
  startTime: string,
  endTime: string,
  excludeId?: string
): Promise<string | null> {
  const [rows]: any = await pool.query(
    `SELECT b.booking_id, b.subject, r.room_name 
     FROM tbl_bookings b
     JOIN tbl_meeting_rooms r ON b.room_id = r.room_id
     WHERE b.room_id = ? 
       AND b.status != 'Cancelled'
       AND (b.start_time < ? AND b.end_time > ?)
       AND (? IS NULL OR b.booking_id != ?)`,
    [roomId, endTime, startTime, excludeId ?? null, excludeId ?? null]
  );

  if (rows.length > 0) {
    const conflict = rows[0];
    return `ห้องประชุม "${conflict.room_name}" ถูกจองแล้วในช่วงเวลานี้สำหรับหัวข้อ "${conflict.subject}"`;
  }
  return null;
}

// ============================================================
//  Email Notification Template
// ============================================================

async function sendMeetingEmail(
  empId: string,
  action: 'created' | 'updated' | 'deleted',
  details: {
    date: string;
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

    const actionLabel = action === 'created' ? '✅ เพิ่มการนัดหมายประชุมใหม่' : action === 'updated' ? '✏️ อัปเดตข้อมูลการประชุม' : '🗑️ ยกเลิกการประชุม';

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
            ${details.note ? `<tr><td style="padding:8px;color:#6b7280">หมายเหตุ</td><td style="padding:8px">${details.note}</td></tr>` : ''}
          </table>
        </div>
      </div>`;

    await sendMail({ to: email, subject: `[HRM] ${actionLabel} — ${details.subject}`, html });
  } catch (err) {
    console.error('[sendMeetingEmail] Failed:', err);
  }
}

// ============================================================
//  GET /api/schedules
// ============================================================

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month'); // YYYY-MM

    let sql = `
      SELECT b.booking_id as id, b.subject as nurse_name, b.description as note, 
             b.start_time as schedule_date, b.end_time, r.room_name as shift, b.organizer_id as department,
             b.booker_name, b.contact_phone, b.unit_name
      FROM tbl_bookings b
      LEFT JOIN tbl_meeting_rooms r ON b.room_id = r.room_id
      WHERE 1=1
    `;
    const values: string[] = [];

    if (month) {
      sql += ' AND DATE_FORMAT(b.start_time, "%Y-%m") = ?';
      values.push(month);
    }

    sql += ' ORDER BY b.start_time ASC';

    const [rows]: any = await pool.query(sql, values);

    // Keep field names compatible with frontend for now to avoid breaking UI until phase 3
    const mappedRows = rows.map((r: any) => {
      const sDate = new Date(r.schedule_date);
      const eDate = r.end_time ? new Date(r.end_time) : null;
      
      const formatT = (d: Date | null) => {
        if (!d || isNaN(d.getTime())) return '00:00';
        return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
      };

      return {
        id: r.id.toString(),
        nurse_name: r.nurse_name,
        shift: r.shift,
        department: r.department,
        booker_name: r.booker_name,
        contact_phone: r.contact_phone,
        unit_name: r.unit_name,
        schedule_date: r.schedule_date,
        note: r.note,
        startTime: formatT(sDate),
        endTime: formatT(eDate),
      };
    });

    return NextResponse.json(mappedRows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ============================================================
//  POST /api/schedules
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nurseName, shift, department, date, note, startTime, endTime, requestedBy, bookerName, contactPhone, unitName } = body;

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
    const conflict = await checkRoomConflict(roomId, fullStart, fullEnd);
    if (conflict) return NextResponse.json({ error: conflict }, { status: 409 });

    // 3. Insert
    const [result]: any = await pool.query(
      'INSERT INTO tbl_bookings (subject, description, room_id, organizer_id, start_time, end_time, booker_name, contact_phone, unit_name) VALUES (?,?,?,?,?,?,?,?,?)',
      [nurseName, note || '', roomId, department, fullStart, fullEnd, bookerName || '', contactPhone || '', unitName || '']
    );

    const newId = result.insertId.toString();

    // 4. Email & Audit
    await logAudit(requestedBy || 'System', `CREATE booking id=${newId} subject=${nurseName} room=${shift}`);
    sendMeetingEmail(department, 'created', {
      date,
      subject: nurseName,
      room: shift,
      startTime: startTime || '09:00',
      endTime: endTime || '10:00',
      note
    });

    return NextResponse.json({ success: true, id: newId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
