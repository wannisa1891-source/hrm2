import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/hrm_db';

// GET: Fetch all announcements
export async function GET() {
  try {
    const [rows] = await db.query('SELECT * FROM tbl_announcements ORDER BY created_at DESC');
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch announcements' }, { status: 500 });
  }
}

// POST: Create a new announcement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, image, icon, iconBg, iconColor } = body;

    if (!title || !content) {
      return NextResponse.json({ success: false, error: 'Title and content are required' }, { status: 400 });
    }

    const sql = `
      INSERT INTO tbl_announcements (title, content, image, icon, iconBg, iconColor)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [
      title, 
      content, 
      image || null, 
      icon || 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z', 
      iconBg || '#fef3c7', 
      iconColor || '#d97706'
    ];

    const [result] = await db.query(sql, values);
    
    return NextResponse.json({ success: true, message: 'Announcement created successfully', data: result });
  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json({ success: false, error: 'Failed to create announcement' }, { status: 500 });
  }
}
