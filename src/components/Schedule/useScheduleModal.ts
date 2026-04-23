// Modal สำหรับเพิ่ม / แก้ไข / ลบการประชุม + Validation
import { useState, useMemo, useEffect, useCallback } from 'react'
import { useDepartments } from '@/hooks/useDepartments'

export interface Schedule {
  id: string
  date: Date
  subject: string
  room: string
  organizer: string
  unit?: string
  bookerName?: string
  contactPhone?: string
  note: string
  startTime: string
  endTime: string
  memoFile?: string
  projectFile?: string
  transportCost?: number
  accommodationCost?: number
  organizerPay?: number
  parentPay?: number
}

export interface RoomType {
  value: string
  label: string
  color: string
  location?: string
  capacity?: number
}

export interface Employee {
  emp_id: string;
  prefix: string;
  first_name_th: string;
  last_name_th: string;
  dept_id?: string;
}

export interface ScheduleForm {
  subject: string
  room: string
  organizer: string
  unit: string
  bookerName: string
  contactPhone: string
  note: string
  startTime: string
  endTime: string
  memoFile: string
  projectFile: string
  transportCost: number
  accommodationCost: number
  organizerPay: number
  parentPay: number
}

const EMPTY_FORM: ScheduleForm = {
  subject: '',
  room: '',
  organizer: '',
  unit: '',
  bookerName: '',
  contactPhone: '',
  note: '',
  startTime: '09:00',
  endTime: '10:00',
  memoFile: '',
  projectFile: '',
  transportCost: 0,
  accommodationCost: 0,
  organizerPay: 0,
  parentPay: 0,
}

const DEPARTMENT_HIERARCHY: Record<string, string[]> = {
  'กลุ่มงานบริหารทั่วไป': ['การเงิน', 'ธุรการ', 'พัสดุ', 'ช่าง', 'สวน', 'พขร.', 'งานโสตฯ'],
  'กลุ่มงานเทคนิคการแพทย์': [],
  'กลุ่มงานทันตกรรม': [],
  'กลุ่มงานเภสัชกรรมและคุ้มครองผู้บริโภค': [],
  'กลุ่มงานการแพทย์': [],
  'กลุ่มงานโภชนศาสตร์': [],
  'กลุ่มงานรังสีวิทยา': [],
  'กลุ่มงานเวชกรรมฟื้นฟู': [],
  'กลุ่มงานประกันสุขภาพ ยุทธศาสตร์และสารสนเทศทางการแพทย์': ['ประกัน', 'คอมฯ', 'ห้องบัตร'],
  'กลุ่มงานบริการด้านปฐมภูมิและองค์รวม': ['งานจิตเวชและยาเสพติด'],
  'กลุ่มงานการพยาบาล': [
    'ศูนย์คุณภาพ', 'งานการพยาบาลผู้ป่วยอุบัติเหตุฉุกเฉินและนิติเวช', 'ห้องคลอด', 'NICU', 
    'หญิง', 'ชาย', 'ICU', 'พิเศษ', 'ซัพพลาย', 'OPD', 'แม่บ้าน', 'เปล', 'ห้องผ่าตัด'
  ],
  'กลุ่มงานแพทย์แผนไทยและการแพทย์ทางเลือก': ['แผนไทย แบ่งเปอร์เซนต์'],
}

export default function useScheduleModal(
  schedules: Schedule[],
  refreshSchedules: () => void
) {
  const [showModal, setShowModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [form, setForm] = useState<ScheduleForm>({ ...EMPTY_FORM })
  const [employees, setEmployees] = useState<Employee[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  
  const { departments: deptData, loadDepartments } = useDepartments()

  const isEditing = useMemo(() => editingId !== null, [editingId])

  // Get available units based on selected department
  const availableUnits = useMemo(() => {
    if (!form.organizer) return []
    const list = DEPARTMENT_HIERARCHY[form.organizer] || []
    return list.length > 0 ? list : [form.organizer] // Default to department name if no units
  }, [form.organizer])

  // Auto-select unit when organizer changes
  useEffect(() => {
    if (form.organizer && availableUnits.length > 0) {
      if (!availableUnits.includes(form.unit)) {
        setForm(f => ({ ...f, unit: availableUnits[0] }));
      }
    }
  }, [form.organizer, availableUnits, form.unit]);

  // Fetch rooms and employees
  useEffect(() => {
    loadDepartments()
    fetch('/api/rooms')
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data)) setRoomTypes(data)
      })
      .catch(console.error)

    fetch('/api/employees')
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data)) setEmployees(data)
      })
      .catch(console.error)
  }, [loadDepartments])

  const openModal = useCallback((date: Date) => {
    setSelectedDate(date)
    setEditingId(null)
    setErrors([])
    setForm({ ...EMPTY_FORM })
    setShowModal(true)
  }, [])

  const openEditModal = useCallback((schedule: Schedule) => {
    setSelectedDate(schedule.date)
    setEditingId(schedule.id)
    setErrors([])
    setForm({
      subject: schedule.subject,
      room: schedule.room,
      organizer: schedule.organizer,
      unit: schedule.unit || '',
      bookerName: schedule.bookerName || '',
      contactPhone: schedule.contactPhone || '',
      note: schedule.note,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      memoFile: schedule.memoFile || '',
      projectFile: schedule.projectFile || '',
      transportCost: schedule.transportCost || 0,
      accommodationCost: schedule.accommodationCost || 0,
      organizerPay: schedule.organizerPay || 0,
      parentPay: schedule.parentPay || 0,
    })
    setShowModal(true)
  }, [])

  const closeModal = useCallback(() => {
    setShowModal(false)
    setEditingId(null)
    setForm({ ...EMPTY_FORM })
    setErrors([])
  }, [])

  const checkRoomConflict = useCallback((room: string, date: Date, start: string, end: string, excludeId: string | null) => {
    const dateStr = date.toDateString();
    const newStart = new Date(`${dateStr} ${start}`).getTime();
    const newEnd = new Date(`${dateStr} ${end}`).getTime();

    const conflicts = schedules.filter(s => {
      if (s.room !== room) return false;
      if (excludeId && s.id === excludeId) return false;
      if (s.date.toDateString() !== dateStr) return false;

      const sStart = new Date(`${dateStr} ${s.startTime}`).getTime();
      const sEnd = new Date(`${dateStr} ${s.endTime}`).getTime();

      return (newStart < sEnd && newEnd > sStart);
    });

    return conflicts.map(c => `ชนกับ "${c.subject}" (${c.startTime} - ${c.endTime})`);
  }, [schedules]);

  const saveSchedule = async (data: ScheduleForm) => {
    // Logic handles in SchedulePage handleSave for now
  }

  const deleteSchedule = async (id: string) => {
    if (!confirm('คุณต้องการยกเลิกการนัดหมายนี้ใช่หรือไม่?')) return;
    
    try {
      const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
      if (res.ok) {
        refreshSchedules();
        closeModal();
      } else {
        const data = await res.json();
        alert(data.error || 'ลบไม่สำเร็จ');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  }

  function getSchedulesForDate(date: Date | null): Schedule[] {
    if (!date) return []
    const dateStr = new Date(date).toDateString()
    return schedules.filter((s) => new Date(s.date).toDateString() === dateStr)
  }

  function getShiftColor(roomName: string): string {
    const found = roomTypes.find((r) => r.label === roomName)
    return found ? found.color : '#64748b'
  }

  return {
    showModal,
    selectedDate,
    editingId,
    errors,
    roomTypes,
    departments: Object.keys(DEPARTMENT_HIERARCHY),
    units: availableUnits,
    employees,
    deptData,
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
    checkRoomConflict,
  }
}
