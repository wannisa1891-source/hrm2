// ============================================================
//  HRM API Service Layer
//  ใช้ fetch() เรียก Next.js API routes
// ============================================================

// ---------- Types ----------

export interface Employee {
  emp_id: string
  prefix: string
  first_name_th: string
  last_name_th: string
  nickname?: string
  birth_date: string
  gender: string
  address: string
  citizen_id: string
  phone: string
  emp_type: string
  dept_id: string
  pos_id: string
  start_date: string
  status: string
  image: string

  // -- UI Mock Fields & Additional Info --
  addr_no?: string
  addr_moo?: string
  addr_village?: string
  addr_soi?: string
  addr_road?: string
  addr_province?: string
  addr_district?: string
  addr_subdistrict?: string
  addr_zipcode?: string

  has_license?: boolean | number
  licenses?: ProfessionalLicense[]
  license_status?: string
  license_expire?: string
  cneu_cme_points?: number

  email?: string
  password?: string
  role?: string
  staff_no?: number
  created_at?: string

  admission_date?: string
  retirement_date?: string
  department_name?: string
  position_name?: string
  quota_personal?: number
  quota_sick?: number
  quota_vacation?: number
  accumulated_vacation?: number
  trainings?: Training[]
}

export interface Training {
  id?: number | string
  emp_id?: string
  course_name: string
  institution?: string
  location?: string
  start_date?: string
  end_date?: string
  certificate_file?: string
  image_file?: string
}

export interface ProfessionalLicense {
  id?: number | string
  emp_id?: string
  license_name?: string
  license_type?: string
  license_no?: string
  institution?: string
  issue_date?: string
  expire_date?: string
  status?: string
  file_path?: string | string[]
  files?: File[]
  file?: File | null
  previewUrl?: string | null
}

export interface Leave {
  leave_id: string | number
  emp_id: string
  first_name_th?: string
  last_name_th?: string
  dept_name?: string
  leave_type_id: string
  start_date: string
  end_date: string
  reason?: string
  status: string
  image?: string
  current_stage?: string
  dept_head_status?: string
  admin_status?: string
  housekeeper_status?: string
  director_status?: string
  quota_sick?: number
  quota_personal?: number
  quota_vacation?: number
  accumulated_vacation?: number
  emp_type?: string
  start_date_work?: string
  dept_id?: string
  leave_category?: string
}

export interface ScheduleRecord {
  id: string
  nurse_name: string
  shift: string
  department: string
  schedule_date: string   // "YYYY-MM-DD"
  note: string
  startTime?: string
  endTime?: string
  booker_name?: string
  contact_phone?: string
  unit_name?: string
  created_at?: string
  first_name_th?: string
  last_name_th?: string
}

export interface ScheduleBody {
  nurseName: string
  shift: string
  department: string
  date: string            // "YYYY-MM-DD"
  startTime?: string
  endTime?: string
  note?: string
  bookerName?: string
  contactPhone?: string
  unitName?: string
}

export interface Department {
  dept_id: string
  dept_name: string
  division?: string
  sub_dept?: string
  description?: string
  head_emp_id?: string
  phone?: string
}

export interface Position {
  pos_id: string
  pos_name: string
  description?: string
  base_salary?: number
}

export interface PayrollRecord {
  payroll_id: string
  emp_id: string
  prefix: string
  first_name_th: string
  last_name_th: string
  pos_name: string
  dept_name: string
  base_salary: number
  total_allowance: number
  total_deduction: number
  net_salary: number
  status: string
}

export interface Announcement {
  id: number
  title: string
  content: string
  image?: string
  created_at: string
}

export interface DashboardData {
  empCount: number
  leaveTodayCount: number
  vacantCount: number
  professions: Array<{ name: string; value: number; color: string }>
  pendingTransfers: number
  pendingLeaves: number
  expiringLicenses: number
  expiredLicenses: number
  leaveStats: {
    vacation: { remain: number; used: number; raw: number }
    personal: { remain: number; used: number; raw: number }
    sick: { remain: number; used: number; raw: number }
  }
  recentLeaves: any[]
  payrollData?: {
    currentNetSalary: number
    paymentDate: string
    history: Array<{ month: string; amount: number; date: string }>
  } | null
}

// ---------- API Services ----------

const apiFetch = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const res = await fetch(url, options)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const fetchEmployees = () => apiFetch<Employee[]>('/api/employees')
export const fetchEmployeeById = (id: string) => apiFetch<Employee>(`/api/employees/${id}`)
export const createEmployee = (fd: FormData) => apiFetch<{ message: string }>('/api/employees', { method: 'POST', body: fd })
export const updateEmployee = (id: string, fd: FormData) => apiFetch<{ message: string; image?: string | null }>(`/api/employees/${id}`, { method: 'PUT', body: fd })
export const deleteEmployee = (id: string) => apiFetch<{ message: string }>(`/api/employees/${id}`, { method: 'DELETE' })

export const fetchDepartments = () => apiFetch<Department[]>('/api/departments')
export const createDepartment = (body: any) => apiFetch<{ message: string }>('/api/departments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})
export const updateDepartment = (id: string, body: any) => apiFetch<{ message: string }>(`/api/departments/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})
export const deleteDepartment = (id: string) => apiFetch<{ message: string }>(`/api/departments/${id}`, { method: 'DELETE' })

export const fetchPositions = () => apiFetch<Position[]>('/api/positions')

export const fetchLeaves = () => apiFetch<Leave[]>('/api/leaves')
export const createLeave = (body: any) => apiFetch<{ success: boolean }>('/api/leaves', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})
export const updateLeaveStatus = (id: string | number, status: string, stage?: string) => apiFetch<{ success: boolean }>(`/api/leaves/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status, stage }),
})

export const fetchSchedules = (month?: string) => {
  const url = month ? `/api/schedules?month=${month}` : '/api/schedules'
  return apiFetch<ScheduleRecord[]>(url)
}
export const createScheduleRecord = (body: ScheduleBody) => apiFetch<{ success: boolean; id: string }>('/api/schedules', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})
export const updateScheduleRecord = (id: string, body: any) => apiFetch<{ success: boolean }>(`/api/schedules/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})
export const deleteScheduleRecord = (id: string) => apiFetch<{ success: boolean }>(`/api/schedules/${id}`, { method: 'DELETE' })

export const fetchPayrollDashboard = (empId?: string) => {
  const url = empId ? `/api/payroll/dashboard?emp_id=${empId}` : '/api/payroll/dashboard'
  return apiFetch<{
    employees: PayrollRecord[],
    targetMonth: number,
    targetYear: number
  }>(url)
}

export const fetchAnnouncements = () => apiFetch<{ success: boolean; data: Announcement[] }>('/api/announcements')

export const fetchDashboard = (empId?: string, role?: string) => {
  const params = new URLSearchParams()
  if (empId) params.append('emp_id', empId)
  if (role) params.append('role', role)
  const qs = params.toString()
  return apiFetch<DashboardData>(`/api/dashboard${qs ? `?${qs}` : ''}`)
}
