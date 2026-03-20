const fs=require('fs');
const content=fs.readFileSync('D:/Intern/Web Dev/hrm_db.sql','utf-8');
const m=content.match(/CREATE TABLE.*?tbl_employees[\s\S]*?ENGINE/i);
if(m) console.log(m[0]);
else console.log('NOT FOUND');
