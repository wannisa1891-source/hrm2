'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import BackButton from '@/components/common/BackButton';
import NotificationBell from './NotificationBell';

export default function AppLayout({ children, hideScrollbar = false }: { children: React.ReactNode, hideScrollbar?: boolean }) {
  const [collapsed, setCollapsed] = useState(false);
  const { isLoggedIn } = useAuth();
  const router = useRouter();

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', width: '100%' }}>
          <div><BackButton /></div>
          <div><NotificationBell /></div>
        </div>
        {children}
      </main>
    </div>
  );
}
