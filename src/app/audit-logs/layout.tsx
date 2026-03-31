import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ประวัติการใช้งาน',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
