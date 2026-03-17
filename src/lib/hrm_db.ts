import mysql from "mysql2/promise";

const globalForMysql = global as unknown as { pool: mysql.Pool };

const pool =
  globalForMysql.pool ||
  mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
  });

if (process.env.NODE_ENV !== "production") globalForMysql.pool = pool;

export default pool;