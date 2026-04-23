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

const getRoomImage = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('ห้องประชุม 1') || n.includes('room 1')) return '/images/meeting_room_a.png';
  if (n.includes('ห้องประชุม 2') || n.includes('room 2')) return '/images/meeting_room_b.png';
  return '/images/meeting_room_c.png';
};

export default function ListView({
  currentDate,
  schedules,
  roomTypes,
  onOpenDay,
  onOpenEditModal,
}: ListViewProps) {

  const getDaySchedules = (room: string) => {
    return schedules.filter(s => s.room === room);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .lv-container { display: flex; flex-direction: column; gap: 24px; }
        .lv-room-card { 
          background: #fff; 
          border-radius: 24px; 
          border: 1px solid #f1f5f9; 
          overflow: hidden; 
          display: flex; 
          flex-direction: column;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s;
        }
        .lv-room-card:hover { transform: translateY(-4px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.08); }
        .lv-room-info { 
          padding: 24px; 
          display: flex; 
          align-items: center; 
          gap: 20px; 
          border-bottom: 1px solid #f8fafc;
          background: linear-gradient(to right, #ffffff, #fafafa);
          position: relative;
        }
        .lv-room-bg {
          position: absolute; right: 0; top: 0; bottom: 0; width: 40%;
          opacity: 0.08; pointer-events: none;
          background-size: cover; background-position: center;
          mask-image: linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%);
          -webkit-mask-image: linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%);
        }
        .lv-room-icon-box { 
          width: 64px; height: 64px; border-radius: 20px; 
          display: flex; align-items: center; justify-content: center;
          background: #fff; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
          border: 1px solid #f1f5f9; flex-shrink: 0; z-index: 1;
        }
        .lv-room-name { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }
        .lv-room-loc { font-size: 13px; color: #64748b; margin-top: 4px; display: flex; alignItems: center; gap: 6px; }
        .lv-room-cap { font-size: 12px; color: #0f172a; font-weight: 700; background: #f1f5f9; padding: 4px 10px; border-radius: 8px; margin-top: 8px; display: inline-block; }
        .lv-bookings { padding: 20px 24px 24px; display: flex; flex-direction: column; gap: 12px; }
        .lv-booking-item { 
          background: #fcfcfc; border: 1px solid #f1f5f9; border-radius: 16px; 
          padding: 16px; display: flex; flex-direction: column; gap: 8px;
          cursor: pointer; transition: 0.2s;
        }
        .lv-booking-item:hover { border-color: #cbd5e1; background: #fff; transform: scale(1.005); box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .lv-b-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
        .lv-b-subject { margin: 0; font-size: 15px; font-weight: 700; color: #1e293b; flex: 1; }
        .lv-b-time { font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 10px; white-space: nowrap; }
        .lv-b-meta { display: flex; flex-wrap: wrap; gap: 16px; }
        .lv-meta-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #64748b; }
        .lv-meta-label { font-weight: 700; color: #94a3b8; }
        .lv-empty { padding: 40px; text-align: center; color: #94a3b8; font-style: italic; font-size: 14px; background: #fafafa; border-radius: 16px; margin: 0 24px 24px; border: 1px dashed #e2e8f0; }
        .lv-note-box { margin-top: 10px; padding: 8px 12px; background: #f1f5f9; border-radius: 8px; font-size: 12px; color: #475569; border-left: 3px solid #cbd5e1; }
      `}} />

      <div className="lv-container">
        {roomTypes.map((room) => {
          const dayBookings = getDaySchedules(room.label);
          const roomImage = getRoomImage(room.label);
          
          return (
            <div key={room.value} className="lv-room-card">
              <div className="lv-room-info">
                <div className="lv-room-bg" style={{ backgroundImage: `url(${roomImage})` }} />
                <div className="lv-room-icon-box" style={{ borderColor: (room.color || '#2563eb') + '40' }}>
                  <svg width="32" height="32" style={{ color: room.color || '#2563eb' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div style={{ flex: 1, zIndex: 1 }}>
                  <h3 className="lv-room-name">{room.label}</h3>
                  <div className="lv-room-loc">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {room.location || 'อาคารอำนวยการ ชั้น 1'}
                  </div>
                  <div className="lv-room-cap">ความจุ: {room.capacity || '20-30'} ที่นั่ง</div>
                </div>
                <button className="sp-btn-save" style={{ background: '#fff', color: room.color || '#2563eb', border: `1px solid ${(room.color || '#2563eb')}40`, padding: '10px 20px', borderRadius: '14px', fontWeight: 700, cursor: 'pointer', zIndex: 1 }} onClick={() => onOpenDay(currentDate)}>
                   + จองห้องนี้
                </button>
              </div>

              <div className="lv-bookings">
                {dayBookings.length > 0 ? dayBookings.map((sch) => (
                  <div key={sch.id} className="lv-booking-item" onClick={() => onOpenEditModal(sch)}>
                    <div className="lv-b-header">
                      <h4 className="lv-b-subject">{sch.subject}</h4>
                      <div className="lv-b-time" style={{ background: (room.color || '#2563eb') + '10', color: room.color || '#2563eb', border: `1px solid ${(room.color || '#2563eb')}20` }}>
                        {sch.startTime} - {sch.endTime}
                      </div>
                    </div>
                    <div className="lv-b-meta">
                      <div className="lv-meta-item">
                        <span className="lv-meta-label">หน่วยงาน:</span> {sch.organizer}
                      </div>
                      <div className="lv-meta-item">
                        <span className="lv-meta-label">แผนก:</span> {sch.unit || '-'}
                      </div>
                      <div className="lv-meta-item">
                        <span className="lv-meta-label">ผู้จอง:</span> {sch.bookerName || '-'}
                      </div>
                      <div className="lv-meta-item">
                        <span className="lv-meta-label">ติดต่อ:</span> {sch.contactPhone || '-'}
                      </div>
                    </div>
                    {sch.note && (
                      <div className="lv-note-box">
                        <strong>หมายเหตุ:</strong> {sch.note}
                      </div>
                    )}
                  </div>
                )) : (
                  <div className="lv-empty">ไม่มีรายการจองห้องประชุมในวันนี้</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
