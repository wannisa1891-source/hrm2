'use client'

import React, { useState, useRef, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: Option[];
  placeholder?: string;
  prefix?: string;
  minWidth?: string;
  disabled?: boolean;
  showSearch?: boolean;
}

export default function CustomSelect({ value, onChange, options, placeholder = 'เลือก', prefix, minWidth = '140px', disabled = false, showSearch = false }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => { if (!isOpen) setSearch(''); }, [isOpen]);

  const selectedOption = options.find(o => String(o.value) === String(value));
  const filteredOptions = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={containerRef} style={{ position: 'relative', width: 'auto', minWidth, opacity: disabled ? 0.6 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '12px 20px',
          border: `1.5px solid ${isOpen ? '#2563eb' : '#cbd5e1'}`,
          borderRadius: '50px',
          background: disabled ? '#f8fafc' : 'white',
          fontSize: '14px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          boxShadow: isOpen ? '0 0 0 4px rgba(37,99,235,0.1)' : 'inset 0 2px 4px rgba(0,0,0,0.02)',
          transition: 'all 0.2s',
          color: selectedOption ? '#1e293b' : '#64748b',
          fontWeight: 500
        }}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selectedOption 
            ? (prefix 
                ? (String(selectedOption.value) === 'all' ? prefix : `${prefix}: ${selectedOption.label}`) 
                : selectedOption.label) 
            : placeholder}
        </span>
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)', flexShrink: 0 }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            background: 'white',
            borderRadius: '24px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            zIndex: 50,
            maxHeight: '300px',
            overflowY: 'auto',
            border: '1px solid #f1f5f9',
            padding: '8px',
            animation: 'spSelectIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          className="custom-scrollbar"
        >
          <style>{`
            @keyframes spSelectIn {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          {showSearch && (
            <div style={{ padding: '8px', position: 'sticky', top: 0, background: 'white', zIndex: 1, borderBottom: '1px solid #f1f5f9', marginBottom: '4px' }}>
              <input
                type="text"
                placeholder="ค้นหา..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '13px' }}
                autoFocus
              />
            </div>
          )}
          {filteredOptions.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>ไม่พบข้อมูล</div>
          ) : filteredOptions.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              style={{
                padding: '10px 16px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '14px',
                background: String(opt.value) === String(value) ? '#eff6ff' : 'transparent',
                color: String(opt.value) === String(value) ? '#1d4ed8' : '#334155',
                fontWeight: String(opt.value) === String(value) ? 700 : 500,
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => { if (String(opt.value) !== String(value)) e.currentTarget.style.background = '#f8fafc'; }}
              onMouseLeave={(e) => { if (String(opt.value) !== String(value)) e.currentTarget.style.background = 'transparent'; }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
