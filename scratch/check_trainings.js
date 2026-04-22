const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: '172.30.3.249',
    user: 'HRM',
    password: '11111',
    database: 'hrm_db',
  });

  const [tables] = await pool.query("SHOW TABLES LIKE '%training%'");
  console.log(tables);
  
  if (tables.length > 0) {
    const tableName = Object.values(tables[0])[0];
    const [cols] = await pool.query(`SHOW COLUMNS FROM ${tableName}`);
    console.log(cols);
    const [rows] = await pool.query(`SELECT * FROM ${tableName} LIMIT 2`);
    console.log(rows);
  }
  
  pool.end();
}
main();
