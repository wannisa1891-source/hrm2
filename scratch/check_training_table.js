
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      env[key.trim()] = value.trim();
    }
  });
  return env;
}

const env = loadEnv();


async function checkTables() {
  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    port: parseInt(env.DB_PORT || '3306'),
  });


  try {
    const [rows] = await connection.execute('SHOW TABLES');
    console.log('Tables in database:', rows.map(row => Object.values(row)[0]));
    
    // Also check for columns if employee_training exists
    const trainingTable = rows.find(row => Object.values(row)[0] === 'employee_training');
    if (trainingTable) {
        const [columns] = await connection.execute('DESCRIBE employee_training');
        console.log('Columns in employee_training:', columns);
    } else {
        console.log('employee_training table does not exist.');
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await connection.end();
  }
}

checkTables();
