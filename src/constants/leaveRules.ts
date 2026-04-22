export interface LeaveQuota {
  personal: number;
  sick: number;
  vacation: number;
  canAccumulateVacation: boolean;
}

export const EMPLOYEE_TYPES = [
  'ราชการ',
  'พนักงานราชการ',
  'ลูกจ้างพนักงานกระทรวง',
  'ลูกจ้างชั่วคราว(นักเรียนทุน)',
  'ลูกจ้างรายเดือน',
  'ลูกจ้างรายวัน',
  'ลูกจ้างเหมา',
  'ลูกจ้างชั่วคราวที่อายุ 60 ปี',
] as const;

export type EmployeeType = (typeof EMPLOYEE_TYPES)[number];

export const LEAVE_RULES: Record<EmployeeType, LeaveQuota> = {
  'ราชการ': {
    personal: 45,
    sick: 60,
    vacation: 10,
    canAccumulateVacation: true,
  },
  'พนักงานราชการ': {
    personal: 10,
    sick: 30,
    vacation: 15,
    canAccumulateVacation: true,
  },
  'ลูกจ้างพนักงานกระทรวง': {
    personal: 15,
    sick: 45,
    vacation: 15,
    canAccumulateVacation: true, // User said "เก็บสะสมไม่เกิน 15 วัน/ปี"
  },
  'ลูกจ้างชั่วคราว(นักเรียนทุน)': {
    personal: 0,
    sick: 15,
    vacation: 10,
    canAccumulateVacation: false,
  },
  'ลูกจ้างรายเดือน': {
    personal: 0,
    sick: 15,
    vacation: 10,
    canAccumulateVacation: false,
  },
  'ลูกจ้างรายวัน': {
    personal: 0,
    sick: 8, // Special handling for 1st year needed if strict, but default to 8 or 15
    vacation: 10,
    canAccumulateVacation: false,
  },
  'ลูกจ้างเหมา': {
    personal: 0,
    sick: 0,
    vacation: 0,
    canAccumulateVacation: false,
  },
  'ลูกจ้างชั่วคราวที่อายุ 60 ปี': {
    personal: 0,
    sick: 15,
    vacation: 10,
    canAccumulateVacation: false,
  },
};

/**
 * Calculates sick leave quota for Daily Employees based on work duration.
 * @param startDate The employee's start date
 * @returns number of sick leave days allowed
 */
export const getSickQuotaForDaily = (startDate: string | Date): number => {
  const start = new Date(startDate);
  const now = new Date();
  
  // Calculate tenure in years
  let tenureYears = now.getFullYear() - start.getFullYear();
  const m = now.getMonth() - start.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < start.getDate())) {
    tenureYears--;
  }
  
  return tenureYears >= 1 ? 15 : 8;
};

export const getQuotaByType = (type: string, startDate?: string | Date): LeaveQuota => {
  const rule = LEAVE_RULES[type as EmployeeType];
  if (!rule) {
    return { personal: 0, sick: 0, vacation: 0, canAccumulateVacation: false };
  }
  
  if (type === 'ลูกจ้างรายวัน' && startDate) {
    return { ...rule, sick: getSickQuotaForDaily(startDate) };
  }
  
  return rule;
};
