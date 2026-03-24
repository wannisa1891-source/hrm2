const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: '172.30.3.249',
      port: 3306,
      user: 'HRM',
      password: '11111',
    });
    console.log('✅ Connection to 172.30.3.249 with user HRM successful!');
    
    // Also try to list databases to find the right DB_NAME
    const [rows] = await connection.query('SHOW DATABASES');
    console.log('Databases available:', rows.map(r => r.Database));

    await connection.end();
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  }
}

testConnection();
