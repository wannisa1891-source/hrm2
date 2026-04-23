const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const envFile = path.join(process.cwd(), '.env.local');
const env = fs.readFileSync(envFile, 'utf8').split('\n').reduce((acc, line) => {
  const [k, v] = line.split('=');
  if (k && v) acc[k.trim()] = v.trim();
  return acc;
}, {});

async function run() {
  const pool = mysql.createPool({
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    port: parseInt(env.DB_PORT || '3306')
  });

  console.log('Adding reimbursement columns to tbl_bookings...');
  
  const columns = [
    { name: 'memo_file', type: 'VARCHAR(255) NULL' },
    { name: 'project_file', type: 'VARCHAR(255) NULL' },
    { name: 'transport_cost', type: 'DECIMAL(10,2) DEFAULT 0' },
    { name: 'accommodation_cost', type: 'DECIMAL(10,2) DEFAULT 0' },
    { name: 'organizer_pay', type: 'DECIMAL(10,2) DEFAULT 0' },
    { name: 'parent_pay', type: 'DECIMAL(10,2) DEFAULT 0' }
  ];

  for (const col of columns) {
    try {
      await pool.query(`ALTER TABLE tbl_bookings ADD COLUMN ${col.name} ${col.type}`);
      console.log(`Column ${col.name} added.`);
    } catch (e) {
      console.log(`Column ${col.name} already exists or error: ${e.message}`);
    }
  }

  console.log('Done!');
  process.exit(0);
}

run();
