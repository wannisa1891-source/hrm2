const mysql = require('mysql2/promise');

async function alterDatabase() {
  let connection;
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection({
      host: '192.168.13.123',
      user: 'HRM',
      password: '11111',
      database: 'hrm_db',
    });

    console.log('Connected. Altering table tbl_employees...');

    const alterQuery = `
      ALTER TABLE tbl_employees
      ADD COLUMN license_name VARCHAR(255) DEFAULT NULL,
      ADD COLUMN license_type VARCHAR(100) DEFAULT NULL,
      ADD COLUMN license_institution VARCHAR(255) DEFAULT NULL,
      ADD COLUMN license_issue_date DATE DEFAULT NULL,
      ADD COLUMN license_status VARCHAR(50) DEFAULT NULL,
      ADD COLUMN license_file VARCHAR(255) DEFAULT NULL,
      ADD COLUMN cneu_cme_points FLOAT DEFAULT 0;
    `;

    await connection.execute(alterQuery);
    console.log('Successfully added extensive license columns to tbl_employees.');

  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Some columns already exist, which is fine.');
    } else {
      console.error('Error altering table:', error.message);
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

alterDatabase();
