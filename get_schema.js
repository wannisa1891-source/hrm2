const mysql = require('mysql2');
const pool = mysql.createPool({
  host: '172.30.3.249',
  user: 'HRM',
  password: '11111',
  database: 'hrm_db'
});

pool.query('DESCRIBE tbl_users', (err, results) => {
  if (err) console.error(err);
  console.log('--- tbl_users ---');
  console.log(results);
  
  pool.query('DESCRIBE tbl_employees', (err, results) => {
    if (err) console.error(err);
    console.log('--- tbl_employees ---');
    console.log(results);
    pool.end();
  });
});
