export interface LeaveQuota {
  personal: number;         // วันลากิจ
  sick: number;             // วันลาป่วย
  vacation: number;         // วันลาพักผ่อน (ฐาน/ปี)
  canAccumulateVacation: boolean;
  accumulatePerYear?: number;  // สะสมเพิ่มปีละกี่วัน
  maxAccumulated?: number;     // สะสมสูงสุด (undefined = ไม่จำกัด)
  note?: string;
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
    accumulatePerYear: 10,
    note: 'สะสมพักผ่อนได้ทุกปี ปีละ 10 วัน ไม่จำกัด',
  },
  'พนักงานราชการ': {
    personal: 10,
    sick: 30,
    vacation: 15,
    canAccumulateVacation: true,
    accumulatePerYear: 15,
    note: 'สะสมพักผ่อนได้ทุกปี ปีละ 15 วัน ไม่จำกัด',
  },
  'ลูกจ้างพนักงานกระทรวง': {
    personal: 15,
    sick: 45,
    vacation: 15,
    canAccumulateVacation: true,
    accumulatePerYear: 15,
    maxAccumulated: 15,
    note: 'สะสมพักผ่อนได้ไม่เกิน 15 วัน',
  },
  'ลูกจ้างชั่วคราว(นักเรียนทุน)': {
    personal: 0,
    sick: 15,
    vacation: 10,
    canAccumulateVacation: false,
    note: 'ไม่มีสิทธิ์ลากิจ / ไม่สะสมพักผ่อน',
  },
  'ลูกจ้างรายเดือน': {
    personal: 0,
    sick: 15,
    vacation: 10,
    canAccumulateVacation: false,
    note: 'ไม่มีสิทธิ์ลากิจ / ไม่สะสมพักผ่อน',
  },
  'ลูกจ้างรายวัน': {
    personal: 0,
    sick: 8, // ปีแรก 8 วัน, ครบปี 15 วัน (คำนวณใน getSickQuotaForDaily)
    vacation: 10,
    canAccumulateVacation: false,
    note: 'ไม่มีสิทธิ์ลากิจ / ป่วยปีแรก 8 วัน ครบปีแรก 15 วัน / ไม่สะสมพักผ่อน',
  },
  'ลูกจ้างเหมา': {
    personal: 0,
    sick: 0,
    vacation: 0,
    canAccumulateVacation: false,
    note: 'ไม่มีสิทธิ์ลาใดๆ',
  },
  'ลูกจ้างชั่วคราวที่อายุ 60 ปี': {
    personal: 0,
    sick: 15,
    vacation: 10,
    canAccumulateVacation: false,
    note: 'ไม่มีสิทธิ์ลากิจ / ไม่สะสมพักผ่อน',
  },
};

/**
 * คำนวณสิทธิ์ลาป่วยสำหรับลูกจ้างรายวัน ตามอายุงาน
 * ปีแรก = 8 วัน, ครบ 1 ปีขึ้นไป = 15 วัน
 */
export const getSickQuotaForDaily = (startDate: string | Date): number => {
  const start = new Date(startDate);
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  const m = now.getMonth() - start.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < start.getDate())) years--;
  return years >= 1 ? 15 : 8;
};

export const ACCUMULATION_LIMITS: Partial<Record<EmployeeType, number>> = {
  'ราชการ': Infinity,
  'พนักงานราชการ': Infinity,
  'ลูกจ้างพนักงานกระทรวง': 15,
};

/**
 * คืน LeaveQuota ตามประเภทพนักงาน
 * รองรับ logic พิเศษของลูกจ้างรายวัน (sick quota ขึ้นกับอายุงาน)
 */
export const getQuotaByType = (type: string, startDate?: string | Date): LeaveQuota => {
  const rule = LEAVE_RULES[type as EmployeeType];
  if (!rule) return { personal: 0, sick: 0, vacation: 0, canAccumulateVacation: false };
  if (type === 'ลูกจ้างรายวัน' && startDate) {
    return { ...rule, sick: getSickQuotaForDaily(startDate) };
  }
  return rule;
};
