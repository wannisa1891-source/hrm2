const fs = require('fs');
const path = 'src/app/employees/page.tsx';
let d = fs.readFileSync(path, 'utf8');

// Replace specific emojis
const replaces = [
  ['<span>🔍</span>', '<span style={{fontSize: "12px", color: "#64748b"}}>ค้นหา</span>'],
  [": '👤'}", ": 'รูป'}"],
  [">✏️<", ">แก้ไข<"],
  [">🗑️<", ">ลบ<"],
  [">✨<", ">เพิ่ม<"],
  ["<span style={{fontSize: '28px', marginBottom: '8px'}}>📸</span>", ""],
  ["<span style={{ fontSize: '20px' }}>👤</span> ", ""],
  ["<span style={{ fontSize: '20px' }}>📱</span> ", ""],
  ["📜 ", ""],
  ["💾 ", ""],
  ["📁 ", ""],
  ["📍 ", ""],
  ["🟢 ", ""],
  ["🟡 ", ""],
  ["🔴 ", ""],
  ["🟠 ", ""],
  ["✅ ", ""],
  ['title="ใบประกอบวิชาชีพหมดอายุ">⚠️</span>', 'title="ใบประกอบวิชาชีพหมดอายุ" style={{ fontWeight: 600, color: "#ef4444" }}>หมดอายุ</span>']
];

replaces.forEach(([find, replace]) => {
  d = d.split(find).join(replace);
});

// Write back
fs.writeFileSync(path, d);
console.log('Done removing emojis');
