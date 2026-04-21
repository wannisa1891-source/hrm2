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

interface ScheduleRow {
  id: number;
  emp_id: string;
  shift_type_id: number;
  role: string;
  schedule_date: string;
  notes: string;
  status: string;
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
//  Helpers: Time Overlap (รองรับ shift ข้ามวัน)
// ============================================================

/** แปลง "HH:MM:SS" → นาทีนับจากเที่ยงคืน */
function toMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

const MIN_REST_HOURS = 10;
const MIN_REST_MINUTES = MIN_REST_HOURS * 60;

function getAbsoluteShiftMetrics(dateStr: string, timeStr: string, endStr: string) {
    const baseDate = new Date(dateStr);
    const baseMinutes = Math.floor(baseDate.getTime() / 60000);
    const startMins = toMinutes(timeStr);
    let endMins = toMinutes(endStr);
    if (endMins <= startMins) endMins += 1440;

    return {
        start: baseMinutes + startMins,
        end: baseMinutes + endMins
    };
}

// ============================================================
//  Validation Functions
// ============================================================

/**
 * ตรวจสอบ duplicate schedule (emp_id + date + shift_type_id ซ้ำ)
 */
async function checkDuplicate(
  empId: string,
  date: string,
  shiftTypeId: number,
  excludeId?: string
): Promise<string | null> {
  const [rows]: any = await pool.query(
    `SELECT id FROM tbl_schedules
     WHERE emp_id = ? AND schedule_date = ? AND shift_type_id = ?
       AND (? IS NULL OR id != ?)`,
    [empId, date, shiftTypeId, excludeId ?? null, excludeId ?? null]
  );
  if (rows.length > 0) {
    return `พนักงาน ${empId} มีเวรนี้ในวันที่ ${date} อยู่แล้ว`;
  }
  return null;
}

async function checkTimeConflict(
  empId: string,
  date: string,
  newShift: ShiftType,
  excludeId?: string
): Promise<string | null> {
  // ดึงเวรทั้งหมดของพนักงานในวันนี้และวันก่อน/หลัง (สำหรับ shift ข้ามวันและพักไม่พอ)
  const [existingRows]: any = await pool.query(
    `SELECT s.id, t.start_time, t.end_time, t.code, s.schedule_date
     FROM tbl_schedules s
     JOIN tbl_shift_types t ON s.shift_type_id = t.id
     WHERE s.emp_id = ?
       AND s.schedule_date BETWEEN DATE_SUB(?, INTERVAL 1 DAY) AND DATE_ADD(?, INTERVAL 1 DAY)
       AND (? IS NULL OR s.id != ?)`,
    [empId, date, date, excludeId ?? null, excludeId ?? null]
  );

  const newMetrics = getAbsoluteShiftMetrics(date, newShift.start_time, newShift.end_time);

  for (const row of existingRows) {
    const rowDateStr = new Date(row.schedule_date).toISOString().split('T')[0];
    const existMetrics = getAbsoluteShiftMetrics(rowDateStr, row.start_time, row.end_time);

    // Overlap Check (ชนกัน)
    const overlaps = (newMetrics.start < existMetrics.end && existMetrics.start < newMetrics.end);
    if (overlaps) {
      return `พนักงาน ${empId} มีเวร ${resolveShiftName(row.code)} (${row.start_time.slice(0, 5)}–${row.end_time.slice(0, 5)}) ชนกับเวรที่ต้องการเพิ่ม`;
    }

    // Rest Check (พักไม่พอ)
    if (newMetrics.start >= existMetrics.end) {
      const rest = newMetrics.start - existMetrics.end;
      if (rest < MIN_REST_MINUTES) {
        return `พนักงาน ${empId} พักไม่เพียงพอ (${+(rest / 60).toFixed(1)} ชม.) ระหว่างเวร ${resolveShiftName(row.code)} → ${newShift.name}`;
      }
    }
    if (existMetrics.start >= newMetrics.end) {
      const rest = existMetrics.start - newMetrics.end;
      if (rest < MIN_REST_MINUTES) {
        return `พนักงาน ${empId} พักไม่เพียงพอ (${+(rest / 60).toFixed(1)} ชม.) ระหว่างเวร ${newShift.name} → ${resolveShiftName(row.code)}`;
      }
    }
  }
  return null;
}

// ============================================================
//  Email Notification Templates
// ============================================================

async function getEmployeeEmail(empId: string): Promise<string | null> {
  const [rows]: any = await pool.query(
    'SELECT email FROM tbl_employees WHERE emp_id = ? LIMIT 1',
    [empId]
  );
  return rows[0]?.email ?? null;
}

async function sendScheduleEmail(
  empId: string,
  action: 'created' | 'updated' | 'deleted',
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
    if (!email) return; // ถ้าไม่มี email ข้ามไป

    const actionLabel =
      action === 'created'
        ? '✅ เพิ่มตารางเวรใหม่'
        : action === 'updated'
        ? '✏️ อัปเดตตารางเวร'
        : '🗑️ ลบตารางเวร';

    const changeRow =
      action === 'updated' && details.before
        ? `<tr>
            <td style="padding:8px;color:#6b7280">การเปลี่ยนแปลง</td>
            <td style="padding:8px">
              กะ: ${details.before.shift} → ${details.shiftName}<br/>
              แผนก: ${details.before.department} → ${details.department}
            </td>
          </tr>`
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
          ${
            action === 'deleted'
              ? `<div style="margin-top:16px;padding:12px;background:#fef2f2;border-radius:6px;color:#b91c1c;font-size:13px">
                  เวรดังกล่าวถูกลบออกจากระบบแล้ว หากมีข้อสงสัยกรุณาติดต่อผู้ดูแลระบบ
                </div>`
              : ''
          }
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
    // ไม่ throw เพื่อให้ API ยังทำงานต่อได้แม้ส่ง mail ไม่สำเร็จ
  }
}

// ============================================================
//  GET /api/schedules?month=YYYY-MM
// ============================================================

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');

    let sql = `
      SELECT s.id, s.emp_id AS nurse_name, s.role AS department,
             s.schedule_date, t.code AS shift_code, s.notes AS note
      FROM tbl_schedules s
      LEFT JOIN tbl_shift_types t ON s.shift_type_id = t.id
      WHERE 1=1
    `;
    const values: string[] = [];

    if (month) {
      sql += ' AND DATE_FORMAT(s.schedule_date, "%Y-%m") = ?';
      values.push(month);
    }

    sql += ' ORDER BY s.schedule_date ASC, s.shift_type_id ASC';

    const [rows]: any = await pool.query(sql, values);

    const mappedRows = rows.map((r: any) => ({
      id: r.id.toString(),
      nurse_name: r.nurse_name,
      shift: resolveShiftName(r.shift_code),
      department: r.department,
      schedule_date: r.schedule_date,
      note: r.note,
    }));

    return NextResponse.json(mappedRows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ============================================================
//  POST /api/schedules  — เพิ่มเวรใหม่
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nurseName, shift, department, date, note, requestedBy } = body;

    // 1. Basic validation
    if (!nurseName || !shift || !department || !date) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบ (nurseName, shift, department, date)' },
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

    // 2. ดึงข้อมูล ShiftType สำหรับตรวจ conflict
    const [shiftRows]: any = await pool.query(
      'SELECT id, code, name, start_time, end_time, working_hours FROM tbl_shift_types WHERE id = ?',
      [shiftTypeId]
    );
    if (!shiftRows.length) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลประเภทกะในระบบ' }, { status: 404 });
    }
    const shiftType: ShiftType = shiftRows[0];

    // 3. Duplicate check
    const dupError = await checkDuplicate(nurseName.trim(), date, shiftTypeId);
    if (dupError) {
      return NextResponse.json({ error: dupError }, { status: 409 });
    }

    // 4. Time conflict check
    const conflictError = await checkTimeConflict(nurseName.trim(), date, shiftType);
    if (conflictError) {
      return NextResponse.json({ error: conflictError }, { status: 409 });
    }

    // 5. Insert
    const [result]: any = await pool.query(
      'INSERT INTO tbl_schedules (emp_id, shift_type_id, role, schedule_date, notes, status) VALUES (?,?,?,?,?,?)',
      [nurseName.trim(), shiftTypeId, department, date, note ?? '', 'Published']
    );

    const newId = result.insertId.toString();

    // 6. Audit log
    await logAudit(
      requestedBy ?? 'System',
      `CREATE schedule id=${newId} emp=${nurseName} date=${date} shift=${shift} dept=${department}`
    );

    // 7. Email notification (non-blocking)
    sendScheduleEmail(nurseName.trim(), 'created', {
      date,
      shiftName: shift,
      department,
      note,
    });

    return NextResponse.json({ success: true, id: newId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
