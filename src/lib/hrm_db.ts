import mysql from "mysql2/promise";

// ใช้ global variable เพื่อป้องกันการสร้าง Connection Pool ใหม่ทุกครั้งที่ Next.js รีโหลดโค้ด (Hot Reload)
const globalForMysql = global as unknown as { pool: mysql.Pool };

async function getPool(): Promise<mysql.Pool> {
  if (globalForMysql.pool) return globalForMysql.pool;

  const port = 3306;
  try {
    const config = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: port,
      waitForConnections: true,
      connectionLimit: 10,
    };

    const pool = mysql.createPool(config);

    // ทดสอบการเชื่อมต่อจริง
    await pool.query("SELECT 1");
    console.log(`✅ Connected MySQL on port ${port}`);

    globalForMysql.pool = pool;
    return pool;
  } catch (error) {
    console.error(`❌ MySQL connection failed:`, error);
    throw new Error(`Cannot connect to MySQL on port ${port}`);
  }
}

export default {
  query: async (sql: string, values?: any[]) => {
    const pool = await getPool();
    // คืนค่า [rows, fields] ตามมาตรฐาน mysql2/promise
    return pool.query(sql, values);
  }
};