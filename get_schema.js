const mysql = require('mysql2/promise');

async function getSchemas() {
  try {
    const connection = await mysql.createConnection({
      host: '172.30.3.249',
      user: 'HRM',
      password: '11111',
      database: 'hrm_db'
    });

    console.log("=== tbl_employees ===");
    const [empRows] = await connection.execute('DESCRIBE tbl_employees');
    console.log(JSON.stringify(empRows, null, 2));

    console.log("=== tbl_employee_licenses ===");
    const [licRows] = await connection.execute('DESCRIBE tbl_employee_licenses');
    console.log(JSON.stringify(licRows, null, 2));

    await connection.end();
  } catch (error) {
    console.error('Error connecting to DB:', error);
  }
}

getSchemas();
