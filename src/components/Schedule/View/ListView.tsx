'use client'

import React from 'react'
import type { Schedule, RoomType } from '../useScheduleModal'

interface ListViewProps {
  currentDate: Date
  schedules: Schedule[]
  roomTypes: RoomType[]
  onOpenDay: (date: Date) => void
  onOpenEditModal: (schedule: Schedule) => void
}

export default function ListView({
  currentDate,
  schedules,
  roomTypes,
  onOpenDay,
  onOpenEditModal,
}: ListViewProps) {
  
  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const getDaySchedules = (roomName: string) => {
    return schedules.filter(s => s.room === roomName && isSameDay(new Date(s.date), currentDate))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .lv-container { display: flex; flex-direction: column; gap: 24px; }
        .lv-room-card { 
          display: grid; 
          grid-template-columns: 280px 1fr; 
          background: #fff; 
          border-radius: 16px; 
          overflow: hidden; 
          border: 1px solid #e2e8f0; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .lv-room-card:hover { transform: translateY(-2px); box-shadow: 0 12px 24px rgba(0,0,0,0.06); }
        
        .lv-room-info { 
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); 
          padding: 24px; 
          display: flex; 
          flex-direction: column; 
          border-right: 1px solid #e2e8f0;
          align-items: center;
          text-align: center;
        }
        .lv-room-icon-box {
          width: 120px;
          height: 120px;
          background: #fff;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          border: 1px solid #f1f5f9;
        }
        .lv-room-name { font-size: 18px; font-weight: 800; color: #1e293b; margin: 0 0 8px; line-height: 1.3; }
        .lv-room-loc { font-size: 13px; color: #64748b; font-weight: 600; display: flex; align-items: center; gap: 4px; }
        .lv-room-cap { margin-top: 12px; font-size: 12px; font-weight: 700; color: #2563eb; background: #eff6ff; padding: 4px 12px; border-radius: 20px; border: 1px solid #bfdbfe; }

        .lv-bookings { padding: 0; display: flex; flex-direction: column; min-height: 180px; }
        .lv-empty { flex: 1; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 14px; font-weight: 600; background: #fafafa; cursor: pointer; }
        .lv-empty:hover { background: #f8fafc; color: #2563eb; }
        
        .lv-booking-item { 
          padding: 20px 24px; 
          border-bottom: 1px solid #f1f5f9; 
          cursor: pointer; 
          transition: background 0.2s;
          position: relative;
        }
        .lv-booking-item:last-child { border-bottom: none; }
        .lv-booking-item:hover { background: #f8fafc; }
        
        .lv-b-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
        .lv-b-subject { font-size: 16px; font-weight: 800; color: #1e293b; margin: 0; flex: 1; padding-right: 20px; }
        .lv-b-time { font-size: 14px; font-weight: 700; color: #2563eb; background: #eff6ff; padding: 4px 10px; border-radius: 8px; white-space: nowrap; }
        
        .lv-b-meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
        .lv-meta-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748b; font-weight: 600; }
        .lv-meta-icon { color: #94a3b8; }
        
        .lv-note-box { margin-top: 10px; padding: 8px 12px; background: #f1f5f9; border-radius: 8px; font-size: 12px; color: #475569; border-left: 3px solid #cbd5e1; }
      `}} />

      <div className="lv-container">
        {roomTypes.map((room) => {
          const dayBookings = getDaySchedules(room.label);
          
          return (
            <div key={room.value} className="lv-room-card">
              <div className="lv-room-info">
                <div className="lv-room-icon-box" style={{ borderColor: room.color + '40' }}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={room.color || '#3b82f6'} strokeWidth="1.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="lv-room-name">{room.label}</h3>
                {room.location && (
                  <div className="lv-room-loc">
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    {room.location}
                  </div>
                )}
                {room.capacity && <div className="lv-room-cap">ความจุ {room.capacity} ที่นั่ง</div>}
                
                <div style={{ marginTop: 'auto', paddingTop: '20px', width: '100%' }}>
                   <button className="sp-btn-save" style={{ width: '100%', fontSize: '12px', padding: '8px', background: '#fff', color: room.color, border: `1px solid ${room.color}40` }} onClick={() => onOpenDay(currentDate)}>
                     + จองห้องนี้
                   </button>
                </div>
              </div>

              <div className="lv-bookings">
                {dayBookings.length > 0 ? (
                  dayBookings.map((sch) => (
                    <div key={sch.id} className="lv-booking-item" onClick={() => onOpenEditModal(sch)}>
                      <div className="lv-b-header">
                        <h4 className="lv-b-subject">{sch.subject}</h4>
                        <div className="lv-b-time" style={{ background: (room.color || '#2563eb') + '10', color: room.color || '#2563eb', border: `1px solid ${room.color}20` }}>
                          {sch.startTime} - {sch.endTime}
                        </div>
                      </div>
                      
                      <div className="lv-b-meta">
                        <div className="lv-meta-item">
                          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                          <span>แผนก: <span style={{ color: '#1e293b' }}>{sch.organizer}</span></span>
                        </div>
                        {sch.unit && (
                          <div className="lv-meta-item">
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
                            <span>หน่วยงาน: <span style={{ color: '#1e293b' }}>{sch.unit}</span></span>
                          </div>
                        )}
                        <div className="lv-meta-item">
                          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                          <span>ผู้จอง: <span style={{ color: '#1e293b' }}>{sch.bookerName || '-'}</span></span>
                        </div>
                        {sch.contactPhone && (
                          <div className="lv-meta-item">
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                            <span>โทร: <span style={{ color: '#2563eb' }}>{sch.contactPhone}</span></span>
                          </div>
                        )}
                      </div>

                      {sch.note && (
                        <div className="lv-note-box">
                          <strong style={{ display: 'block', marginBottom: '2px' }}>หมายเหตุ / อุปกรณ์:</strong>
                          {sch.note}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="lv-empty" onClick={() => onOpenDay(currentDate)}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ opacity: 0.3 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      <span>ยังไม่มีการจองในวันนี้ - คลิกเพื่อเพิ่มการนัดหมาย</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
