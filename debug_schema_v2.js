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
    const [rows] = await connection.query('SELECT * FROM tbl_employees LIMIT 1');
    if (rows.length > 0) {
      console.log('COLUMNS_FOUND: ' + Object.keys(rows[0]).join(', '));
    } else {
      console.log('NO_DATA_FOUND');
      // If no data, fall back to DESCRIBE
      const [desc] = await connection.query('DESCRIBE tbl_employees');
      console.log('COLUMNS_DESC: ' + desc.map(r => r.Field).join(', '));
    }
  } catch (err) {
    console.error('ERROR: ' + err.message);
  } finally {
    await connection.end();
  }
}

run();
