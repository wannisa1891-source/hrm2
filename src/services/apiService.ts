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
  // DB Address
  address: string
  // DB other fields
  citizen_id: string
  phone: string
  emp_type: string
  dept_id: string
  pos_id: string
  start_date: string
  base_salary: number
  status: string
  image: string
  
  // -- UI Mock Fields (Not in DB yet) --
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
  license_status?: string;
  cneu_cme_points?: number
  
  email?: string
  password?: string
  role?: string
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
  file_path?: string
  
  // UI-only properties for tracking files before upload
  file?: File | null
  previewUrl?: string | null
}

export interface Department {
  dept_id: string
  dept_name: string
  description?: string
  head_emp_id?: string
  phone?: string
  org_chart_url?: string
  sop_url?: string
  rules_url?: string
}

export interface Position {
  pos_id: string
  pos_name: string
}

export interface Leave {
  leave_id: string;
  emp_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  reason?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  created_at: string;
  first_name_th?: string;
  last_name_th?: string;
  photo?: string | null;
  dept_name?: string;
  quota_personal?: number;
  quota_vacation?: number;
  quota_sick?: number;
}

export interface DashboardData {
  empCount: number
  leaveTodayCount: number
  vacantCount: number
  professions: { name: string; value: number; color?: string }[]
  pendingTransfers: number
  pendingLeaves: number
  expiringLicenses: number
  expiredLicenses: number
  leaveStats?: {
    vacation: { remain: number; used: number; raw: number }
    personal: { remain: number; used: number; raw: number }
    sick: { remain: number; used: number; raw: number }
  }
  recentLeaves?: any[]
}

export interface Announcement {
  id: string
  title: string
  content: string
  image?: string
  created_at: string
  date?: string // Formatted for UI
}

export interface PayrollRecord {
  payroll_id: string
  emp_id: string
  pay_month: number
  pay_year: number
  base_salary: number
  total_allowance: number
  total_deduction: number
  net_salary: number
  status: string
  first_name_th?: string
  last_name_th?: string
  prefix?: string
  dept_name?: string
  allowances_breakdown?: Record<string, number>
}

export interface AuditLog {
  id: string
  user_id: string
  action: string
  details: string
  timestamp: string
  username?: string
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
): Promise<{ message: string; image?: string | null }> =>
  apiFetch(`/api/employees/${emp_id}`, { method: 'PUT', body: formData })

export const deleteEmployee = (emp_id: string): Promise<{ message: string }> =>
  apiFetch(`/api/employees/${emp_id}`, { method: 'DELETE' })

// ============================================================
//  DEPARTMENTS
// ============================================================

export const fetchDepartments = (): Promise<Department[]> =>
  apiFetch<Department[]>('/api/departments')

export const createDepartment = (body: Partial<Department>): Promise<{ message: string }> =>
  apiFetch('/api/departments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

export const updateDepartment = (dept_id: string, body: Partial<Department>): Promise<{ message: string }> =>
  apiFetch(`/api/departments/${dept_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

export const deleteDepartment = (dept_id: string): Promise<{ message: string }> =>
  apiFetch(`/api/departments/${dept_id}`, { method: 'DELETE' })

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

export const fetchDashboard = (empId?: string, role?: string): Promise<DashboardData> => {
  const params = new URLSearchParams()
  if (empId) params.append('emp_id', empId)
  if (role) params.append('role', role)
  const qs = params.toString()
  return apiFetch<DashboardData>(`/api/dashboard${qs ? `?${qs}` : ''}`)
}

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

// ============================================================
//  PAYROLL
// ============================================================

export const fetchPayrollDashboard = (empId?: string): Promise<{
  employees: PayrollRecord[],
  targetMonth: number,
  targetYear: number
}> => {
  const url = empId ? `/api/payroll/dashboard?emp_id=${empId}` : '/api/payroll/dashboard'
  return apiFetch(url)
}

// ============================================================
//  ANNOUNCEMENTS
// ============================================================

export const fetchAnnouncements = (): Promise<{ success: boolean; data: Announcement[] }> =>
  apiFetch('/api/announcements')

// ============================================================
//  AUDIT LOGS
// ============================================================

export const fetchAuditLogs = (): Promise<AuditLog[]> =>
  apiFetch('/api/audit-logs')
