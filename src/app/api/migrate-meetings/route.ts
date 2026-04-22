import { NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export async function GET() {
  try {
    // 1. Create tbl_meeting_rooms
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tbl_meeting_rooms (
        room_id INT PRIMARY KEY AUTO_INCREMENT,
        room_name VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        capacity INT,
        color VARCHAR(10) DEFAULT '#3b82f6',
        is_active BOOLEAN DEFAULT TRUE
      )
    `);

    // 2. Create tbl_bookings
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tbl_bookings (
        booking_id INT PRIMARY KEY AUTO_INCREMENT,
        subject VARCHAR(255) NOT NULL,
        description TEXT,
        room_id INT,
        organizer_id VARCHAR(50),
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        status VARCHAR(50) DEFAULT 'Confirmed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Insert initial data if empty
    const [rooms]: any = await pool.query('SELECT COUNT(*) as count FROM tbl_meeting_rooms');
    if (rooms[0].count === 0) {
      await pool.query(`
        INSERT INTO tbl_meeting_rooms (room_name, location, capacity, color) VALUES 
        ('ห้องประชุมใหญ่ A', 'ชั้น 2', 50, '#3b82f6'),
        ('ห้องประชุม B', 'ชั้น 3', 20, '#10b981'),
        ('ห้องประชุม C', 'ชั้น 3', 15, '#f59e0b'),
        ('ประชุมออนไลน์', 'Zoom/Meet', 100, '#8b5cf6')
      `);
    }

    return NextResponse.json({ success: true, message: 'Database migrated successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
