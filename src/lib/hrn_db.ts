import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

async function getPool(): Promise<mysql.Pool> {
  if (pool) return pool;

  const ports = [3360, 3306];

  for (const port of ports) {
    try {
      const testPool = mysql.createPool({
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "hrm_db",
        port: port,
        waitForConnections: true,
        connectionLimit: 10,
      });

      await testPool.query("SELECT 1");
      console.log(`✅ Connected MySQL on port ${port}`);

      pool = testPool;
      return pool;

    } catch {
      console.log(`❌ Port ${port} not available`);
    }
  }

  throw new Error("Cannot connect to MySQL (3360 or 3306)");
}

export default {
  query: async (sql: string, values?: any[]) => {
    const connection = await getPool();
    return connection.query(sql, values);
  }
};