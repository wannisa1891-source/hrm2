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

  console.log('Creating tbl_reimbursements table...');
  
  const sql = `
    CREATE TABLE IF NOT EXISTS tbl_reimbursements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      emp_id VARCHAR(50) NOT NULL,
      topic VARCHAR(255) NOT NULL,
      memo_file VARCHAR(255) NULL,
      project_file VARCHAR(255) NULL,
      transport_cost DECIMAL(10,2) DEFAULT 0,
      accommodation_cost DECIMAL(10,2) DEFAULT 0,
      organizer_pay DECIMAL(10,2) DEFAULT 0,
      parent_pay DECIMAL(10,2) DEFAULT 0,
      reimbursement_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  try {
    await pool.query(sql);
    console.log('Table tbl_reimbursements created or already exists.');
  } catch (e) {
    console.error('Error creating table:', e.message);
  }

  process.exit(0);
}

run();
