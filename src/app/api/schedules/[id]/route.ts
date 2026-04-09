import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import { sendMail } from '@/lib/mail';
import { logAudit } from '@/lib/audit';

// ============================================================
//  Types
// ============================================================

interface ShiftType {
  id: number;
  code: string;
  name: string;
  start_time: string; // "HH:MM:SS"
  end_time: string;   // "HH:MM:SS"
  working_hours: number;
}

// ============================================================
//  Helpers: Shift Mapping
// ============================================================

const shiftNameToId: Record<string, number> = {
  Morning: 1,
  Afternoon: 2,
  Night: 3,
};

const shiftCodeToName: Record<string, string> = {
  ม: 'Morning',
  บ: 'Afternoon',
  ด: 'Night',
};

function resolveShiftName(code: string): string {
  return shiftCodeToName[code] ?? 'Morning';
}

// ============================================================
//  Helpers: Date Guards
// ============================================================

/**
 * คืน true ถ้า dateStr (YYYY-MM-DD) น้อยกว่าวันนี้ (เป็นอดีต)
 */
function isPastDate(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // normalize to midnight local
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return target < today;
}

// ============================================================
//  Helpers: Time Overlap (รองรับ shift ข้ามวัน)
// ============================================================

function toMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * ตรวจสอบว่า shift A กับ shift B มีเวลาชนกันหรือไม่
 * รองรับ shift ข้ามวัน (end < start หมายถึงใช้ 1440 offset)
 */
function shiftsOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  const normA: [number, number] = endA <= startA ? [startA, endA + 1440] : [startA, endA];
  const normB: [number, number] = endB <= startB ? [startB, endB + 1440] : [startB, endB];
  return normA[0] < normB[1] && normB[0] < normA[1];
}

// ============================================================
//  Validation: Duplicate Check
// ============================================================

async function checkDuplicate(
  empId: string,
  date: string,
  shiftTypeId: number,
  excludeId: string
): Promise<string | null> {
  const [rows]: any = await pool.query(
    `SELECT id FROM tbl_schedules
     WHERE emp_id = ? AND schedule_date = ? AND shift_type_id = ? AND id != ?`,
    [empId, date, shiftTypeId, excludeId]
  );
  if (rows.length > 0) {
    return `พนักงาน ${empId} มีเวรนี้ในวันที่ ${date} อยู่แล้ว`;
  }
  return null;
}

// ============================================================
//  Validation: Time Conflict Check
// ============================================================

async function checkTimeConflict(
  empId: string,
  date: string,
  newShift: ShiftType,
  excludeId: string
): Promise<string | null> {
  // ดึงเวรของพนักงานในช่วง ±1 วัน เพื่อรองรับ shift ข้ามวัน
  const [existingRows]: any = await pool.query(
    `SELECT s.id, t.start_time, t.end_time, t.code, s.schedule_date
     FROM tbl_schedules s
     JOIN tbl_shift_types t ON s.shift_type_id = t.id
     WHERE s.emp_id = ?
       AND s.schedule_date BETWEEN DATE_SUB(?, INTERVAL 1 DAY) AND DATE_ADD(?, INTERVAL 1 DAY)
       AND s.id != ?`,
    [empId, date, date, excludeId]
  );

  const newStart = toMinutes(newShift.start_time);
  const newEnd   = toMinutes(newShift.end_time);

  for (const row of existingRows) {
    const existStart = toMinutes(row.start_time);
    const existEnd   = toMinutes(row.end_time);

    // คำนวณ offset ถ้าเวรอยู่คนละวัน
    const dayDiff =
      (new Date(row.schedule_date).getTime() - new Date(date).getTime()) / 86_400_000;

    let adjStart = existStart + dayDiff * 1440;
    let adjEnd   = existEnd   + dayDiff * 1440;

    if (shiftsOverlap(newStart, newEnd, adjStart, adjEnd)) {
      const shiftLabel = resolveShiftName(row.code);
      const startStr   = row.start_time.slice(0, 5);
      const endStr     = row.end_time.slice(0, 5);
      return `พนักงาน ${empId} มีเวร${shiftLabel} (${startStr}–${endStr}) วันที่ ${row.schedule_date} ชนกับเวรที่ต้องการแก้ไข`;
    }
  }
  return null;
}

// ============================================================
//  Email Notification
// ============================================================

async function getEmployeeEmail(empId: string): Promise<string | null> {
  const [rows]: any = await pool.query(
    'SELECT email FROM tbl_users WHERE emp_id = ? LIMIT 1',
    [empId]
  );
  return rows[0]?.email ?? null;
}

async function sendScheduleEmail(
  empId: string,
  action: 'updated' | 'deleted',
  details: {
    date: string;
    shiftName: string;
    department: string;
    note?: string;
    before?: { shift: string; department: string };
  }
) {
  try {
    const email = await getEmployeeEmail(empId);
    if (!email) return;

    const actionLabel = action === 'updated' ? '✏️ อัปเดตตารางเวร' : '🗑️ ลบตารางเวร';

    const changeRow =
      action === 'updated' && details.before
        ? `<tr>
            <td style="padding:8px;color:#6b7280">การเปลี่ยนแปลง</td>
            <td style="padding:8px">
              กะ: <s style="color:#9ca3af">${details.before.shift}</s> → <strong>${details.shiftName}</strong><br/>
              แผนก: <s style="color:#9ca3af">${details.before.department}</s> → <strong>${details.department}</strong>
            </td>
          </tr>`
        : '';

    const deletedWarning =
      action === 'deleted'
        ? `<div style="margin-top:16px;padding:12px;background:#fef2f2;border-radius:6px;color:#b91c1c;font-size:13px">
            เวรดังกล่าวถูกลบออกจากระบบแล้ว หากมีข้อสงสัยกรุณาติดต่อผู้ดูแลระบบ
          </div>`
        : '';

    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        <div style="background:#2563eb;padding:20px 24px">
          <h2 style="color:#fff;margin:0;font-size:18px">${actionLabel}</h2>
          <p style="color:#bfdbfe;margin:4px 0 0;font-size:13px">ระบบจัดการตารางเวร HRM</p>
        </div>
        <div style="padding:24px">
          <p style="margin:0 0 16px;color:#374151">สวัสดี, พนักงานรหัส <strong>${empId}</strong></p>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr style="background:#f3f4f6">
              <td style="padding:8px;color:#6b7280;width:40%">วันที่</td>
              <td style="padding:8px"><strong>${details.date}</strong></td>
            </tr>
            <tr>
              <td style="padding:8px;color:#6b7280">กะการทำงาน</td>
              <td style="padding:8px">${details.shiftName}</td>
            </tr>
            <tr style="background:#f3f4f6">
              <td style="padding:8px;color:#6b7280">แผนก</td>
              <td style="padding:8px">${details.department}</td>
            </tr>
            ${changeRow}
            ${details.note ? `<tr><td style="padding:8px;color:#6b7280">หมายเหตุ</td><td style="padding:8px">${details.note}</td></tr>` : ''}
          </table>
          ${deletedWarning}
        </div>
        <div style="padding:12px 24px;background:#f9fafb;text-align:center;font-size:12px;color:#9ca3af">
          อีเมลนี้ส่งจากระบบ HRM โดยอัตโนมัติ กรุณาอย่าตอบกลับ
        </div>
      </div>`;

    await sendMail({
      to: email,
      subject: `[HRM] ${actionLabel} — ${details.date}`,
      html,
    });
  } catch (err) {
    console.error('[sendScheduleEmail] Failed:', err);
    // ไม่ throw เพื่อให้ API ทำงานต่อได้แม้ส่ง mail ไม่สำเร็จ
  }
}

// ============================================================
//  PUT /api/schedules/[id]  — แก้ไขเวร
// ============================================================

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body   = await req.json();
    const { nurseName, shift, department, note, requestedBy } = body;

    // 1. Basic validation
    if (!nurseName || !shift || !department) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบ (nurseName, shift, department)' },
        { status: 400 }
      );
    }

    const shiftTypeId = shiftNameToId[shift];
    if (!shiftTypeId) {
      return NextResponse.json(
        { error: `ประเภทกะไม่ถูกต้อง: ${shift}` },
        { status: 400 }
      );
    }

    // 2. ดึงข้อมูลเวรเดิม
    const [existing]: any = await pool.query(
      `SELECT s.emp_id, s.schedule_date, s.role, s.notes, t.code AS shift_code
       FROM tbl_schedules s
       JOIN tbl_shift_types t ON s.shift_type_id = t.id
       WHERE s.id = ?`,
      [id]
    );
    if (!existing.length) {
      return NextResponse.json({ error: 'ไม่พบเวรที่ต้องการแก้ไข' }, { status: 404 });
    }

    const prev = existing[0];
    const scheduleDate: string = new Date(prev.schedule_date)
      .toISOString()
      .split('T')[0];

    // 3. ห้ามแก้ไขเวรย้อนหลัง
    if (isPastDate(scheduleDate)) {
      return NextResponse.json(
        { error: 'ไม่สามารถแก้ไขเวรย้อนหลังได้' },
        { status: 403 }
      );
    }

    // 4. ดึง ShiftType ใหม่
    const [shiftRows]: any = await pool.query(
      'SELECT id, code, name, start_time, end_time, working_hours FROM tbl_shift_types WHERE id = ?',
      [shiftTypeId]
    );
    if (!shiftRows.length) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลประเภทกะในระบบ' }, { status: 404 });
    }
    const newShiftType: ShiftType = shiftRows[0];

    // 5. Duplicate check (ยกเว้น id ตัวเอง)
    const dupError = await checkDuplicate(nurseName.trim(), scheduleDate, shiftTypeId, id);
    if (dupError) {
      return NextResponse.json({ error: dupError }, { status: 409 });
    }

    // 6. Time conflict check
    const conflictError = await checkTimeConflict(
      nurseName.trim(),
      scheduleDate,
      newShiftType,
      id
    );
    if (conflictError) {
      return NextResponse.json({ error: conflictError }, { status: 409 });
    }

    // 7. Update (พร้อม updated_by)
    await pool.query(
      `UPDATE tbl_schedules
       SET emp_id = ?, shift_type_id = ?, role = ?, notes = ?, updated_by = ?, updated_at = NOW()
       WHERE id = ?`,
      [nurseName.trim(), shiftTypeId, department, note ?? '', requestedBy ?? 'System', id]
    );

    // 8. Audit log
    const prevShiftName = resolveShiftName(prev.shift_code);
    await logAudit(
      requestedBy ?? 'System',
      `UPDATE schedule id=${id} emp=${nurseName} date=${scheduleDate} ` +
        `shift: ${prevShiftName}→${shift} dept: ${prev.role}→${department}`
    );

    // 9. Email notification (non-blocking)
    sendScheduleEmail(nurseName.trim(), 'updated', {
      date: scheduleDate,
      shiftName: shift,
      department,
      note,
      before: { shift: prevShiftName, department: prev.role },
    });

    return NextResponse.json({
      success: true,
      message: 'อัปเดตตารางเวรสำเร็จ',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ============================================================
//  DELETE /api/schedules/[id]  — ลบเวร
// ============================================================

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // รับ requestedBy จาก query string หรือ body (optional)
    const { searchParams } = new URL(req.url);
    const requestedBy = searchParams.get('requestedBy') ?? 'System';

    // 1. ดึงข้อมูลเวรก่อนลบ (เพื่อส่ง email และตรวจวันย้อนหลัง)
    const [existing]: any = await pool.query(
      `SELECT s.emp_id, s.schedule_date, s.role, s.notes, t.code AS shift_code
       FROM tbl_schedules s
       JOIN tbl_shift_types t ON s.shift_type_id = t.id
       WHERE s.id = ?`,
      [id]
    );
    if (!existing.length) {
      return NextResponse.json({ error: 'ไม่พบเวรที่ต้องการลบ' }, { status: 404 });
    }

    const row = existing[0];
    const scheduleDate: string = new Date(row.schedule_date)
      .toISOString()
      .split('T')[0];

    // 2. ห้ามลบเวรย้อนหลัง
    if (isPastDate(scheduleDate)) {
      return NextResponse.json(
        { error: 'ไม่สามารถลบเวรย้อนหลังได้' },
        { status: 403 }
      );
    }

    // 3. ลบเวร
    await pool.query('DELETE FROM tbl_schedules WHERE id = ?', [id]);

    // 4. Audit log
    const shiftName = resolveShiftName(row.shift_code);
    await logAudit(
      requestedBy,
      `DELETE schedule id=${id} emp=${row.emp_id} date=${scheduleDate} shift=${shiftName} dept=${row.role}`
    );

    // 5. Email notification (non-blocking)
    sendScheduleEmail(row.emp_id, 'deleted', {
      date: scheduleDate,
      shiftName,
      department: row.role,
      note: row.notes,
    });

    return NextResponse.json({
      success: true,
      message: 'ลบตารางเวรสำเร็จ',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
