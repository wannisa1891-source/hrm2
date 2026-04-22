const mysql = require('mysql2/promise');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [k, v] = line.split('=');
  if (k && v) acc[k.trim()] = v.trim();
  return acc;
}, {});

const pool = mysql.createPool({
  host: env.DB_HOST,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  port: parseInt(env.DB_PORT || '3306')
});

async function run() {
  try {
    const [transfers] = await pool.query('DESCRIBE tbl_transfers');
    console.log("=== tbl_transfers ===");
    console.log(transfers.map(r => r.Field).join(', '));
    const [emps] = await pool.query('DESCRIBE tbl_employees');
    console.log("=== tbl_employees ===");
    console.log(emps.map(r => r.Field).join(', '));
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
