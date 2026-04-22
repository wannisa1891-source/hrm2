const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: '172.30.3.249',
    user: 'HRM',
    password: '11111',
    database: 'hrm_db',
  });

  const query = `
    CREATE TABLE IF NOT EXISTS tbl_employee_trainings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      emp_id VARCHAR(50) NOT NULL,
      course_name VARCHAR(255) NOT NULL,
      institution VARCHAR(255),
      start_date DATE,
      end_date DATE,
      certificate_file VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX (emp_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  
  await pool.query(query);
  console.log("Table tbl_employee_trainings created successfully.");
  
  pool.end();
}
main();
