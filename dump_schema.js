
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Mock a simple pool for standalone use
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
    fs.writeFileSync('schema_dump.json', JSON.stringify(rows, null, 2));
    console.log('Schema dumped to schema_dump.json');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await connection.end();
  }
}

run();
