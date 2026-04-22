const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: '172.30.3.249',
    user: 'HRM',
    password: '11111',
    database: 'hrm_db',
  });

  const [tables] = await pool.query("SHOW TABLES");
  console.log(tables);
  
  pool.end();
}
main();
