'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';

export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

interface ThaiDateInputProps {
  label: string;
  value: string | undefined;
  onChange: (val: string) => void;
  required?: boolean;
  style?: React.CSSProperties;
}

const ThaiDateInput = ({ label, value, onChange, required, style }: ThaiDateInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Parse initial date
  const initialDate = useMemo(() => {
    if (!value) return new Date();
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [value]);

  const [viewDate, setViewDate] = useState(initialDate);
  const selectedDate = value ? new Date(value) : null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDateThai = (date: Date | null) => {
    if (!date || isNaN(date.getTime())) return '';
    const d = date.getDate();
    const m = THAI_MONTHS_SHORT[date.getMonth()];
    const y = date.getFullYear() + 543;
    return `${d} ${m} ${y}`;
  };

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handleDateClick = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const offset = newDate.getTimezoneOffset();
    const localDate = new Date(newDate.getTime() - (offset * 60 * 1000));
    onChange(localDate.toISOString().split('T')[0]);
    setIsOpen(false);
  };

  const changeMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  const changeYear = (yearBE: number) => {
    setViewDate(new Date(yearBE - 543, viewDate.getMonth(), 1));
  };

  const years = useMemo(() => {
    const currentYearBE = new Date().getFullYear() + 543;
    return Array.from({ length: 120 }, (_, i) => (currentYearBE + 10) - i);
  }, []);

  const days = useMemo(() => {
    const totalDays = daysInMonth(viewDate.getFullYear(), viewDate.getMonth());
    const firstDay = firstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());
    const arr = [];
    for (let i = 0; i < firstDay; i++) arr.push(null);
    for (let i = 1; i <= totalDays; i++) arr.push(i);
    return arr;
  }, [viewDate]);

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative', width: '100%' }}>
      <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</label>
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          ...style,
          padding: '8px 14px',
          borderRadius: '12px',
          border: `1.5px solid ${isOpen ? '#3b82f6' : '#e2e8f0'}`,
          background: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.2s',
          boxShadow: isOpen ? '0 0 0 4px rgba(59, 130, 246, 0.1)' : 'none',
          height: '40px',
          fontSize: '14px',
          color: selectedDate ? '#1e293b' : '#94a3b8',
          fontWeight: selectedDate ? 600 : 400
        }}
      >
        <span>{selectedDate ? formatDateThai(selectedDate) : 'เลือกวันที่...'}</span>
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ opacity: 0.5 }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(16px)',
          borderRadius: '20px',
          padding: '16px',
          boxShadow: '0 15px 35px -10px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)',
          width: '280px',
          animation: 'scaleIn 0.2s ease-out'
        }}>
          <style>{`
            @keyframes scaleIn { from { opacity: 0; transform: scale(0.95) translateY(-8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
            .dp-day { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; border-radius: 10px; font-size: 13px; font-weight: 500; transition: all 0.2s; }
            .dp-day:hover:not(.empty) { background: #eff6ff; color: #2563eb; transform: scale(1.05); }
            .dp-day.selected { background: #2563eb; color: white; font-weight: 700; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25); }
            .dp-day.today { color: #2563eb; font-weight: 800; border: 1px solid #dbeafe; }
          `}</style>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <button onClick={() => changeMonth(-1)} style={{ border: 'none', background: '#f8fafc', borderRadius: '8px', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#64748b"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div style={{ display: 'flex', gap: '4px', fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
              <select 
                value={viewDate.getMonth()} 
                onChange={(e) => setViewDate(new Date(viewDate.getFullYear(), parseInt(e.target.value), 1))}
                style={{ border: 'none', background: 'transparent', fontWeight: 800, fontSize: '14px', cursor: 'pointer', outline: 'none' }}
              >
                {THAI_MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <select 
                value={viewDate.getFullYear() + 543} 
                onChange={(e) => changeYear(parseInt(e.target.value))}
                style={{ border: 'none', background: 'transparent', fontWeight: 800, fontSize: '14px', cursor: 'pointer', outline: 'none' }}
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button onClick={() => changeMonth(1)} style={{ border: 'none', background: '#f8fafc', borderRadius: '8px', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#64748b"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '6px' }}>
            {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((d, i) => (
              <div key={i} style={{ textAlign: 'center', fontSize: '10px', fontWeight: 700, color: '#94a3b8', padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {days.map((day, i) => {
              const isSelected = selectedDate && day && 
                selectedDate.getDate() === day && 
                selectedDate.getMonth() === viewDate.getMonth() && 
                selectedDate.getFullYear() === viewDate.getFullYear();
              
              const isToday = day && 
                new Date().getDate() === day && 
                new Date().getMonth() === viewDate.getMonth() && 
                new Date().getFullYear() === viewDate.getFullYear();

              return (
                <div 
                  key={i} 
                  className={`dp-day ${!day ? 'empty' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                  onClick={() => day && handleDateClick(day)}
                >
                  {day}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
            <button 
              onClick={() => {
                const now = new Date();
                onChange(now.toISOString().split('T')[0]);
                setIsOpen(false);
              }}
              style={{ border: 'none', background: 'transparent', color: '#2563eb', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
            >
              วันนี้
            </button>
            <button 
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              style={{ border: 'none', background: 'transparent', color: '#64748b', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
            >
              ล้างค่า
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThaiDateInput;
