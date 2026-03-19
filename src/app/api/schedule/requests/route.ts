import { NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

// GET all shift requests (Swaps, Leaves)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const empId = searchParams.get('emp_id');
    const status = searchParams.get('status');
    
    let query = `SELECT * FROM tbl_shift_requests WHERE 1=1`;
    const params: any[] = [];

    if (empId) {
       query += ` AND (requester_id = ? OR swap_with_emp_id = ?)`;
       params.push(empId, empId);
    }
    
    if (status) {
       query += ` AND status = ?`;
       params.push(status);
    }

    query += ` ORDER BY created_at DESC`;

    const [rows] = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching shift requests:', error);
    return NextResponse.json({ error: 'Failed to fetch shift requests' }, { status: 500 });
  }
}

// POST create a new request
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { requester_id, request_type, request_date, target_shift_id, swap_with_emp_id, target_swap_shift_id, reason } = body;

    if (!requester_id || !request_type || !request_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [result] = await pool.query(
      `INSERT INTO tbl_shift_requests 
       (requester_id, request_type, request_date, target_shift_id, swap_with_emp_id, target_swap_shift_id, status, reason) 
       VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?)`,
      [requester_id, request_type, request_date, target_shift_id || null, swap_with_emp_id || null, target_swap_shift_id || null, reason || '']
    );

    return NextResponse.json({ message: 'Request created successfully', id: (result as any).insertId }, { status: 201 });
  } catch (error) {
    console.error('Error creating shift request:', error);
    return NextResponse.json({ error: 'Failed to create shift request' }, { status: 500 });
  }
}

// PUT approve/reject a request
export async function PUT(request: Request) {
  try {
      const body = await request.json();
      const { id, status, approver_id } = body;
  
      if (!id || !status || !approver_id) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
  
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        await connection.query(
          `UPDATE tbl_shift_requests SET status=?, approver_id=?, updated_at=NOW() WHERE id=?`,
          [status, approver_id, id]
        );

        // If approved and it's a swap, we need to swap the actual schedules
        if (status === 'Approved') {
            const [reqRows]: any = await connection.query(`SELECT * FROM tbl_shift_requests WHERE id=?`, [id]);
            if (reqRows.length > 0) {
                const req = reqRows[0];
                if (req.request_type === 'Swap' && req.target_shift_id && req.target_swap_shift_id) {
                   // Get the two schedule entries
                   const [sched1]: any = await connection.query(`SELECT * FROM tbl_schedules WHERE id=?`, [req.target_shift_id]);
                   const [sched2]: any = await connection.query(`SELECT * FROM tbl_schedules WHERE id=?`, [req.target_swap_shift_id]);
                   
                   if (sched1.length > 0 && sched2.length > 0) {
                      // Swap the emp_ids
                      await connection.query(`UPDATE tbl_schedules SET emp_id=? WHERE id=?`, [sched2[0].emp_id, req.target_shift_id]);
                      await connection.query(`UPDATE tbl_schedules SET emp_id=? WHERE id=?`, [sched1[0].emp_id, req.target_swap_shift_id]);
                   }
                }
                // (Optional) if it's 'Leave', we might want to automatically change their schedule to Off, 
                // but let's leave that to the manager to do manually on the board for now.
            }
        }
  
        await connection.commit();
        connection.release();

        return NextResponse.json({ message: `Request ${status}` }, { status: 200 });
      } catch (txError) {
        await connection.rollback();
        connection.release();
        throw txError;
      }

    } catch (error) {
      console.error('Error updating shift request:', error);
      return NextResponse.json({ error: 'Failed to update shift request' }, { status: 500 });
    }
}
