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
}

export default function CustomSelect({ value, onChange, options, placeholder = 'เลือก', prefix, minWidth = '140px', disabled = false }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  const selectedOption = options.find(o => String(o.value) === String(value));

  return (
    <div ref={containerRef} style={{ position: 'relative', width: 'auto', minWidth, opacity: disabled ? 0.6 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '10px 14px',
          border: `1px solid ${isOpen ? '#2563eb' : '#e5e7eb'}`,
          borderRadius: '10px',
          background: disabled ? '#f8fafc' : 'white',
          fontSize: '14px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          boxShadow: isOpen ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
          transition: 'all 0.2s',
          color: selectedOption ? '#1e293b' : '#64748b'
        }}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selectedOption 
            ? (prefix 
                ? (String(selectedOption.value) === 'all' ? prefix : `${prefix}: ${selectedOption.label}`) 
                : selectedOption.label) 
            : placeholder}
        </span>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
            zIndex: 50,
            maxHeight: '300px',
            overflowY: 'auto',
            border: '1px solid #f1f5f9',
            padding: '6px'
          }}
          className="custom-scrollbar"
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                background: String(opt.value) === String(value) ? '#f0f9ff' : 'transparent',
                color: String(opt.value) === String(value) ? '#0ea5e9' : '#334155',
                fontWeight: String(opt.value) === String(value) ? 600 : 400,
                transition: 'background 0.15s'
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
