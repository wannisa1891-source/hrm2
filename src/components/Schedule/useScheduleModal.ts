// Modal สำหรับเพิ่ม / แก้ไข / ลบเวร + Validation
import { useState, useMemo } from 'react'

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

export interface ScheduleForm {
  nurseName: string
  shift: string
  department: string
  note: string
}

// ประเภทเวร
export const SHIFT_TYPES: ShiftType[] = [
  { value: 'Morning', label: '🟢 Morning (เช้า)', color: '#10b981' },
  { value: 'Afternoon', label: '🟠 Afternoon (บ่าย)', color: '#f59e0b' },
  { value: 'Night', label: '🟣 Night (ดึก)', color: '#8b5cf6' },
]

// แผนกที่มีในระบบ
export const DEPARTMENTS = ['ICU', 'ER', 'OPD', 'IPD', 'OR', 'LR', 'NICU', 'Ward']

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

  const isEditing = useMemo(() => editingId !== null, [editingId])

  // เปิด modal สำหรับเพิ่มเวรใหม่
  function openModal(date: Date) {
    setSelectedDate(date)
    setEditingId(null)
    setErrors([])
    setForm({ ...EMPTY_FORM })
    setShowModal(true)
  }

  // เปิด modal สำหรับแก้ไขเวร
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

  // ปิด modal
  function closeModal() {
    setShowModal(false)
    setErrors([])
  }

  // Validation
  function validate(): boolean {
    const errs: string[] = []
    if (!selectedDate) errs.push('ต้องเลือกวันที่')
    if (!form.nurseName.trim()) errs.push('ต้องกรอกชื่อพยาบาล')
    if (!form.shift) errs.push('ต้องเลือกประเภทเวร')
    if (!form.department) errs.push('ต้องเลือกแผนก')

    // ตรวจสอบ: พยาบาล 1 คน ห้ามมีมากกว่า 1 เวร ในวันเดียวกัน
    if (form.nurseName.trim() && selectedDate) {
      const dateStr = new Date(selectedDate).toDateString()
      const nurseName = form.nurseName.trim().toLowerCase()
      const duplicate = schedules.find((s) => {
        if (editingId && s.id === editingId) return false
        return (
          new Date(s.date).toDateString() === dateStr &&
          s.nurseName.trim().toLowerCase() === nurseName
        )
      })
      if (duplicate) {
        errs.push(`${form.nurseName} มีเวรในวันนี้แล้ว (${duplicate.shift})`)
      }
    }

    setErrors(errs)
    return errs.length === 0
  }

  // บันทึกเวร (เพิ่ม / แก้ไข)
  function saveSchedule(): boolean {
    if (!validate()) return false

    if (editingId) {
      // แก้ไข
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
      // เพิ่มใหม่
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
    closeModal()
    return true
  }

  // ลบเวร
  function deleteSchedule(id: string) {
    setSchedules((prev) => prev.filter((s) => s.id !== id))
    closeModal()
  }

  // ดึงเวรของวันที่เฉพาะ
  function getSchedulesForDate(date: Date | null): Schedule[] {
    if (!date) return []
    const dateStr = new Date(date).toDateString()
    return schedules.filter((s) => new Date(s.date).toDateString() === dateStr)
  }

  // ดึงสีเวร
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
    departments: DEPARTMENTS,
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
