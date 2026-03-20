const fs = require('fs');
const content = fs.readFileSync('src/app/employees/page.tsx', 'utf8');

// Just print lines 200 to 360 with line numbers
const lines = content.split('\n');
for (let i = 200; i < 360; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
