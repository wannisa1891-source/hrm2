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
    // Add columns if they don't exist
    await pool.query('ALTER TABLE tbl_transfers ADD COLUMN remark TEXT NULL');
  } catch(e) { console.log('remark exists'); }
  try {
    await pool.query('ALTER TABLE tbl_transfers ADD COLUMN promotion_order VARCHAR(255) NULL');
  } catch(e) { console.log('promotion_order exists'); }
  try {
    await pool.query('ALTER TABLE tbl_transfers ADD COLUMN request_memo TEXT NULL');
  } catch(e) { console.log('request_memo exists'); }
  try {
    await pool.query('ALTER TABLE tbl_transfers ADD COLUMN request_file VARCHAR(255) NULL');
  } catch(e) { console.log('request_file exists'); }
  
  console.log('Done!');
  process.exit(0);
}
run();
