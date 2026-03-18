import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

// PUT /api/licenses/[id] - Update a license
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const { license_no, expire_date, cneu_cme_points } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Determine if it's a tbl_licenses ID (starts with L) or tbl_employees (starts with EMP)
    if (id.startsWith('L')) {
      const licenseId = id.substring(1);
      const query = `
        UPDATE tbl_licenses 
        SET 
          license_no = COALESCE(?, license_no), 
          expire_date = COALESCE(?, expire_date),
          cneu_cme_points = COALESCE(?, cneu_cme_points)
        WHERE license_id = ?
      `;
      await pool.query(query, [license_no || null, expire_date || null, cneu_cme_points || null, licenseId]);
      return NextResponse.json({ message: 'License updated successfully' });
    } else if (id.startsWith('EMP-')) {
      // If it only exists in tbl_employees, we should probably create a record in tbl_licenses
      // or update tbl_employees. For consistency with the renew flow, let's create a record.
      const empId = id.substring(4);
      const query = `
        INSERT INTO tbl_licenses (emp_id, license_no, expire_date, cneu_cme_points)
        VALUES (?, ?, ?, ?)
      `;
      await pool.query(query, [empId, license_no || null, expire_date || null, cneu_cme_points || 0]);
      return NextResponse.json({ message: 'License record created and updated' });
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
      return NextResponse.json({ error: 'Only records in tbl_licenses can be deleted' }, { status: 400 });
    }

    const licenseId = id.substring(1);
    await pool.query('DELETE FROM tbl_licenses WHERE license_id = ?', [licenseId]);
    
    return NextResponse.json({ message: 'License record deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting license:', err);
    return NextResponse.json({ error: err.message || 'DB Error' }, { status: 500 });
  }
}
