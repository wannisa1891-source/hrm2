import { NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export async function GET() {
  try {
    const p = pool as any;
    
    const [emp] = await p.query('SHOW COLUMNS FROM tbl_employees');
    const [l] = await p.query('SHOW COLUMNS FROM tbl_leaves');
    const [t] = await p.query('SHOW COLUMNS FROM tbl_transfers');
    const [s] = await p.query('SHOW COLUMNS FROM tbl_schedules');
    const [a] = await p.query('SHOW COLUMNS FROM tbl_announcements');

    return NextResponse.json({
      schemas: {
        tbl_employees: emp,
        tbl_leaves: l,
        tbl_transfers: t,
        tbl_schedules: s,
        tbl_announcements: a,
      }
    });

  } catch(e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack });
  }
}
