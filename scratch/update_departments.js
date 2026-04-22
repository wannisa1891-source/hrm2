
const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: '172.30.3.249',
    user: 'HRM',
    password: '11111',
    database: 'hrm_db',
    port: 3306
  });

  const departments = [
    { division: '1. กลุ่มงานบริหารทั่วไป', names: ['การเงิน', 'ธุรการ', 'พัสดุ', 'ช่าง', 'สวน', 'พขร.', 'งานโสตฯ'] },
    { division: '2. กลุ่มงานเทคนิคการแพทย์', names: ['เทคนิคการแพทย์'] },
    { division: '3. กลุ่มงานทันตกรรม', names: ['ทันตกรรม'] },
    { division: '4. กลุ่มงานเภสัชกรรมและคุ้มครองผู้บริโภค', names: ['เภสัชกรรม'] },
    { division: '5. กลุ่มงานการแพทย์', names: ['การแพทย์'] },
    { division: '6. กลุ่มงานโภชนศาสตร์', names: ['โภชนศาสตร์'] },
    { division: '7. กลุ่มงานรังสีวิทยา', names: ['รังสีวิทยา'] },
    { division: '8. กลุ่มงานเวชกรรมฟื้นฟู', names: ['เวชกรรมฟื้นฟู'] },
    { division: '9. กลุ่มงานประกันสุขภาพ ยุทธศาสตร์และสารสนเทศทางการแพทย์', names: ['ประกัน', 'คอมฯ', 'ห้องบัตร'] },
    { division: '10.กลุ่มงานบริการด้านปฐมภูมิและองค์รวม', names: ['งานจิตเวชและยาเสพติด'] },
    { division: '11. กลุ่มงานการพยาบาล', names: ['ศูนย์คุณภาพ', 'งานการพยาบาลผู้ป่วยอุบัติเหตุฉุกเฉินและนิติเวช', 'ห้องคลอด', 'NICU', 'หญิง', 'ชาย', 'ICU', 'พิเศษ', 'ซัพพลาย', 'OPD', 'แม่บ้าน', 'เปล', 'ห้องผ่าตัด'] },
    { division: '12 กลุ่มงานแพทย์แผนไทยและการแพทย์ทางเลือก', names: ['แพทย์แผนไทย'] }
  ];

  console.log('Cleaning up old departments...');
  // We might want to keep existing ones if they have employees, 
  // but for a clean reset of the list, we can truncate or just insert new ones.
  // Let's just insert/update.
  
  for (const group of departments) {
    for (const sub of group.names) {
      const dept_id = 'D' + Math.random().toString(36).substr(2, 4).toUpperCase();
      await connection.query(
        'INSERT INTO tbl_departments (dept_id, dept_name, division) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE division = ?',
        [dept_id, sub, group.division, group.division]
      );
    }
  }

  await connection.end();
  console.log('Departments updated successfully.');
}

main().catch(console.error);
