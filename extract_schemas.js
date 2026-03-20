const fs = require('fs');
const content = fs.readFileSync('D:\\\\Intern\\\\Web Dev\\\\hrm_db.sql', 'utf-8');
const lines = content.split('\n');
let capturing = false;

for(let i=0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('CREATE TABLE `tbl_employees`')) {
    console.log(`\n--- Line ${i+1}: ${line.trim()} ---`);
    capturing = true;
  }
  if (capturing) {
    if (!line.includes('CREATE TABLE')) console.log(line.trim());
    if (line.includes(') ENGINE=')) {
      capturing = false;
      break; // stop after finding it
    }
  }
}
