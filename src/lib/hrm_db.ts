import mysql from "mysql2/promise";
let pool: mysql.Pool | null = null;
async function getPool(): Promise<mysql.Pool> {
  if (pool) return pool;
  const port = 3306;
  try {
    const config = {
      host: process.env.DB_HOST || "192.168.13.123",
      user: process.env.DB_USER || "HRM",
      password: process.env.DB_PASSWORD || "111111",
      database: process.env.DB_NAME || "hrm_db",
      port: port,
      waitForConnections: true,
      connectionLimit: 10,
    };

    const testPool = mysql.createPool(config);
    // ทดสอบการเชื่อมต่อจริง
    await testPool.query("SELECT 1");
    console.log(`✅ Connected MySQL on port ${port}`);
    pool = testPool;
    return pool;
  } catch (error) {
    console.error(`❌ Port ${port} connection failed:`, error);
    throw new Error(`Cannot connect to MySQL on port ${port}`);
  }
}
export default {
  query: async (sql: string, values?: any[]) => {
    const connection = await getPool();
    return connection.query(sql, values);
  }
};