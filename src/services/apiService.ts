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
  first_name_en: string
  last_name_en: string
  birth_date: string
  gender: string
  address: string
  citizen_id: string
  phone: string
  emp_type: string
  dept_id: string
  pos_id: string
  start_date: string
  base_salary: number
  status: string
  image: string
}

export interface Department {
  dept_id: string
  dept_name: string
}

export interface Position {
  pos_id: string
  pos_name: string
}

export interface Leave {
  leave_id: string
  emp_id: string
  leave_type_id: string
  start_date: string
  end_date: string
  reason: string
  status: string
  first_name_th: string
  last_name_th: string
  dept_name: string
}

export interface DashboardData {
  empCount: number
  leaveTodayCount: number
  vacantCount: number
  professions: { name: string; value: number }[]
  pendingTransfers: number
  pendingLeaves: number
}

// ---------- Helpers ----------

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error || `HTTP ${res.status}`)
  }
  return res.json()
}

// ============================================================
//  EMPLOYEES
// ============================================================

export const fetchEmployees = (): Promise<Employee[]> =>
  apiFetch<Employee[]>('/api/employees')

export const createEmployee = (formData: FormData): Promise<{ message: string }> =>
  apiFetch('/api/employees', { method: 'POST', body: formData })

export const updateEmployee = (
  emp_id: string,
  formData: FormData
): Promise<{ message: string }> =>
  apiFetch(`/api/employees/${emp_id}`, { method: 'PUT', body: formData })

export const deleteEmployee = (emp_id: string): Promise<{ message: string }> =>
  apiFetch(`/api/employees/${emp_id}`, { method: 'DELETE' })

// ============================================================
//  DEPARTMENTS
// ============================================================

export const fetchDepartments = (): Promise<Department[]> =>
  apiFetch<Department[]>('/api/departments')

// ============================================================
//  POSITIONS
// ============================================================

export const fetchPositions = (): Promise<Position[]> =>
  apiFetch<Position[]>('/api/positions')

// ============================================================
//  LEAVES
// ============================================================

export const fetchLeaves = (): Promise<Leave[]> =>
  apiFetch<Leave[]>('/api/leaves')

export const createLeave = (body: {
  emp_id: string
  leave_type_id: string
  start_date: string
  end_date: string
  reason: string
}): Promise<{ success: boolean }> =>
  apiFetch('/api/leaves', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

export const updateLeaveStatus = (
  leave_id: string,
  status: string
): Promise<{ success: boolean }> =>
  apiFetch(`/api/leaves/${leave_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })

// ============================================================
//  DASHBOARD
// ============================================================

export const fetchDashboard = (): Promise<DashboardData> =>
  apiFetch<DashboardData>('/api/dashboard')

// ============================================================
//  SCHEDULES
// ============================================================

export interface ScheduleRecord {
  id: string
  nurse_name: string
  shift: string
  department: string
  schedule_date: string   // "YYYY-MM-DD"
  note: string
  created_at?: string
}

export interface ScheduleBody {
  nurseName: string
  shift: string
  department: string
  date: string            // "YYYY-MM-DD"
  note?: string
}

export const fetchSchedules = (month?: string): Promise<ScheduleRecord[]> => {
  const url = month ? `/api/schedules?month=${month}` : '/api/schedules'
  return apiFetch<ScheduleRecord[]>(url)
}

export const createScheduleRecord = (body: ScheduleBody): Promise<{ success: boolean; id: string }> =>
  apiFetch('/api/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

export const updateScheduleRecord = (
  id: string,
  body: Omit<ScheduleBody, 'date'>
): Promise<{ success: boolean }> =>
  apiFetch(`/api/schedules/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

export const deleteScheduleRecord = (id: string): Promise<{ success: boolean }> =>
  apiFetch(`/api/schedules/${id}`, { method: 'DELETE' })
