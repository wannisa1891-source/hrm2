const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: '172.30.3.249',
    user: 'HRM',
    password: '11111',
    database: 'hrm_db',
    port: 3306,
  });

  try {
    const [rows] = await connection.query('DESCRIBE tbl_employees');
    const cols = rows.map(r => r.Field);
    console.log('REAL_COLUMNS: ' + cols.join(', '));
  } catch (err) {
    console.error('ERROR: ' + err.message);
  } finally {
    await connection.end();
  }
}

run();
