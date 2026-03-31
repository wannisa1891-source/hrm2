import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ตารางเวร',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
