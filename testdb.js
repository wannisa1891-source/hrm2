const mysql = require('mysql2/promise');

async function test() {
  const connection = await mysql.createConnection({
    host: '172.30.3.249',
    user: 'HRM',
    password: '11111',
    database: 'hrm_db'
  });

  const [rows] = await connection.execute('SELECT user_id, username, password_hash, role, status FROM tbl_users LIMIT 5');
  console.log(rows);
  await connection.end();
}

test().catch(err => console.error(err));
