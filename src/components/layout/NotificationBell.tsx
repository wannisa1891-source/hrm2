'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoggedIn && (user?.emp_id || user?.username)) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 3000); // 3 seconds for better UX/Real-time
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    const targetId = user?.emp_id || user?.username;
    if (!targetId) return;
    try {
      const isAdmin = user?.role?.toLowerCase() === 'admin';
      const res = await fetch(`/api/notifications?emp_id=${targetId}${isAdmin ? '&is_admin=true' : ''}`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        const filtered = data.filter((n: any) => 
          !n.title?.includes('ลา') && 
          !n.message?.includes('ลา')
        );
        setNotifications(filtered);
      }
    } catch (e) {
      console.error('Notification Loading Error:', e);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_read: true }),
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch(e) {}
  };

  const handleNotificationClick = (n: any) => {
    markAsRead(n.id);
    const meta = n.metadata ? (typeof n.metadata === 'string' ? JSON.parse(n.metadata) : n.metadata) : null;
    
    // Logic for redirection based on keyword or metadata
    // Leave routing removed
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button 
        suppressHydrationWarning
        onClick={() => setOpen(!open)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: '8px' }}>
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" color="#64748b">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
        </svg>
        {unreadCount > 0 && (
          <span style={{ 
            position: 'absolute', 
            top: '2px', 
            right: '4px', 
            background: '#ef4444', 
            color: '#fff', 
            fontSize: '10px', 
            fontWeight: '900', 
            padding: '2px 5px', 
            borderRadius: '10px',
            boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)',
            border: '1.5px solid white'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', top: '100%', right: '0', background: '#fff', width: '320px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', zIndex: 1000, overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
            <span style={{ fontWeight: 'bold', color: '#0f172a' }}>การแจ้งเตือน</span>
            <span style={{ fontSize: '13px', color: '#3b82f6', cursor: 'pointer' }} onClick={() => notifications.forEach(n => !n.is_read && markAsRead(n.id))}>อ่านทั้งหมด</span>
          </div>
          <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>ไม่มีการแจ้งเตือน</div>
            ) : notifications.map(n => (
              <div key={n.id} onClick={() => handleNotificationClick(n)} style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: n.is_read ? '#fff' : '#eff6ff', transition: 'background 0.2s' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>{n.title}</div>
                <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.4' }}>{n.message}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>{new Date(n.created_at).toLocaleString('th-TH')}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
