import pool from './src/lib/hrm_db.js';

async function checkSchema() {
  try {
    const [rows] = await pool.query('DESCRIBE tbl_transfers');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSchema();
