import { NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const departments = [
      // 1. กลุ่มงานบริหารทั่วไป
      { id: 'ADM-FIN', division: '1. กลุ่มงานบริหารทั่วไป', name: 'การเงิน' },
      { id: 'ADM-ACC', division: '1. กลุ่มงานบริหารทั่วไป', name: 'บัญชี' },
      { id: 'ADM-ADM', division: '1. กลุ่มงานบริหารทั่วไป', name: 'ธุรการ' },
      { id: 'ADM-SUP', division: '1. กลุ่มงานบริหารทั่วไป', name: 'พัสดุ' },
      { id: 'ADM-MNT', division: '1. กลุ่มงานบริหารทั่วไป', name: 'ช่าง' },
      { id: 'ADM-GRD', division: '1. กลุ่มงานบริหารทั่วไป', name: 'สวน' },
      { id: 'ADM-DRV', division: '1. กลุ่มงานบริหารทั่วไป', name: 'พขร.' },
      { id: 'ADM-AUD', division: '1. กลุ่มงานบริหารทั่วไป', name: 'งานโสตฯ' },

      // 2. กลุ่มงานเทคนิคการแพทย์
      { id: 'MED-TECH', division: '2. กลุ่มงานเทคนิคการแพทย์', name: 'เทคนิคการแพทย์' },

      // 3. กลุ่มงานทันตกรรม
      { id: 'DENT-DENT', division: '3. กลุ่มงานทันตกรรม', name: 'ทันตกรรม' },

      // 4. กลุ่มงานเภสัชกรรมและคุ้มครองผู้บริโภค
      { id: 'PHA-PHA', division: '4. กลุ่มงานเภสัชกรรมและคุ้มครองผู้บริโภค', name: 'เภสัชกรรมและคุ้มครองผู้บริโภค' },

      // 5. กลุ่มงานการแพทย์
      { id: 'MED-MED', division: '5. กลุ่มงานการแพทย์', name: 'การแพทย์' },

      // 6. กลุ่มงานโภชนศาสตร์
      { id: 'NUTR-NUTR', division: '6. กลุ่มงานโภชนศาสตร์', name: 'โภชนศาสตร์' },

      // 7. กลุ่มงานรังสีวิทยา
      { id: 'RAD-RAD', division: '7. กลุ่มงานรังสีวิทยา', name: 'รังสีวิทยา' },

      // 8. กลุ่มงานเวชกรรมฟื้นฟู
      { id: 'REHAB-REHA', division: '8. กลุ่มงานเวชกรรมฟื้นฟู', name: 'เวชกรรมฟื้นฟู' },

      // 9. กลุ่มงานประกันสุขภาพ ยุทธศาสตร์และสารสนเทศทางการแพทย์
      { id: 'STR-INS', division: '9. กลุ่มงานประกันสุขภาพ ยุทธศาสตร์และสารสนเทศทางการแพทย์', name: 'ประกัน' },
      { id: 'STR-COM', division: '9. กลุ่มงานประกันสุขภาพ ยุทธศาสตร์และสารสนเทศทางการแพทย์', name: 'คอมฯ' },
      { id: 'STR-REC', division: '9. กลุ่มงานประกันสุขภาพ ยุทธศาสตร์และสารสนเทศทางการแพทย์', name: 'ห้องบัตร' },

      // 10. กลุ่มงานบริการด้านปฐมภูมิและองค์รวม
      { id: 'PRI-PSY', division: '10. กลุ่มงานบริการด้านปฐมภูมิและองค์รวม', name: 'งานจิตเวชและยาเสพติด' },

      // 11. กลุ่มงานการพยาบาล
      { id: 'NUR-QC', division: '11. กลุ่มงานการพยาบาล', name: 'ศูนย์คุณภาพ' },
      { id: 'NUR-ER', division: '11. กลุ่มงานการพยาบาล', name: 'งานการพยาบาลผู้ป่วยอุบัติเหตุฉุกเฉินและนิติเวช' },
      { id: 'NUR-LR', division: '11. กลุ่มงานการพยาบาล', name: 'ห้องคลอด' },
      { id: 'NUR-NICU', division: '11. กลุ่มงานการพยาบาล', name: 'NICU' },
      { id: 'NUR-FEM', division: '11. กลุ่มงานการพยาบาล', name: 'หญิง' },
      { id: 'NUR-MALE', division: '11. กลุ่มงานการพยาบาล', name: 'ชาย' },
      { id: 'NUR-ICU', division: '11. กลุ่มงานการพยาบาล', name: 'ICU' },
      { id: 'NUR-PRIV', division: '11. กลุ่มงานการพยาบาล', name: 'พิเศษ' },
      { id: 'NUR-SUP', division: '11. กลุ่มงานการพยาบาล', name: 'ซัพพลาย' },
      { id: 'NUR-OPD', division: '11. กลุ่มงานการพยาบาล', name: 'OPD' },
      { id: 'NUR-HSE', division: '11. กลุ่มงานการพยาบาล', name: 'แม่บ้าน' },
      { id: 'NUR-CART', division: '11. กลุ่มงานการพยาบาล', name: 'เปล' },
      { id: 'NUR-OR', division: '11. กลุ่มงานการพยาบาล', name: 'ห้องผ่าตัด' },

      // 12. กลุ่มงานแพทย์แผนไทยและการแพทย์ทางเลือก3-3
      { id: 'THA-MT', division: '12. กลุ่มงานแพทย์แผนไทยและการแพทย์ทางเลือก3-3', name: 'แผนไทย แบ่งเปอร์เซนต์' },
    ];

    const { searchParams } = new URL(request.url);
    const init = searchParams.get('init');

    if (init === 'true') {
      // 1. Initialize Departments Table structure
      await pool.query(`
        CREATE TABLE IF NOT EXISTS tbl_departments (
          dept_id VARCHAR(50) PRIMARY KEY,
          division VARCHAR(255),
          dept_name VARCHAR(255),
          sub_dept VARCHAR(255),
          description TEXT,
          head_emp_id VARCHAR(50),
          phone VARCHAR(50),
          org_chart_url VARCHAR(255),
          sop_url VARCHAR(255),
          rules_url VARCHAR(255)
        )
      `);

      // 2. Clear old test data or corrupted data (optional, but safer for a clean start)
      // For now, we use UPSERT to avoid deleting real user data if any.
      
      for (const dept of departments) {
        await pool.query(
          `INSERT INTO tbl_departments (dept_id, division, dept_name) 
           VALUES (?, ?, ?) 
           ON DUPLICATE KEY UPDATE division = VALUES(division), dept_name = VALUES(dept_name)`,
          [dept.id, dept.division, dept.name]
        );
      }

      // 3. Initialize Notifications
      await pool.query(`
        CREATE TABLE IF NOT EXISTS tbl_notifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          emp_id VARCHAR(50) NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          is_read BOOLEAN DEFAULT FALSE,
          metadata TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // 4. Update Transfers (Ensure status column exists)
      try { await pool.query("ALTER TABLE tbl_transfers ADD COLUMN status VARCHAR(50) DEFAULT 'Pending'"); } catch(e) {}

      return NextResponse.json({ success: true, message: 'System initialized successfully', count: departments.length });
    }

    const [rows] = await pool.query('SELECT * FROM tbl_departments ORDER BY division, dept_name');
    return NextResponse.json({ success: true, data: rows });
  } catch (err: any) {
    console.error('Init API Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
