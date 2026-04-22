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
  license_expire?: string;
  cneu_cme_points?: number
  
  email?: string
  password?: string
  role?: string
  staff_no?: number
  created_at?: string

  // Missing fields for Leave and Modal
  admission_date?: string;
  retirement_date?: string;
  department_name?: string;
  position_name?: string;
  quota_personal?: number;
  quota_sick?: number;
  quota_vacation?: number;
  trainings?: Training[];
}

export interface Training {
  id?: number | string;
  emp_id?: string;
  course_name: string;
  institution?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  certificate_file?: string;
  image_file?: string;
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

export interface Leave {
  leave_id: string | number;
  emp_id: string;
  first_name_th?: string;
  last_name_th?: string;
  dept_name?: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  reason?: string;
  status: string;
  photo?: string;
  current_stage?: string;
  dept_head_status?: string;
  admin_status?: string;
  housekeeper_status?: string;
  director_status?: string;
  quota_sick?: number;
  quota_personal?: number;
  quota_vacation?: number;
  emp_type?: string;
}

export interface ScheduleRecord {
  id: string;
  emp_id: string;
  schedule_date: string;
  nurse_name: string;
  shift: string;
  department: string;
  note?: string;
  first_name_th?: string;
  last_name_th?: string;
}

export interface ScheduleBody {
  nurseName: string;
  date: string;
  shift: string;
  department: string;
  note?: string;
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
  division?: string;
  sub_dept?: string;
}

export interface Position {
  pos_id: string
  pos_name: string
  description?: string
  base_salary?: number
}

export interface PayrollRecord {
  payroll_id: string;
  emp_id: string;
  prefix: string;
  first_name_th: string;
  last_name_th: string;
  pos_name: string;
  dept_name: string;
  base_salary: number;
  total_allowance: number;
  total_deduction: number;
  net_salary: number;
  status: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  image?: string;
  icon?: string;
  iconBg?: string;
  iconColor?: string;
  created_at: string;
}

export interface DashboardData {
  empCount: number;
  leaveTodayCount: number;
  vacantCount: number;
  professions: Array<{ name: string; value: number; color: string }>;
  pendingTransfers: number;
  pendingLeaves: number;
  expiringLicenses: number;
  expiredLicenses: number;
  leaveStats: {
    vacation: { remain: number; used: number; raw: number };
    personal: { remain: number; used: number; raw: number };
    sick: { remain: number; used: number; raw: number };
  };
  recentLeaves: any[];
  payrollData?: {
    currentNetSalary: number;
    paymentDate: string;
    history: Array<{ month: string; amount: number; date: string }>;
  } | null;
}

// ---------- API Services ----------

export const apiEmployees = {
  getAll: async () => {
    const res = await fetch('/api/employees')
    if (!res.ok) throw new Error('Failed to fetch employees')
    return res.json() as Promise<Employee[]>
  },

  getById: async (id: string) => {
    const res = await fetch(`/api/employees/${id}`)
    if (!res.ok) throw new Error('Failed to fetch employee')
    return res.json() as Promise<Employee>
  },

  create: async (fd: FormData) => {
    const res = await fetch('/api/employees', {
      method: 'POST',
      body: fd,
    })
    return res.json()
  },

  update: async (id: string, fd: FormData) => {
    const res = await fetch(`/api/employees/${id}`, {
      method: 'PUT',
      body: fd,
    })
    return res.json()
  },

  delete: async (id: string) => {
    const res = await fetch(`/api/employees/${id}`, {
      method: 'DELETE',
    })
    return res.json()
  },

  resetPassword: async (empId: string) => {
    const res = await fetch(`/api/employees/${empId}/reset-password`, {
      method: 'POST'
    });
    return res.json();
  }
}

// Standalone functions for hooks
export const fetchEmployees = apiEmployees.getAll;
export const createEmployee = apiEmployees.create;
export const updateEmployee = apiEmployees.update;
export const deleteEmployee = apiEmployees.delete;

export const apiDepartments = {
  getAll: async () => {
    const res = await fetch('/api/departments')
    if (!res.ok) throw new Error('Failed to fetch departments')
    return res.json() as Promise<Department[]>
  },
  create: async (body: any) => {
    const res = await fetch('/api/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  },
  update: async (id: string, body: any) => {
    const res = await fetch(`/api/departments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  },
  delete: async (id: string) => {
    const res = await fetch(`/api/departments/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  }
}

export const fetchDepartments = apiDepartments.getAll;
export const createDepartment = apiDepartments.create;
export const updateDepartment = apiDepartments.update;
export const deleteDepartment = apiDepartments.delete;

export const apiPositions = {
  getAll: async () => {
    const res = await fetch('/api/positions')
    if (!res.ok) throw new Error('Failed to fetch positions')
    return res.json() as Promise<Position[]>
  }
}

export const fetchPositions = apiPositions.getAll;

export const apiLicenses = {
  getHistory: async (licenseNo: string) => {
    const res = await fetch(`/api/licenses/history/${licenseNo}`);
    if (!res.ok) throw new Error('Failed to fetch license history');
    return res.json();
  }
}

// Missing Leaves functions
export const fetchLeaves = async () => {
  const res = await fetch('/api/leaves');
  if (!res.ok) throw new Error('Failed to fetch leaves');
  return res.json() as Promise<Leave[]>;
}

export const createLeave = async (body: any) => {
  const res = await fetch('/api/leaves', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Failed to create leave');
  return res.json();
}

export const updateLeaveStatus = async (id: string | number, status: string, stage?: string) => {
  const res = await fetch(`/api/leaves/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, stage }),
  });
  if (!res.ok) throw new Error('Failed to update leave status');
  return res.json();
}

// Missing Schedules functions
export const fetchSchedules = async (month?: string) => {
  const url = month ? `/api/schedules?month=${month}` : '/api/schedules';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch schedules');
  return res.json() as Promise<ScheduleRecord[]>;
}

export const createScheduleRecord = async (body: ScheduleBody) => {
  const res = await fetch('/api/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Failed to create schedule');
  return res.json();
}

export const updateScheduleRecord = async (id: string, body: any) => {
  const res = await fetch(`/api/schedules/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Failed to update schedule');
  return res.json();
}

export const deleteScheduleRecord = async (id: string) => {
  const res = await fetch(`/api/schedules/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete schedule');
  return res.json();
}

// Payroll functions
export const fetchPayrollDashboard = async (empId?: string) => {
  const url = empId ? `/api/payroll/dashboard?emp_id=${empId}` : '/api/payroll/dashboard';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch payroll dashboard');
  return res.json();
}

// Announcements functions
export const fetchAnnouncements = async () => {
  const res = await fetch('/api/announcements');
  if (!res.ok) throw new Error('Failed to fetch announcements');
  return res.json() as Promise<{ success: boolean; data: Announcement[] }>;
}

// Dashboard functions
export const fetchDashboard = async (empId?: string, role?: string) => {
  const url = new URL('/api/dashboard', window.location.origin);
  if (empId) url.searchParams.append('emp_id', empId);
  if (role) url.searchParams.append('role', role);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch dashboard data');
  return res.json() as Promise<DashboardData>;
}



