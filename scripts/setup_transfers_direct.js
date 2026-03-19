const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: '172.30.3.249',
    user: 'root',
    password: '',
    database: 'hrm_db',
    port: 3306,
  });

  try {
    await pool.query("ALTER TABLE tbl_transfers ADD COLUMN status VARCHAR(50) DEFAULT 'Pending'");
    console.log("Added status column successfully.");
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log("Status column already exists.");
    } else {
      console.error("Error adding status column:", e);
    }
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tbl_notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        emp_id VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Created tbl_notifications table successfully.");
  } catch(e) { 
    console.error("Error creating notifications table:", e); 
  }
  
  process.exit(0);
}

main();
