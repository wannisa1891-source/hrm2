const mysql = require('mysql2/promise');

async function alterDb() {
  const connection = await mysql.createConnection({
    host: '192.168.13.123',
    user: 'HRM',
    password: '11111',
    database: 'hrm_db'
  });

  try {
    console.log('Altering tbl_employees...');
    await connection.execute('ALTER TABLE tbl_employees ADD COLUMN quota_personal INT DEFAULT 6');
    await connection.execute('ALTER TABLE tbl_employees ADD COLUMN quota_vacation INT DEFAULT 10');
    await connection.execute('ALTER TABLE tbl_employees ADD COLUMN quota_sick INT DEFAULT 30');
    console.log('Database altered successfully with quota columns.');
  } catch (error) {
    console.error('Error altering database:', error.message);
  } finally {
    await connection.end();
  }
}

alterDb();
