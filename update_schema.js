const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const [cols] = await pool.query('SHOW COLUMNS FROM tbl_transfers');
    const existingColumns = cols.map(c => c.Field);
    console.log('Existing columns:', existingColumns);

    const neededColumns = [
      { name: 'old_level', type: 'VARCHAR(100)' },
      { name: 'new_level', type: 'VARCHAR(100)' },
      { name: 'old_pos_no', type: 'VARCHAR(100)' },
      { name: 'new_pos_no', type: 'VARCHAR(100)' },
      { name: 'remark', type: 'TEXT' }
    ];

    for (const col of neededColumns) {
      if (!existingColumns.includes(col.name)) {
        console.log(`Adding column: ${col.name}`);
        await pool.query(`ALTER TABLE tbl_transfers ADD COLUMN ${col.name} ${col.type} DEFAULT NULL`);
      }
    }

    console.log('Schema update complete.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
