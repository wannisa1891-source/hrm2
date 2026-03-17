const fs = require('fs');

const files = [
  'C:\\xampp\\htdocs\\hrm2\\tmp_check_db.js',
  'C:\\xampp\\htdocs\\hrm2\\tmp_check_db.ts',
  'C:\\xampp\\htdocs\\hrm2\\tmp_seed.ts'
];

for (const file of files) {
  try {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`Deleted: ${file}`);
    } else {
      console.log(`Not found: ${file}`);
    }
  } catch (err) {
    console.error(`Failed to delete ${file}:`, err.message);
  }
}
