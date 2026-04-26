'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import BackButton from '@/components/common/BackButton';
import NotificationBell from '@/components/layout/NotificationBell';

export default function AppLayout({ children, hideScrollbar = false }: { children: React.ReactNode, hideScrollbar?: boolean }) {
  const [collapsed, setCollapsed] = useState(true);
  const { isLoggedIn, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = ['Super Admin', 'Admin', 'admin', 'HR', 'หัวหน้า'].includes(user?.role || '');
  const isDashboard = pathname === '/dashboard' || pathname === '/';
  const showBack = !isDashboard && (pathname !== '/profile' || isAdmin);

  useEffect(() => {
    const handleExpand = () => setCollapsed(false);
    window.addEventListener('expand-sidebar', handleExpand);
    return () => window.removeEventListener('expand-sidebar', handleExpand);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      const stored = localStorage.getItem('hrm_user');
      if (!stored) {
        router.replace('/login');
      }
    }
  }, [isLoggedIn, router]);

  return (
    <div className="main-layout">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <main className={`main-content${collapsed ? ' expanded' : ''}${hideScrollbar ? ' no-scrollbar' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 8px', width: '100%' }}>
          <div>{showBack && <BackButton />}</div>
          <div><NotificationBell /></div>
        </div>

        {children}
      </main>
    </div>
  );
}
