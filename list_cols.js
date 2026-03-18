
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
    console.log('--- COLUMNS ---');
    rows.forEach(r => console.log(r.Field));
    console.log('---------------');
  } catch (err) {
    console.error('ERROR_START');
    console.error(err.message);
    console.error('ERROR_END');
  } finally {
    await connection.end();
  }
}

run();
