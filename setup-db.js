const mysql = require('mysql2/promise');

async function createTable() {
  try {
    const pool = mysql.createPool({
      host: '192.168.13.123',
      user: 'HRM',
      password: '11111',
      database: 'hrm_db',
      port: 3306,
      waitForConnections: true,
      connectionLimit: 10,
    });

    console.log('Connecting to MySQL...');
    await pool.query('SELECT 1');
    console.log('Connected!');

    const sql = `
      CREATE TABLE IF NOT EXISTS tbl_announcements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        image LONGTEXT,
        icon VARCHAR(255),
        iconBg VARCHAR(50),
        iconColor VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(sql);
    console.log('✅ Table "tbl_announcements" created successfully!');

    // Check all tables just to be sure
    const [rows] = await pool.query('SHOW TABLES');
    console.log('Tables in hrm_db:', rows.map(r => Object.values(r)[0]));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating table:', error);
    process.exit(1);
  }
}

createTable();
