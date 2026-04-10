// Modal สำหรับเพิ่ม / แก้ไข / ลบเวร + Validation
import { useState, useMemo, useEffect } from 'react'

export interface Schedule {
  id: string
  date: Date
  nurseName: string
  shift: string
  department: string
  note: string
  startTime?: string
}

export interface ShiftType {
  value: string
  label: string
  color: string
}

export interface Employee {
  emp_id: string;
  prefix: string;
  first_name_th: string;
  last_name_th: string;
  dept_id?: string;
}

export interface ScheduleForm {
  nurseName: string
  shift: string
  department: string
  note: string
}

// ประเภทเวรเริ่มต้น (ใช้เผื่อดึง API ไม่ได้)
export const SHIFT_TYPES: ShiftType[] = [
  { value: 'Morning', label: 'Morning (08:00 - 16:00)', color: '#10b981' },
  { value: 'Afternoon', label: 'Afternoon (16:00 - 00:00)', color: '#f59e0b' },
  { value: 'Night', label: 'Night (00:00 - 08:00)', color: '#8b5cf6' },
]

export const SHIFT_CONFIG: Record<string, { start: string, end: string }> = {
  Morning: { start: "08:00", end: "16:00" },
  Afternoon: { start: "16:00", end: "00:00" },
  Night: { start: "00:00", end: "08:00" },
};
const MIN_REST_HOURS = 10;
const MIN_REST_MINUTES = MIN_REST_HOURS * 60;

function toMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function getAbsoluteShiftMetrics(date: Date, shiftCode: string) {
    const baseMinutes = Math.floor(date.getTime() / 60000);
    const config = SHIFT_CONFIG[shiftCode] || SHIFT_CONFIG['Morning'];
    const startMins = toMinutes(config.start);
    let endMins = toMinutes(config.end);
    if (endMins <= startMins) endMins += 1440;

    return {
        start: baseMinutes + startMins,
        end: baseMinutes + endMins
    };
}

// ดึงข้อมูลแผนกผ่าน hook (dynamic)
import { useDepartments } from '@/hooks/useDepartments'

const EMPTY_FORM: ScheduleForm = {
  nurseName: '',
  shift: '',
  department: '',
  note: '',
}

let idCounter = 1
function generateId() {
  return String(idCounter++).padStart(3, '0')
}

export default function useScheduleModal(
  schedules: Schedule[],
  setSchedules: React.Dispatch<React.SetStateAction<Schedule[]>>
) {
  const [showModal, setShowModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [form, setForm] = useState<ScheduleForm>({ ...EMPTY_FORM })
  const [employees, setEmployees] = useState<Employee[]>([])
  
  const { departments: deptData, loadDepartments } = useDepartments()

  const isEditing = useMemo(() => editingId !== null, [editingId])

  // Fetch employees for dropdown
  useEffect(() => {
    loadDepartments()
    fetch('/api/employees')
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data)) setEmployees(data)
      })
      .catch(console.error)
  }, [loadDepartments])

  function openModal(date: Date) {
    setSelectedDate(date)
    setEditingId(null)
    setErrors([])
    setForm({ ...EMPTY_FORM })
    setShowModal(true)
  }

  function openEditModal(schedule: Schedule) {
    setSelectedDate(schedule.date)
    setEditingId(schedule.id)
    setErrors([])
    setForm({
      nurseName: schedule.nurseName,
      shift: schedule.shift,
      department: schedule.department,
      note: schedule.note || '',
    })
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setErrors([])
  }

  const checkRestConflict = (empNameStr: string, targetDate: Date | null, targetShift: string, excludeId?: string | null): string[] => {
    const errs: string[] = [];
    if (!empNameStr || !targetDate || !targetShift) return errs;

    const empIdOnly = empNameStr.split(' - ')[0].trim();
    const newMetrics = getAbsoluteShiftMetrics(targetDate, targetShift);
    
    const empSchedules = schedules.filter(s => 
      s.nurseName === empIdOnly && 
      (!excludeId || s.id !== excludeId)
    );

    for (const row of empSchedules) {
      const existMetrics = getAbsoluteShiftMetrics(row.date, row.shift);
      const rowDateStr = row.date.toLocaleDateString('th-TH', { month: 'short', day: 'numeric', year: 'numeric' });
      
      if (newMetrics.start < existMetrics.end && existMetrics.start < newMetrics.end) {
        errs.push(`เวลาทับซ้อนกับเวร ${row.shift} วันที่ ${rowDateStr}`);
        continue;
      }

      if (newMetrics.start >= existMetrics.end) {
        const rest = newMetrics.start - existMetrics.end;
        if (rest < MIN_REST_MINUTES) {
          errs.push(`พักไม่พอ (${+(rest / 60).toFixed(1)} ชม.) จากเวร ${row.shift} ของวันที่ ${rowDateStr}`);
        }
      }
      if (existMetrics.start >= newMetrics.end) {
        const rest = existMetrics.start - newMetrics.end;
        if (rest < MIN_REST_MINUTES) {
          errs.push(`พักไม่พอ (${+(rest / 60).toFixed(1)} ชม.) เพื่อไปเข้าเวร ${row.shift} วันที่ ${rowDateStr}`);
        }
      }
    }
    return errs;
  };

  // Validation
  function validate(): boolean {
    const errs: string[] = []
    if (!selectedDate) errs.push('ต้องเลือกวันที่')
    if (!form.nurseName.trim()) errs.push('ต้องระบุพนักงาน')
    if (!form.shift) errs.push('ต้องเลือกประเภทเวร')
    if (!form.department) errs.push('ต้องเลือกแผนก')

    const conflictErrors = checkRestConflict(form.nurseName, selectedDate, form.shift, editingId);
    errs.push(...conflictErrors);

    setErrors(errs)
    return errs.length === 0
  }

  function saveSchedule(): boolean {
    if (!validate()) return false

    if (editingId) {
      setSchedules((prev) =>
        prev.map((s) =>
          s.id === editingId
            ? {
                ...s,
                nurseName: form.nurseName.trim(),
                shift: form.shift,
                department: form.department,
                note: form.note.trim(),
              }
            : s
        )
      )
    } else {
      setSchedules((prev) => [
        ...prev,
        {
          id: generateId(),
          date: selectedDate!,
          nurseName: form.nurseName.trim(),
          shift: form.shift,
          department: form.department,
          note: form.note.trim(),
        },
      ])
    }
    return true
  }

  // ลบเวร
  function deleteSchedule(id: string) {
    setSchedules((prev) => prev.filter((s) => s.id !== id))
    closeModal()
  }

  function getSchedulesForDate(date: Date | null): Schedule[] {
    if (!date) return []
    const dateStr = new Date(date).toDateString()
    return schedules.filter((s) => new Date(s.date).toDateString() === dateStr)
  }

  function getShiftColor(shift: string): string {
    const found = SHIFT_TYPES.find((s) => s.value === shift)
    return found ? found.color : '#64748b'
  }

  return {
    showModal,
    selectedDate,
    editingId,
    errors,
    shiftTypes: SHIFT_TYPES,
    departments: deptData.map(d => d.dept_name),
    deptData, // Add full objects
    employees,
    form,
    setForm,
    isEditing,
    openModal,
    openEditModal,
    closeModal,
    saveSchedule,
    deleteSchedule,
    getSchedulesForDate,
    getShiftColor,
    checkRestConflict,
  }
}
