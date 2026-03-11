import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hrm_db',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function getDb() {
  try {
    const conn = await pool.getConnection();
    conn.release();
    return pool;
  } catch {
    // Try port 3307 (XAMPP alternate port)
    const pool2 = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hrm_db',
      port: 3307,
      waitForConnections: true,
      connectionLimit: 10,
    });
    return pool2;
  }
}

export default pool;
