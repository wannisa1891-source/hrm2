import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ระบบการโยกย้ายพนักงาน | HRM โรงพยาบาล',
  description: 'บันทึกและติดตามคำสั่งแต่งตั้ง โยกย้าย และเลื่อนตำแหน่งพนักงาน',
};

export default function TransfersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
