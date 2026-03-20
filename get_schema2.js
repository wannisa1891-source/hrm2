const fs = require('fs');
const content = fs.readFileSync('D:/Intern/Web Dev/hrm_db.sql', 'utf-8');

// Match tbl_users
const m1 = content.match(/CREATE TABLE[^;]*?`tbl_users`[\s\S]*?ENGINE[^;]*/i);
if (m1) {
  console.log('=== tbl_users ===');
  console.log(m1[0]);
} else {
  console.log('tbl_users NOT FOUND');
}
