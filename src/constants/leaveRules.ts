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
  'ข้าราชการ',
  'ลูกจ้างประจำ',
  'พนักงานราชการ',
  'ราชการ',
  'ลูกจ้างพนักงานกระทรวงสาธารณสุข',
  'ลูกจ้างชั่วคราว(นักเรียนทุน)',
  'ลูกจ้างรายเดือน',
  'ลูกจ้างรายวัน',
  'ลูกจ้างเหมาบริการ',
  'ลูกจ้างเเบ่งเปอร์เซ็นต์',
  'ลูกจ้างชั่วคราวที่อายุ 60 ปี',
] as const;

export type EmployeeType = (typeof EMPLOYEE_TYPES)[number];

export const LEAVE_RULES: Record<EmployeeType, LeaveQuota> = {
  'ข้าราชการ': {
    personal: 45,
    sick: 60,
    vacation: 10,
    canAccumulateVacation: true,
    accumulatePerYear: 10,
    note: 'กิจ 45 / ป่วย 60 / พักผ่อนสะสมปีละ 10',
  },
  'ราชการ': {
    personal: 45,
    sick: 60,
    vacation: 10,
    canAccumulateVacation: true,
    accumulatePerYear: 10,
    note: 'กิจ 45 / ป่วย 60 / พักผ่อนสะสมปีละ 10',
  },
  'ลูกจ้างประจำ': {
    personal: 45,
    sick: 60,
    vacation: 10,
    canAccumulateVacation: true,
    accumulatePerYear: 10,
    note: 'กิจ 45 / ป่วย 60 / พักผ่อนสะสมปีละ 10',
  },
  'พนักงานราชการ': {
    personal: 10,
    sick: 30,
    vacation: 15,
    canAccumulateVacation: true,
    accumulatePerYear: 15,
    note: 'กิจ 10 / ป่วย 30 / พักผ่อนสะสมปีละ 15',
  },
  'ลูกจ้างพนักงานกระทรวงสาธารณสุข': {
    personal: 15,
    sick: 45,
    vacation: 15,
    canAccumulateVacation: true,
    accumulatePerYear: 15,
    maxAccumulated: 15,
    note: 'กิจ 15 / ป่วย 45 / พักผ่อนสะสมไม่เกิน 15',
  },
  'ลูกจ้างชั่วคราว(นักเรียนทุน)': {
    personal: 0,
    sick: 15,
    vacation: 10,
    canAccumulateVacation: false,
    note: 'ไม่มีกิจ / ป่วย 15 / พักผ่อน 10 ไม่สะสม',
  },
  'ลูกจ้างรายเดือน': {
    personal: 0,
    sick: 15,
    vacation: 10,
    canAccumulateVacation: false,
    note: 'ไม่มีกิจ / ป่วย 15 / พักผ่อน 10 ไม่สะสม',
  },
  'ลูกจ้างรายวัน': {
    personal: 0,
    sick: 8, // ปีแรก 8, ครบปี 15
    vacation: 10,
    canAccumulateVacation: false,
    note: 'ไม่มีกิจ / ป่วยปีแรก 8 ครบปี 15 / พักผ่อน 10 ไม่สะสม',
  },
  'ลูกจ้างเหมาบริการ': {
    personal: 0,
    sick: 15,
    vacation: 10,
    canAccumulateVacation: false,
    note: 'ไม่มีกิจ / ป่วย 15 / พักผ่อน 10 ไม่สะสม',
  },
  'ลูกจ้างเเบ่งเปอร์เซ็นต์': {
    personal: 0,
    sick: 15,
    vacation: 10,
    canAccumulateVacation: false,
    note: 'ไม่มีกิจ / ป่วย 15 / พักผ่อน 10 ไม่สะสม',
  },
  'ลูกจ้างชั่วคราวที่อายุ 60 ปี': {
    personal: 0,
    sick: 15,
    vacation: 10,
    canAccumulateVacation: false,
    note: 'ไม่มีกิจ / ป่วย 15 / พักผ่อน 10 ไม่สะสม',
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
