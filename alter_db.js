const mysql = require('mysql2/promise');

async function run() {
  const pool = mysql.createPool({
    host: '192.168.13.123',
    user: 'HRM',
    password: '11111',
    database: 'hrm_db',
  });

  try {
    console.log('Altering tbl_employees...');
    await pool.query(`
      ALTER TABLE tbl_employees
      ADD COLUMN addr_no VARCHAR(50) NULL AFTER address,
      ADD COLUMN addr_moo VARCHAR(50) NULL AFTER addr_no,
      ADD COLUMN addr_village VARCHAR(100) NULL AFTER addr_moo,
      ADD COLUMN addr_soi VARCHAR(50) NULL AFTER addr_village,
      ADD COLUMN addr_road VARCHAR(100) NULL AFTER addr_soi,
      ADD COLUMN addr_province VARCHAR(100) NULL AFTER addr_road,
      ADD COLUMN addr_district VARCHAR(100) NULL AFTER addr_province,
      ADD COLUMN addr_subdistrict VARCHAR(100) NULL AFTER addr_district,
      ADD COLUMN addr_zipcode VARCHAR(10) NULL AFTER addr_subdistrict,
      ADD COLUMN has_license TINYINT(1) DEFAULT 0 AFTER image,
      ADD COLUMN license_no VARCHAR(100) NULL AFTER has_license,
      ADD COLUMN license_expire DATE NULL AFTER license_no,
      ADD COLUMN email VARCHAR(100) NULL AFTER license_expire,
      ADD COLUMN password VARCHAR(255) NULL AFTER email,
      ADD COLUMN role VARCHAR(50) DEFAULT 'User' AFTER password;
    `);
    console.log('Successfully completed ALTER TABLE');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Columns already exist. Skipping.');
    } else {
      console.error('Error altering table:', err);
    }
  } finally {
    await pool.end();
  }
}

run();
