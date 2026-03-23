const mysql = require('mysql2/promise');

async function test() {
  try {
    const pool = mysql.createPool({
      host: '172.30.3.249',
      user: 'HRM',
      password: '11111',
      database: 'hrm_db',
      port: 3306,
    });
    const [rows] = await pool.query('DESCRIBE tbl_employees');
    console.log(rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
