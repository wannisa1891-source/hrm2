'use client';

import { useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

const icons = {
  dashboard: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
  personnel: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  leave: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,

  audit: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>,
  profile: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  schedule: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" /></svg>,
  logo: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
};

interface MenuItem {
  id: string;
  label: string;
  icon: JSX.Element;
  href?: string;
  children?: { id: string; label: string; href: string; icon?: JSX.Element }[];
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: icons.dashboard,
    href: '/dashboard',
  },
  {
    id: 'personnel',
    label: 'จัดการบุคลากร',
    icon: icons.personnel,
    children: [
      { id: 'employees', label: 'รายชื่อพนักงาน', href: '/employees' },
      { id: 'org-structure', label: 'จัดข้อมูลแผนก', href: '/org-structure' },
      { id: 'transfer', label: 'การโยกย้าย', href: '/transfer' },
      { id: 'license', label: 'ใบประกอบวิชาชีพ', href: '/license' },
    ],
  },
  {
    id: 'leave',
    label: 'การลา',
    icon: icons.leave,
    children: [
      { id: 'schedule', label: 'ตารางเวร', href: '/schedule', icon: icons.schedule },
      { id: 'leave-sys', label: 'ระบบการลา', href: '/leave', icon: icons.leave },
    ],
  },

  {
    id: 'audit',
    label: 'ประวัติบันทึก',
    icon: icons.audit,
    href: '/audit-logs',
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const { logout, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isAdmin = ['Admin', 'admin', 'HR', 'หัวหน้า'].includes(user?.role || '');

  const filteredMenuItems = useMemo(() => {
    return menuItems.reduce<any[]>((acc, item) => {
      if (!isAdmin) {

        if (item.id === 'personnel' || item.id === 'audit') return acc;

        if (item.children) {
          item.children.forEach(child => {
            acc.push({
              id: child.id,
              label: child.label,
              icon: child.icon || item.icon,
              href: child.href
            });
          });
          return acc;
        }
      }
      acc.push(item);
      return acc;
    }, []);
  }, [isAdmin, user]);

  const toggleMenu = (id: string) => {
    if (collapsed) {
      onToggle();
    }
    setOpenMenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const navigate = (href: string) => {
    router.push(href);
  };

  const isActive = (href: string) => pathname === href;

  return (
    <aside className={`sidebar-hybrid${collapsed ? ' collapsed' : ''}`}>
      <button className="toggle-floating-btn" onClick={onToggle} suppressHydrationWarning>
        {collapsed ? '❯' : '❮'}
      </button>

      <div className="sidebar-scroll-wrapper">
        <div className="sidebar-header">
          <div className="logo-box">
            <div className="logo-icon">{icons.logo}</div>
            {!collapsed && (
              <div className="logo-text">
                <h2>HRM</h2>
                <small>HOSPITAL SYSTEM</small>
              </div>
            )}
          </div>
        </div>

        <nav className="sidebar-nav">
          {filteredMenuItems.map(item => {
            if (!item.children) {
              return (
                <Link
                  key={item.id}
                  href={item.href!}
                  className={`menu-item-single${isActive(item.href!) ? ' active' : ''}`}
                  title={collapsed ? item.label : ''}
                  suppressHydrationWarning
                >
                  <span className="nav-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</span>
                  {!collapsed && <span className="nav-label">{item.label}</span>}
                </Link>
              );
            }

            return (
              <div key={item.id} className="menu-group">
                <button
                  className={`menu-header-btn${openMenus[item.id] && !collapsed ? ' is-open' : ''}`}
                  onClick={() => toggleMenu(item.id)}
                  title={collapsed ? item.label : ''}
                  suppressHydrationWarning
                >
                  <span className="nav-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="nav-label">{item.label}</span>
                      <span className="chevron">▾</span>
                    </>
                  )}
                </button>
                {openMenus[item.id] && !collapsed && (
                  <div className="sub-menu-list">
                    {item.children.map((child: any) => (
                      <Link
                        key={child.id}
                        href={child.href}
                        className={`sub-item${isActive(child.href) ? ' active' : ''}`}
                        suppressHydrationWarning
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-footer">
        {!collapsed && (
          <>
            <div
              className="user-block"
              onClick={() => navigate('/profile')}
              style={{ flexDirection: 'row', textAlign: 'left', padding: '0 8px', cursor: 'pointer', gap: '12px' }}
            >
              {user?.image ? (
                <div className="s-avatar" style={{ width: 40, height: 40, overflow: 'hidden', padding: 0, border: '1px solid #e2e8f0' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/uploads/${user.image}`} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div className="s-avatar" style={{ width: 40, height: 40, fontSize: 16 }}>{((user as any)?.name || user?.username || 'U').charAt(0).toUpperCase()}</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="s-username" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(user as any)?.name || user?.username || 'User'}</div>
                <div className="s-role">{user?.role || 'User'}</div>
              </div>
            </div>
            <button className="btn-logout" onClick={logout} suppressHydrationWarning>
              ออกจากระบบ
            </button>
          </>
        )}
      </div>
    </aside>
  );
}