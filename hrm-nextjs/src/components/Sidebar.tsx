'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '🏠',
    href: '/dashboard',
  },
  {
    id: 'personnel',
    label: 'จัดการบุคลากร',
    icon: '👥',
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
    icon: '📅',
    children: [
      { id: 'schedule', label: 'ตารางเวร', href: '/schedule' },
      { id: 'leave-sys', label: 'ระบบการลา', href: '/leave' },
    ],
  },
  {
    id: 'finance',
    label: 'การเงิน',
    icon: '💰',
    children: [
      { id: 'payroll', label: 'ระบบเงินเดือน', href: '/payroll' },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({ personnel: true });
  const { logout, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const toggleMenu = (id: string) => {
    if (collapsed) {
      onToggle(); // expand sidebar first
    }
    setOpenMenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const navigate = (href: string) => {
    router.push(href);
  };

  const isActive = (href: string) => pathname === href;

  return (
    <aside className={`sidebar-hybrid${collapsed ? ' collapsed' : ''}`}>
      <button className="toggle-floating-btn" onClick={onToggle}>
        {collapsed ? '❯' : '❮'}
      </button>

      <div className="sidebar-scroll-wrapper">
        {/* Header */}
        <div className="sidebar-header">
          <div className="logo-box">
            <div className="logo-icon">➕</div>
            {!collapsed && (
              <div className="logo-text">
                <h2>HRM</h2>
                <small>HOSPITAL SYSTEM</small>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {menuItems.map(item => {
            if (!item.children) {
              return (
                <button
                  key={item.id}
                  className={`menu-item-single${isActive(item.href!) ? ' active' : ''}`}
                  onClick={() => navigate(item.href!)}
                  title={collapsed ? item.label : ''}
                >
                  <span className="nav-icon" style={{ fontSize: '20px' }}>{item.icon}</span>
                  {!collapsed && <span className="nav-label">{item.label}</span>}
                </button>
              );
            }

            return (
              <div key={item.id} className="menu-group">
                <button
                  className={`menu-header-btn${openMenus[item.id] && !collapsed ? ' is-open' : ''}`}
                  onClick={() => toggleMenu(item.id)}
                  title={collapsed ? item.label : ''}
                >
                  <span className="nav-icon" style={{ fontSize: '20px' }}>{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="nav-label">{item.label}</span>
                      <span className="chevron">▾</span>
                    </>
                  )}
                </button>
                {openMenus[item.id] && !collapsed && (
                  <div className="sub-menu-list">
                    {item.children.map(child => (
                      <button
                        key={child.id}
                        className={`sub-item${isActive(child.href) ? ' active' : ''}`}
                        onClick={() => navigate(child.href)}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {!collapsed && (
            <>
              <div className="user-block">
                <div className="s-avatar">W</div>
                <div>
                  <div className="s-username">{user?.username || 'Admin'}</div>
                  <div className="s-role">Admin</div>
                </div>
              </div>
              <button className="btn-logout" onClick={logout}>
                ออกจากระบบ
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
