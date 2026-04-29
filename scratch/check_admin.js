import pool from './src/lib/hrm_db.js';

async function checkAdmin() {
  try {
    const [rows] = await pool.query(
      "SELECT emp_id, username, first_name_th, last_name_th, role, status, password, citizen_id FROM tbl_employees WHERE username = 'admin' OR emp_id = 'admin' OR email = 'admin'"
    );
    console.log('User Data:', JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkAdmin();
