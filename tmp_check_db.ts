import db from "C:/xampp/htdocs/hrm2/src/lib/hrm_db";

async function main() {
  try {
    const [rows] = await db.query("SHOW TABLES");
    console.log("Tables:", rows);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
