const mysql = require('mysql2/promise');

async function main() {
  const config = {
    host: "192.168.13.123",
    user: "HRM",
    password: "11111",
    database: "hrm_db",
    port: 3306
  };
  try {
    const connection = await mysql.createConnection(config);
    const [rows] = await connection.query("SHOW TABLES");
    console.log("Tables:", rows);
    
    // Also describe the employee table if it exists to see if license is part of it
    const [emp] = await connection.query("DESCRIBE employees").catch(() => [null]);
    if (emp) console.log("Employees table:", emp);

    // Describe license table if it exists
    const [lic] = await connection.query("DESCRIBE licenses").catch(() => [null]);
    if (lic) console.log("Licenses table:", lic);

    const [prof_lic] = await connection.query("DESCRIBE professional_licenses").catch(() => [null]);
    if (prof_lic) console.log("Professional Licenses table:", prof_lic);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
