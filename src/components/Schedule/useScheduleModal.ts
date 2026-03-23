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
  { value: 'Morning', label: 'Morning (เช้า)', color: '#10b981' },
  { value: 'Afternoon', label: 'Afternoon (บ่าย)', color: '#f59e0b' },
  { value: 'Night', label: 'Night (ดึก)', color: '#8b5cf6' },
]

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

  // Validation
  function validate(): boolean {
    const errs: string[] = []
    if (!selectedDate) errs.push('ต้องเลือกวันที่')
    if (!form.nurseName.trim()) errs.push('ต้องระบุพนักงาน')
    if (!form.shift) errs.push('ต้องเลือกประเภทเวร')
    if (!form.department) errs.push('ต้องเลือกแผนก')

    // ตรวจสอบ: พยาบาล 1 คน ห้ามมีมากกว่า 1 เวร (ประเภทเดียวกัน) ในวันเดียวกัน
    if (form.nurseName.trim() && selectedDate && form.shift) {
      const dateStr = new Date(selectedDate).toDateString()
      const nurseName = form.nurseName.trim().toLowerCase()
      const duplicate = schedules.find((s) => {
        if (editingId && s.id === editingId) return false
        return (
          new Date(s.date).toDateString() === dateStr &&
          s.nurseName.trim().toLowerCase() === nurseName &&
          s.shift === form.shift
        )
      })
      if (duplicate) {
        errs.push(`พนักงานคนนี้มีเวร ${duplicate.shift} ในวันนี้แล้ว`)
      }
    }

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
  }
}
