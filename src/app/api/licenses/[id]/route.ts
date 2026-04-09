import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export const dynamic = 'force-dynamic';

// PUT /api/licenses/[id] - Update a license
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const { license_no, expire_date, cneu_cme_points, license_name, license_type, institution, issue_date, verified_status } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    if (id.startsWith('L')) {
      const licenseId = id.substring(1);

      // Get emp_id to update points
      let empId = null;
      const [rows]: any = await pool.query('SELECT emp_id FROM tbl_employee_licenses WHERE id = ?', [licenseId]);
      if (rows.length > 0) {
        empId = rows[0].emp_id;
      }

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        const query = `
          UPDATE tbl_employee_licenses 
          SET 
            license_no = COALESCE(?, license_no), 
            expire_date = COALESCE(?, expire_date),
            license_name = COALESCE(?, license_name),
            license_type = COALESCE(?, license_type),
            institution = COALESCE(?, institution),
            issue_date = COALESCE(?, issue_date),
            points = COALESCE(?, points),
            verified_status = COALESCE(?, verified_status)
          WHERE id = ?
        `;
        await connection.query(query, [
          license_no || null, 
          expire_date || null, 
          license_name || null, 
          license_type || null, 
          institution || null, 
          issue_date || null, 
          cneu_cme_points !== undefined ? cneu_cme_points : null,
          verified_status || null,
          licenseId
        ]);

        if (empId && cneu_cme_points !== undefined) {
          await connection.query('UPDATE tbl_employees SET cneu_cme_points = ? WHERE emp_id = ?', [cneu_cme_points, empId]);
        }

        await connection.commit();
        connection.release();
        return NextResponse.json({ message: 'License updated successfully' });
      } catch (err: any) {
        await connection.rollback();
        connection.release();
        throw err;
      }
    } else if (id.startsWith('EMP-')) {
      // Create new license in tbl_employee_licenses
      const empId = id.substring(4);
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const query = `
          INSERT INTO tbl_employee_licenses (emp_id, license_name, license_type, license_no, institution, issue_date, expire_date, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')
        `;
        await connection.query(query, [empId, license_name || null, license_type || null, license_no || null, institution || null, issue_date || null, expire_date || null]);

        if (cneu_cme_points !== undefined) {
           await connection.query('UPDATE tbl_employees SET cneu_cme_points = ? WHERE emp_id = ?', [cneu_cme_points, empId]);
        }
        await connection.commit();
        connection.release();
        return NextResponse.json({ message: 'License record created and updated' });
      } catch(err) {
        await connection.rollback();
        connection.release();
        throw err;
      }
    }

    return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
  } catch (err: any) {
    console.error('Error updating license:', err);
    return NextResponse.json({ error: err.message || 'DB Error' }, { status: 500 });
  }
}

// DELETE /api/licenses/[id] - Remove a license record
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id || !id.startsWith('L')) {
      return NextResponse.json({ error: 'Only records in tbl_employee_licenses can be deleted' }, { status: 400 });
    }

    const licenseId = id.substring(1);
    await pool.query('DELETE FROM tbl_employee_licenses WHERE id = ?', [licenseId]);
    
    return NextResponse.json({ message: 'License record deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting license:', err);
    return NextResponse.json({ error: err.message || 'DB Error' }, { status: 500 });
  }
}
