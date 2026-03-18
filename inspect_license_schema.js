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
    console.log('--- tbl_licenses ---');
    const [descLicenses] = await connection.query('DESCRIBE tbl_licenses');
    console.table(descLicenses);

    console.log('\n--- tbl_employees (license related) ---');
    const [descEmployees] = await connection.query('DESCRIBE tbl_employees');
    const licenseCols = descEmployees.filter(c => c.Field.toLowerCase().includes('license'));
    console.table(licenseCols);

  } catch (err) {
    console.error('ERROR: ' + err.message);
  } finally {
    await connection.end();
  }
}

run();
