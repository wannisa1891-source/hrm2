'use client';


import { useState, useEffect, Suspense, useMemo } from 'react';
import html2canvas from 'html2canvas';
import AppLayout from '@/components/layout/AppLayout';
import { useEmployees } from '@/hooks/useEmployees';
import { useDepartments } from '@/hooks/useDepartments';
import { usePositions } from '@/hooks/usePositions';
import type { Employee } from '@/services/apiService';
import { useSearchParams, useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { QRCodeSVG } from 'qrcode.react';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import Swal from 'sweetalert2';
import { useAuth } from '@/contexts/AuthContext';
import EmployeeFormModal from '@/components/employees/EmployeeFormModal';
import Image from 'next/image';
import { formatDateToBE } from '@/lib/dateUtils';

const EMPTY_FORM: Partial<Employee> = {
  prefix: 'นาย', first_name_th: '', last_name_th: '',
  birth_date: '', gender: 'ชาย', citizen_id: '',
  emp_id: '', dept_id: '', pos_id: '', emp_type: 'พนักงานราชการ', start_date: '',
  phone: '', address: '', status: 'Active',
  addr_no: '', addr_moo: '', addr_village: '', addr_soi: '', addr_road: '', addr_province: '', addr_district: '', addr_subdistrict: '', addr_zipcode: '',
  has_license: false, email: '', password: '', role: 'User', licenses: []
};

function EmployeesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = ['Admin', 'HR', 'หัวหน้า'].includes(user?.role || '');

  useEffect(() => {
    if (user && !isAdmin) {
      router.push('/dashboard');
    }
  }, [user, isAdmin, router]);

  const { employees, loading, loadEmployees, addEmployee, editEmployee, removeEmployee } = useEmployees();
  const { departments, loadDepartments } = useDepartments();
  const { positions, loadPositions } = usePositions();

  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [filterDiv, setFilterDiv] = useState('all');
  const [filterGrp, setFilterGrp] = useState('all');
  const [filterPos, setFilterPos] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLicense, setFilterLicense] = useState('all');
  const [posSearch, setPosSearch] = useState<string>('');
  const [isPosOpen, setIsPosOpen] = useState<boolean>(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Employee> | null>(null);

  const [isImporting, setIsImporting] = useState(false);
  const [showIdCard, setShowIdCard] = useState(false);
  const [selectedEmpForCard, setSelectedEmpForCard] = useState<Employee | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkPrinting, setIsBulkPrinting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Customization States for ID Card
  const [cardBgColor, setCardBgColor] = useState('#ffffff');
  const [cardPrimaryColor, setCardPrimaryColor] = useState('#1E3A8A');
  const [cardSecondaryColor, setCardSecondaryColor] = useState('#F97316');

  const [showTopLogo, setShowTopLogo] = useState(true);
  const [topLogo, setTopLogo] = useState('/images/moph_logo.png');
  const [topLogoWidth, setTopLogoWidth] = useState(55);
  const [topLogoHeight, setTopLogoHeight] = useState(55);

  const [showBottomLogo, setShowBottomLogo] = useState(true);
  const [bottomLogo, setBottomLogo] = useState('/images/chaam_hospital_logo.png');
  const [bottomLogoWidth, setBottomLogoWidth] = useState(120);
  const [bottomLogoHeight, setBottomLogoHeight] = useState(60);

  const [empImageWidth, setEmpImageWidth] = useState(130);
  const [empImageHeight, setEmpImageHeight] = useState(165);

  const [nameFontSize, setNameFontSize] = useState(17);
  const [posFontSize, setPosFontSize] = useState(15);
  const [textColor, setTextColor] = useState('#0f172a');
  const [showSignature, setShowSignature] = useState(true);
  const [empImageBorderRadius, setEmpImageBorderRadius] = useState(12);
  const [profileYOffset, setProfileYOffset] = useState(80);
  const [showWaveDecoration, setShowWaveDecoration] = useState(true);

  const [directorName, setDirectorName] = useState('นายแพทย์ประกิต เมฆชื่น');
  const [directorTitle, setDirectorTitle] = useState('ผู้อำนวยการโรงพยาบาลชะอำ');
  const [directorSignature, setDirectorSignature] = useState<string | null>(null);

  // Custom Employee Data Overrides
  const [cardOverrides, setCardOverrides] = useState<Record<string, { pos?: string, nameTH?: string, nameEN?: string }>>({});
  const [activeEditCardId, setActiveEditCardId] = useState<string | null>(null);
  const [cardBgImage, setCardBgImage] = useState<string | null>(null);

  const [expandedSection, setExpandedSection] = useState<string>('colors');

  const activeOverride = activeEditCardId ? cardOverrides[activeEditCardId] || {} : {};

  const setOverrideField = (field: 'pos' | 'nameTH' | 'nameEN', val: string) => {
    if (!activeEditCardId) return;
    setCardOverrides(prev => ({
      ...prev,
      [activeEditCardId]: { ... (prev[activeEditCardId] || {}), [field]: val }
    }));
  };

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('employeeIdCardSettings');
    if (saved) {
      try {
        const s = JSON.parse(saved);
        if (s.cardBgColor) setCardBgColor(s.cardBgColor);
        if (s.cardPrimaryColor) setCardPrimaryColor(s.cardPrimaryColor);
        if (s.cardSecondaryColor) setCardSecondaryColor(s.cardSecondaryColor);

        if (s.showTopLogo !== undefined) setShowTopLogo(s.showTopLogo);
        if (s.topLogo) setTopLogo(s.topLogo);
        if (s.topLogoWidth) setTopLogoWidth(s.topLogoWidth);
        if (s.topLogoHeight) setTopLogoHeight(s.topLogoHeight);

        if (s.showLogo !== undefined && s.showBottomLogo === undefined) setShowBottomLogo(s.showLogo); // Migration
        else if (s.showBottomLogo !== undefined) setShowBottomLogo(s.showBottomLogo);

        if (s.bottomLogo) setBottomLogo(s.bottomLogo);
        if (s.bottomLogoWidth) setBottomLogoWidth(s.bottomLogoWidth);
        if (s.bottomLogoHeight) setBottomLogoHeight(s.bottomLogoHeight);

        if (s.empImageWidth) setEmpImageWidth(s.empImageWidth);
        if (s.empImageHeight) setEmpImageHeight(s.empImageHeight);
        if (s.nameFontSize) setNameFontSize(s.nameFontSize);
        if (s.posFontSize) setPosFontSize(s.posFontSize);
        if (s.textColor) setTextColor(s.textColor);
        if (s.showSignature !== undefined) setShowSignature(s.showSignature);
        if (s.empImageBorderRadius) setEmpImageBorderRadius(s.empImageBorderRadius);
        if (s.profileYOffset) setProfileYOffset(s.profileYOffset);
        if (s.showWaveDecoration !== undefined) setShowWaveDecoration(s.showWaveDecoration);
        if (s.directorName) setDirectorName(s.directorName);
        if (s.directorTitle) setDirectorTitle(s.directorTitle);
        if (s.directorSignature) setDirectorSignature(s.directorSignature);
        if (s.cardBgImage) setCardBgImage(s.cardBgImage);
        if (s.cardOverrides) setCardOverrides(s.cardOverrides);
      } catch (err) { }
    }
  }, []);

  const saveSettings = () => {
    // Filter cardOverrides to only keep those with at least one field having a value
    const filteredOverrides = Object.fromEntries(
      Object.entries(cardOverrides).filter(([_, val]) => (val.pos || '').trim() || (val.nameTH || '').trim() || (val.nameEN || '').trim())
    );

    const s = {
      cardBgColor, cardPrimaryColor, cardSecondaryColor,
      showTopLogo, topLogo, topLogoWidth, topLogoHeight,
      showBottomLogo, bottomLogo, bottomLogoWidth, bottomLogoHeight,
      empImageWidth, empImageHeight, nameFontSize, posFontSize, textColor, showSignature,
      empImageBorderRadius, profileYOffset, showWaveDecoration, directorName, directorTitle,
      directorSignature, cardBgImage, cardOverrides: filteredOverrides
    };
    localStorage.setItem('employeeIdCardSettings', JSON.stringify(s));
    Swal.fire({ title: 'บันทึกสำเร็จ', text: 'บันทึกการตั้งค่าเรียบร้อยแล้ว', icon: 'success', timer: 1500, showConfirmButton: false });
  };

  const handleTopLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTopLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDirectorSignature(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBottomLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Auto-select first card for editing when modal opens
  useEffect(() => {
    if (showIdCard) {
      if (isBulkPrinting && selectedIds.length > 0) {
        setActiveEditCardId(selectedIds[0]);
      } else if (!isBulkPrinting && selectedEmpForCard) {
        setActiveEditCardId(selectedEmpForCard.emp_id);
      }
    } else {
      setActiveEditCardId(null);
    }
  }, [showIdCard, isBulkPrinting, selectedIds, selectedEmpForCard]);


  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: 'Employee_ID_Card',
  });

  const handleResetPassword = async (emp: Employee) => {
    const result = await Swal.fire({
      title: 'ยืนยันการรีเซ็ตรหัสผ่าน',
      text: `คุณต้องการรีเซ็ตรหัสผ่านและส่งอีเมลแจ้ง ${emp.first_name_th} ${emp.last_name_th} ใช่หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#3085d6'
    });
    if (!result.isConfirmed) return;

    Swal.fire({ title: 'กำลังดำเนินการ...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      const res = await fetch(`/api/employees/${emp.emp_id}/reset-password`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        Swal.fire('สำเร็จ', data.message, 'success');
      } else {
        Swal.fire(' เกิดข้อผิดพลาด', data.error, 'error');
      }
    } catch (err) {
      Swal.fire(' เกิดข้อผิดพลาด', 'ข้อผิดพลาดในการเชื่อมต่อ', 'error');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

      let headerRowIndex = 0;
      const ref = firstSheet['!ref'];
      if (ref) {
        const range = XLSX.utils.decode_range(ref);
        for (let R = range.s.r; R <= Math.min(range.e.r, 5); ++R) {
          let foundHeader = false;
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ c: C, r: R });
            const cell = firstSheet[cellAddress];
            if (cell && cell.v && (
              String(cell.v).includes('ชื่อ-สกุล') ||
              String(cell.v).includes('ชื่อ') ||
              String(cell.v).includes('ลำดับ') ||
              String(cell.v).includes('ตำแหน่ง')
            )) {
              headerRowIndex = R;
              foundHeader = true;
              break;
            }
          }
          if (foundHeader) break;
        }
      }

      let defaultDivision = '';
      if (headerRowIndex > 0 && ref) {
        const range = XLSX.utils.decode_range(ref);
        for (let R = range.s.r; R < headerRowIndex; ++R) {
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ c: C, r: R });
            const cell = firstSheet[cellAddress];
            if (cell && cell.v && String(cell.v).includes('กลุ่มงาน')) {
              defaultDivision = String(cell.v).replace(/^\d+[\.\s\-]+/, '').trim();
              break;
            }
          }
          if (defaultDivision) break;
        }
      }

      const rawJsonData = XLSX.utils.sheet_to_json(firstSheet, { range: headerRowIndex }) as any[];

      if (rawJsonData.length === 0) {
        Swal.fire('แจ้งเตือน', 'ไม่พบข้อมูลในไฟล์ Excel หรือไฟล์ว่างเปล่า', 'warning');
        return;
      }

      // Clean up headers (trim whitespace and invisible characters)
      const jsonData = rawJsonData.map(row => {
        const cleanRow: any = {};
        Object.keys(row).forEach(k => {
          const cleanKey = k.replace(/^\ufeff/g, '').trim(); // Remove BOM and trim
          const val = row[k];
          cleanRow[cleanKey] = typeof val === 'string' ? val.trim() : val;
        });
        return cleanRow;
      });

      // Map Thai headers from our normal export template
      const mappedData = jsonData.map((row, index) => {
        // Fix matching when names have extra spaces
        const division = row['กลุ่มงาน']?.toString().trim() || '';
        const deptName = row['แผนก']?.toString().trim() || '';
        const dept = departments.find(d =>
          (division && d.division?.trim() === division && d.dept_name.trim() === deptName) ||
          (!division && d.dept_name.trim() === deptName) ||
          d.dept_id === deptName
        );

        const posName = row['ตำแหน่ง']?.toString().trim() || '';
        const pos = positions.find(p => p.pos_name.trim() === posName || p.pos_id === posName);

        const parseDate = (dStr: any) => {
          if (!dStr) return null;
          const str = String(dStr).replace(/^="/, '').replace(/"$/, '').trim();
          if (!str) return null;

          // 1. Excel serial date
          if (/^\d{5}(\.\d+)?$/.test(str)) {
            const serial = parseFloat(str);
            const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
            return date.toISOString().split('T')[0];
          }

          // 2. Standard YYYY-MM-DD
          if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
            return str;
          }

          // 3. Formats with /
          const partsSlash = str.split('/');
          if (partsSlash.length === 3) {
            const p0 = partsSlash[0].padStart(2, '0');
            const p1 = partsSlash[1].padStart(2, '0');
            let p2 = parseInt(partsSlash[2]);
            if (p2 < 2400) {
              if (p2 < 100) p2 += (p2 > 50 ? 1900 : 2000);
            } else {
              p2 -= 543;
            }
            return `${p2}-${p1}-${p0}`;
          }

          // 4. Robust parsing for string dates
          const cleanStr = str.replace(/[\s\-]+/g, ' ').trim();
          const match = cleanStr.match(/^(\d{1,2})\s+([a-zA-Zก-ฮ\.]+)\s*(\d{2,4})$/);

          if (match) {
            const day = match[1].padStart(2, '0');
            const month = match[2];
            const year = match[3];

            const monthMap: { [key: string]: string } = {
              'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06',
              'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12',
              'ม.ค': '01', 'ก.พ': '02', 'มี.ค': '03', 'เม.ย': '04', 'พ.ค': '05', 'มิ.ย': '06',
              'ก.ค': '07', 'ส.ค': '08', 'ก.ย': '09', 'ต.ค': '10', 'พ.ย': '11', 'ธ.ค': '12',
              'มกราคม': '01', 'กุมภาพันธ์': '02', 'มีนาคม': '03', 'เมษายน': '04', 'พฤษภาคม': '05', 'มิถุนายน': '06',
              'กรกฎาคม': '07', 'สิงหาคม': '08', 'กันยายน': '09', 'ตุลาคม': '10', 'พฤศจิกายน': '11', 'ธันวาคม': '12'
            };

            let monthNum = '01';
            for (const [key, val] of Object.entries(monthMap)) {
              if (month.toLowerCase().startsWith(key.toLowerCase())) {
                monthNum = val;
                break;
              }
            }

            let yearNum = parseInt(year);
            if (yearNum < 100) {
              yearNum += 2500 - 543;
            } else if (yearNum < 2400) {
              // 4 digit AD
            } else {
              yearNum -= 543;
            }

            return `${yearNum}-${monthNum}-${day}`;
          }

          const simpleParts = cleanStr.split(/[^\d\wก-ฮ\.]+/).filter(Boolean);
          if (simpleParts.length === 3) {
            const day = simpleParts[0].padStart(2, '0');
            const month = simpleParts[1];
            const year = simpleParts[2];

            const monthMap: { [key: string]: string } = {
              'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06',
              'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12',
              'ม.ค': '01', 'ก.พ': '02', 'มี.ค': '03', 'เม.ย': '04', 'พ.ค': '05', 'มิ.ย': '06',
              'ก.ค': '07', 'ส.ค': '08', 'ก.ย': '09', 'ต.ค': '10', 'พ.ย': '11', 'ธ.ค': '12',
            };
            let monthNum = '01';
            for (const [key, val] of Object.entries(monthMap)) {
              if (month.toLowerCase().startsWith(key.toLowerCase())) {
                monthNum = val;
                break;
              }
            }

            let yearNum = parseInt(year);
            if (yearNum < 100) yearNum += 2500 - 543;
            else if (yearNum < 2400) { }
            else yearNum -= 543;

            return `${yearNum}-${monthNum}-${day}`;
          }

          return str;
        };

        const addrNo = row['ที่อยู่-เลขที่'] || '';
        const addrMoo = row['ที่อยู่-หมู่ที่'] || '';
        const addrVillage = row['ที่อยู่-หมู่บ้าน/อาคาร'] || '';
        const addrSoi = row['ที่อยู่-ซอย'] || '';
        const addrRoad = row['ที่อยู่-ถนน'] || '';
        const addrProvince = row['ที่อยู่-จังหวัด'] || '';
        const addrDistrict = row['ที่อยู่-อำเภอ/เขต'] || '';
        const addrSubdistrict = row['ที่อยู่-ตำบล/แขวง'] || '';
        const addrZipcode = row['ที่อยู่-รหัสไปรษณีย์'] || '';

        const addrParts = [];
        if (addrNo) addrParts.push(`เลขที่ ${addrNo}`);
        if (addrMoo) addrParts.push(`หมู่ ${addrMoo}`);
        if (addrVillage) addrParts.push(`${addrVillage}`);
        if (addrSoi) addrParts.push(`ซอย ${addrSoi}`);
        if (addrRoad) addrParts.push(`ถนน ${addrRoad}`);
        if (addrSubdistrict) addrParts.push(`ตำบล/แขวง ${addrSubdistrict}`);
        if (addrDistrict) addrParts.push(`อำเภอ/เขต ${addrDistrict}`);
        if (addrProvince) addrParts.push(`จังหวัด ${addrProvince}`);
        if (addrZipcode) addrParts.push(`${addrZipcode}`);
        const fullAddress = addrParts.join(' ') || row['ที่อยู่'] || '';

        return {
          emp_id: row['รหัสพนักงาน'] || row['emp_id'] || '',
          prefix: row['คำนำหน้า'] || row['prefix'] || '',
          citizen_id: row['รหัสบัตรประชาชน'] || row['บัตรประชาชน'] || row['citizen_id'] || '',
          first_name_th: row['ชื่อ'] || row['first_name_th'] || row['ชื่อ-สกุล'] || row['ชื่อสกุล'] || row['ชื่อ สกุล'] || '',
          last_name_th: row['นามสกุล'] || row['last_name_th'] || '',
          nickname: row['ชื่อเล่น'] || row['nickname'] || '',
          phone: row['เบอร์โทรศัพท์'] || row['phone'] || '',
          email: row['อีเมล'] || row['email'] || '',
          birth_date: parseDate(row['วัน/เดือน/ปีเกิด'] || row['วันเดือนปีเกิด'] || row['birth_date']),
          gender: row['เพศ'] || row['gender'] || '',
          address: fullAddress,
          position_no: row['เลขประจำตำแหน่ง'] || row['position_no'] || '',
          start_date: parseDate(row['วันที่เริ่มงาน'] || row['start_date']),
          admission_date: parseDate(row['วันที่บรรจุ'] || row['admission_date']),
          retirement_date: parseDate(row['วันที่เกษียณ'] || row['retirement_date']),
          emp_type: row['ประเภทการจ้างงาน'] || row['ประเภทพนักงาน'] || row['สถานะ'] || 'พนักงานราชการ',
          status: (() => {
            // ดึงค่าจากทุกคอลัมน์มารวมกันเพื่อค้นหา Keywords (เพราะบางทีคุณหมอพิมพ์ไว้นอกคอลัมน์ที่กำหนด)
            const allValues = Object.values(row).map(v => String(v || '').trim()).join(' ').toLowerCase();

            if (allValues.includes('ศึกษา')) return 'ลาศึกษา';
            if (allValues.includes('เกษียณ') || allValues.includes('60')) return 'เกษียณอายุ 60 ปีขึ้นไป';
            if (allValues.includes('ลาออก') || allValues.includes('resigned') || allValues.includes('พ้นสภาพ')) return 'ลาออก/พ้นสภาพ';
            if (allValues.includes('ทดลองงาน')) return 'ทดลองงาน';
            if (allValues.includes('ให้ออก')) return 'ให้ออก';
            if (allValues.includes('หยุดปฏิบัติงาน') || allValues.includes('พักงาน')) return 'หยุดปฏิบัติงาน';
            return 'ทำงานปกติ';
          })(),
          role: row['สิทธิ์ผู้ใช้งาน'] || 'User',
          working_at: (() => {
            const w = String(row['ปฏิบัติงานที่'] || row['working_at'] || '').trim();
            const lowerW = w.toLowerCase();
            // ถ้าเป็นคำสั่งสถานะ ไม่ต้องเอามาใส่ในช่องที่ทำงาน
            if (lowerW.includes('ศึกษา') || lowerW.includes('เกษียณ') || lowerW.includes('60') || lowerW.includes('ลาออก') || lowerW.includes('พ้นสภาพ') || lowerW.includes('ทดลองงาน') || lowerW.includes('ให้ออก') || lowerW.includes('หยุด') || lowerW.includes('พักงาน')) return '';
            return w;
          })(),
          dept_id: dept ? dept.dept_id : (row['แผนก']?.toString().trim() || null),
          pos_id: pos ? pos.pos_id : (row['ตำแหน่ง']?.toString().trim() || row['ตำแหน่ง / ระดับ']?.toString().trim() || null),
          division: row['กลุ่มงาน']?.toString().trim() || defaultDivision,
          licenses: (row['ชื่อใบประกอบวิชาชีพ'] || row['เลขที่ใบประกอบวิชาชีพ']) ? [{
            license_name: row['ชื่อใบประกอบวิชาชีพ'] || '',
            license_type: row['ประเภทวิชาชีพ'] || '',
            license_no: row['เลขที่ใบประกอบวิชาชีพ'] || '',
            issue_date: parseDate(row['วันที่ออกบัตร']),
            expire_date: parseDate(row['วันหมดอายุ']),
            status: 'ปกติ'
          }] : []
        };
      }).filter(r => r.emp_id || r.first_name_th); // Filter out empty rows often generated by excel

      // Simple validation for the first row to ensure they used correct headers
      const firstRow = mappedData[0];
      if (!firstRow || !firstRow.first_name_th) {
        Swal.fire('ข้อผิดพลาด', 'ตรวจสอบพบว่าหัวคอลัมน์ในไฟล์ Excel ไม่ตรงกับรูปแบบที่ระบบต้องการครับ (ต้องมี ชื่อ, แผนก, ตำแหน่ง)', 'error');
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const res = await fetch('/api/employees/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mappedData)
      });
      const resData = await res.json();
      if (res.ok) {
        if (resData.successCount === 0 && resData.errorCount > 0) {
          Swal.fire({
            title: 'นำเข้าล้มเหลว!',
            html: `
              <div style="margin-bottom: 12px;">ไม่สามารถนำเข้าข้อมูลได้เลย</div>
              <div style="margin-bottom: 16px;">ผิดพลาด: <b>${resData.errorCount}</b> รายการ</div>
              <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin: 0 24px; color: #dc2626; font-size: 13px; text-align: center; align-items: center; max-height: 200px; overflow-y: auto; box-sizing: border-box; display: flex; flex-direction: column; gap: 6px;">
                ${resData.errors?.map((err: string) => `<div>• ${err}</div>`).join('') || ''}
              </div>
            `,
            icon: 'error'
          });
        } else if (resData.errorCount > 0 && resData.successCount > 0) {
          Swal.fire({
            title: 'นำเข้าสำเร็จบางส่วน',
            html: `
              <div style="margin-bottom: 8px;">เพิ่มพนักงานใหม่: <b>${resData.insertCount || 0}</b> รายการ</div>
              <div style="margin-bottom: 8px;">อัปเดตข้อมูลเดิม: <b>${resData.updateCount || 0}</b> รายการ</div>
              <div style="margin-bottom: 16px;">ผิดพลาด: <b>${resData.errorCount}</b> รายการ</div>
              <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 16px; margin: 0 24px; color: #d97706; font-size: 13px; text-align: center; align-items: center; max-height: 200px; overflow-y: auto; box-sizing: border-box; display: flex; flex-direction: column; gap: 6px;">
                ${resData.errors?.map((err: string) => `<div>• ${err}</div>`).join('') || ''}
              </div>
            `,
            icon: 'warning'
          });
          loadEmployees();
        } else {
          Swal.fire({
            title: 'นำเข้าสำเร็จสมบูรณ์!',
            html: `
              <div style="margin-bottom: 8px;">เพิ่มพนักงานใหม่: <b>${resData.insertCount || 0}</b> คน</div>
              <div>อัปเดตข้อมูลพนักงานเดิม: <b>${resData.updateCount || 0}</b> คน</div>
            `,
            icon: 'success'
          });
          loadEmployees();
        }
      } else {
        Swal.fire('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการรัน API: ' + resData.error, 'error');
      }
    } catch (err: any) {
      Swal.fire('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการอ่านไฟล์เอ็กเซล: ' + err.message, 'error');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setSearch(q);
  }, [searchParams]);

  useEffect(() => {
    loadEmployees();
    loadDepartments();
    loadPositions();
  }, [loadEmployees, loadDepartments, loadPositions]);

  const getDeptName = (id: string) => {
    const dept = departments.find(d => String(d.dept_id) === String(id));
    if (!dept) return id || '-';
    return `${dept.division} > ${dept.dept_name}`;
  };
  const getPosName = (id: string) => positions.find(p => p.pos_id === id)?.pos_name || id;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterDiv, filterGrp, filterPos, filterStatus, filterLicense]);

  const filteredData = useMemo(() => {
    return employees.filter(e => {
      // ซ่อน Admin account เมื่อมีการ filter กลุ่มงาน/แผนก/ตำแหน่ง
      const isAdminAccount = e.role === 'Admin' || e.role === 'Super Admin';
      if (isAdminAccount && (filterDiv !== 'all' || filterGrp !== 'all' || filterPos !== 'all')) return false;

      const firstName = (e.first_name_th || '').toLowerCase();
      const lastName = (e.last_name_th || '').toLowerCase();
      const empId = (e.emp_id || '').toLowerCase();
      const s = search.toLowerCase();

      const matchSearch = search.length === 1
        ? (firstName.startsWith(s) || lastName.startsWith(s) || empId.startsWith(s))
        : `${firstName} ${lastName} ${empId}`.includes(s);

      const dept = departments.find(d => String(d.dept_id) === String(e.dept_id));
      const matchDept = (filterDiv === 'all' || dept?.division === filterDiv) &&
        (filterGrp === 'all' || dept?.dept_name === filterGrp);
      const matchPos = filterPos === 'all' || String(e.pos_id) === String(filterPos);
      const matchStatus = filterStatus === 'all' || e.status === filterStatus;

      const primaryStatus = e.license_status;
      const matchLicense = filterLicense === 'all' || primaryStatus === filterLicense || (!primaryStatus && filterLicense === 'None');

      if (e.status === 'ลาออก/พ้นสภาพ' || e.status === 'Resigned') return false;

      return matchSearch && matchDept && matchPos && matchStatus && matchLicense;
    });
  }, [employees, search, filterDiv, filterGrp, filterPos, filterStatus, filterLicense, departments]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const openAdd = () => {
    setFormData({ ...EMPTY_FORM, emp_id: '', licenses: [{ status: 'Active' }] });
    setIsEditing(false);
    setViewMode(false);
    setShowForm(true);
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(currentData.map(emp => emp.emp_id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectRow = (emp_id: string) => {
    setSelectedIds(prev =>
      prev.includes(emp_id) ? prev.filter(id => id !== emp_id) : [...prev, emp_id]
    );
  };

  const handleBulkPrint = () => {
    setIsBulkPrinting(true);
    setShowIdCard(true);
  };

  const openEdit = (emp: Employee) => {
    setFormData({ ...emp, citizen_id: emp.citizen_id || '', licenses: emp.licenses || [] });
    setIsEditing(true);
    setViewMode(false);
    setShowForm(true);
  };

  const openView = (emp: Employee) => {
    router.push(`/profile?emp_id=${emp.emp_id}`);
  };

  const handleSaveWrapper = async (fd: FormData, editing: boolean, empId?: string) => {
    let res: { success: boolean, message?: string };
    if (editing) {
      if (!empId) return { success: false, message: 'Employee ID is missing for editing.' };
      res = await editEmployee(empId, fd);
    } else {
      res = await addEmployee(fd);
    }

    if (res.success) {
      setShowForm(false);
      Swal.fire({ title: 'สำเร็จ!', text: res.message || (editing ? 'แก้ไขข้อมูลสำเร็จ' : 'เพิ่มพนักงานสำเร็จ'), icon: 'success', timer: 1500, showConfirmButton: false });
      loadEmployees();
    } else {
      Swal.fire('ข้อผิดพลาด', res.message || 'บันทึกไม่สำเร็จ', 'error');
    }
    return res;
  };

  const handleDelete = async (emp_id: string) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ',
      text: 'ยืนยันลบข้อมูลพนักงาน ระบบจะไม่สามารถกู้คืนได้?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบข้อมูล',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444'
    });
    if (!result.isConfirmed) return;

    await removeEmployee(emp_id);
    Swal.fire({ title: 'ลบสำเร็จ', text: 'ข้อมูลพนักงานถูกลบออกจากระบบแล้ว', icon: 'success', timer: 1500, showConfirmButton: false });
  };



  const downloadBlankTemplate = () => {
    const headers = [
      'คำนำหน้า', 'รหัสบัตรประชาชน', 'ชื่อ', 'นามสกุล', 'ชื่อเล่น',
      'เบอร์โทรศัพท์', 'อีเมล', 'วัน/เดือน/ปีเกิด', 'เพศ',
      'ที่อยู่-เลขที่', 'ที่อยู่-หมู่ที่', 'ที่อยู่-หมู่บ้าน/อาคาร', 'ที่อยู่-ซอย', 'ที่อยู่-ถนน',
      'ที่อยู่-จังหวัด', 'ที่อยู่-อำเภอ/เขต', 'ที่อยู่-ตำบล/แขวง', 'ที่อยู่-รหัสไปรษณีย์',
      'เลขประจำตำแหน่ง', 'วันที่เริ่มงาน', 'วันที่บรรจุ', 'วันที่เกษียณ',
      'ประเภทการจ้างงาน', 'สถานะพนักงาน', 'สิทธิ์ผู้ใช้งาน', 'กลุ่มงาน', 'แผนก', 'ตำแหน่ง', 'ปฏิบัติงานที่',
      'ชื่อใบประกอบวิชาชีพ', 'ประเภทวิชาชีพ', 'เลขที่ใบประกอบวิชาชีพ', 'วันที่ออกบัตร', 'วันหมดอายุ'
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([headers]);

    for (const cell in worksheet) {
      if (cell[0] === '!') continue;
      worksheet[cell].t = 's';
    }

    const max_widths = headers.map((h) => {
      return { wch: Math.min(Math.max(h.length + 4, 12), 40) };
    });
    worksheet['!cols'] = max_widths;

    const divisions = Array.from(new Set(departments.map(d => String(d.division || '').trim()).filter(Boolean)));
    const maxRows = Math.max(divisions.length, departments.length, positions.length, 10, 10);

    const optionsMatrix = [
      ['กลุ่มงาน', 'แผนก', 'ตำแหน่ง', 'ประเภทการจ้างงาน', 'สถานะพนักงาน']
    ];

    const types = [
      'ข้าราชการ', 'ลูกจ้างประจำ', 'พนักงานราชการ',
      'พนักงานกระทรวงสาธารณสุข', 'ลูกจ้างรายเดือน', 'ลูกจ้างรายวัน',
      'ลูกจ้างเหมาบริการ', 'ลูกจ้างแบ่งเปอร์เซนต์',
      'ลูกจ้างชั่วคราวที่อายุ 60 ปี', 'นักศึกษาฝึกงาน'
    ];

    const statuses = [
      'ทำงานปกติ', 'ทดลองงาน', 'ลาศึกษา / ศึกษาต่อ', 'หยุดปฏิบัติงาน',
      'เกษียณ (อายุ 60)', 'ให้ออก'
    ];

    for (let i = 0; i < maxRows; i++) {
      optionsMatrix.push([
        divisions[i] || '',
        departments[i]?.dept_name || '',
        positions[i]?.pos_name || '',
        types[i] || '',
        statuses[i] || ''
      ]);
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");

    const optionsSheet = XLSX.utils.aoa_to_sheet(optionsMatrix);
    XLSX.utils.book_append_sheet(workbook, optionsSheet, "ตัวเลือก");

    XLSX.writeFile(workbook, 'import_template.xlsx');
  };

  const exportToCSV = () => {
    // 1. สร้างฟังก์ชัน formatDate เพื่อบังคับรูปแบบเป็น dd/mm/yyyy
    const formatDate = (dateStr: any) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear() + 543; // ปีพ.ศ.
      return `${day}/${month}/${year}`;
    };

    const headers = [
      'คำนำหน้า', 'รหัสบัตรประชาชน', 'ชื่อ', 'นามสกุล', 'ชื่อเล่น',
      'เบอร์โทรศัพท์', 'อีเมล', 'วัน/เดือน/ปีเกิด', 'เพศ',
      'ที่อยู่-เลขที่', 'ที่อยู่-หมู่ที่', 'ที่อยู่-หมู่บ้าน/อาคาร', 'ที่อยู่-ซอย', 'ที่อยู่-ถนน',
      'ที่อยู่-จังหวัด', 'ที่อยู่-อำเภอ/เขต', 'ที่อยู่-ตำบล/แขวง', 'ที่อยู่-รหัสไปรษณีย์',
      'เลขประจำตำแหน่ง', 'วันที่เริ่มงาน', 'วันที่บรรจุ', 'วันที่เกษียณ',
      'ประเภทการจ้างงาน', 'สถานะพนักงาน', 'สิทธิ์ผู้ใช้งาน', 'กลุ่มงาน', 'แผนก', 'ตำแหน่ง', 'ปฏิบัติงานที่',
      'ชื่อใบประกอบวิชาชีพ', 'ประเภทวิชาชีพ', 'เลขที่ใบประกอบวิชาชีพ', 'วันที่ออกบัตร', 'วันหมดอายุ'
    ];

    const rows = filteredData.map(e => {
      const primaryLicense = e.licenses && e.licenses.length > 0 ? e.licenses[0] : {};

      const rowData = [
        e.prefix || '',
        e.citizen_id || '',
        e.first_name_th || '',
        e.last_name_th || '',
        e.nickname || '',
        e.phone || '',
        e.email || '',
        formatDate(e.birth_date),
        e.gender || '',
        e.addr_no || '',
        e.addr_moo || '',
        e.addr_village || '',
        e.addr_soi || '',
        e.addr_road || '',
        e.addr_province || '',
        e.addr_district || '',
        e.addr_subdistrict || '',
        e.addr_zipcode || '',
        e.position_no || '',
        formatDate(e.start_date),
        formatDate(e.admission_date),
        formatDate(e.retirement_date),
        e.emp_type || '',
        e.status || '',
        e.role || 'User',
        (() => {
          const dept = departments.find(d => String(d.dept_id) === String(e.dept_id));
          return dept ? dept.division : '-';
        })(),
        (() => {
          const dept = departments.find(d => String(d.dept_id) === String(e.dept_id));
          return dept ? dept.dept_name : '-';
        })(),
        getPosName(e.pos_id) || '',
        e.working_at || '',
        primaryLicense.license_name || '',
        primaryLicense.license_type || '',
        primaryLicense.license_no || '',
        formatDate(primaryLicense.issue_date),
        formatDate(primaryLicense.expire_date)
      ];
      return rowData;
    });

    const dataMatrix = [
      headers,
      ...rows
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(dataMatrix);

    // Force all cells to String type to prevent scientific notation formatting on phone/id cards
    for (const cell in worksheet) {
      if (cell[0] === '!') continue;
      worksheet[cell].t = 's';
    }

    // Auto-fit columns beautifully
    const max_widths = headers.map((h, i) => {
      let max_len = h.length;
      rows.forEach(r => {
        const val = String(r[i] || '');
        if (val.length > max_len) max_len = val.length;
      });
      return { wch: Math.min(Math.max(max_len + 4, 12), 40) };
    });
    worksheet['!cols'] = max_widths;

    const divisions = Array.from(new Set(departments.map(d => String(d.division || '').trim()).filter(Boolean)));

    const maxRows = Math.max(
      divisions.length,
      departments.length,
      positions.length,
      10, // types
      10  // statuses
    );

    const optionsMatrix = [
      ['กลุ่มงาน', 'แผนก', 'ตำแหน่ง', 'ประเภทการจ้างงาน', 'สถานะพนักงาน']
    ];

    const types = [
      'ข้าราชการ', 'ลูกจ้างประจำ', 'พนักงานราชการ',
      'พนักงานกระทรวงสาธารณสุข', 'ลูกจ้างรายเดือน', 'ลูกจ้างรายวัน',
      'ลูกจ้างเหมาบริการ', 'ลูกจ้างแบ่งเปอร์เซนต์',
      'ลูกจ้างชั่วคราวที่อายุ 60 ปี', 'นักศึกษาฝึกงาน'
    ];

    const statuses = [
      'ทำงานปกติ', 'ทดลองงาน', 'ลาศึกษา / ศึกษาต่อ', 'หยุดปฏิบัติงาน',
      'เกษียณ (อายุ 60)', 'ให้ออก'
    ];

    for (let i = 0; i < maxRows; i++) {
      optionsMatrix.push([
        divisions[i] || '',
        departments[i]?.dept_name || '',
        positions[i]?.pos_name || '',
        types[i] || '',
        statuses[i] || ''
      ]);
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");

    const optionsSheet = XLSX.utils.aoa_to_sheet(optionsMatrix);
    XLSX.utils.book_append_sheet(workbook, optionsSheet, "ตัวเลือก");

    XLSX.writeFile(workbook, 'employees_list.xlsx');
  };

  if (user && !isAdmin) {
    return null;
  }

  return (
    <AppLayout>
      <div style={{ padding: '24px', minHeight: 'calc(100vh - 65px)' }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">ทะเบียนบุคลากร</h1>
            <div className="page-subtitle">จัดการรายชื่อและข้อมูลส่วนตัวของพนักงานทั้งหมดในระบบ</div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {isAdmin && (
              <>
                <button className="btn-outline hover-glow" onClick={() => router.push('/org-structure')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc' }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5" /></svg>
                  ข้อมูลแผนก
                </button>
                <button className="btn-outline hover-glow" onClick={downloadBlankTemplate} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc' }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  ฟอร์มเปล่าสำหรับอัปโหลด
                </button>
                <button className="btn-outline hover-glow" onClick={exportToCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  ดาวน์โหลด EXCEL
                </button>
                <button className="btn-outline hover-glow" onClick={() => fileInputRef.current?.click()} disabled={isImporting} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0' }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  {isImporting ? 'กำลังนำเข้า...' : 'นำเข้าจาก EXCEL'}
                </button>
                <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
                <button className="btn-primary" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  เพิ่มพนักงานใหม่
                </button>
                {selectedIds.length > 0 && (
                  <button className="btn-primary" onClick={handleBulkPrint} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0ea5e9' }}>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    พิมพ์บัตร {selectedIds.length} รายการ
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
          </div>
        </div>

        <div className="glass-card" style={{ marginBottom: '24px' }}>
          <div className="filter-bar">
            <div className="search-input-wrap" style={{ flex: '1 1 300px' }}>
              <svg className="search-icon" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" placeholder="ค้นหาชื่อพนักงาน..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <select className="form-select" style={{ width: 'auto', minWidth: '140px' }} value={filterDiv} onChange={e => { setFilterDiv(e.target.value); setFilterGrp('all'); }}>
                <option value="all">ทุกกลุ่มงาน</option>
                {Array.from(new Set(departments.map(d => String(d.division || '').trim())))
                  .filter(Boolean)
                  .sort((a, b) => {
                    const numA = parseInt(a.match(/^\d+/)?.[0] || '999');
                    const numB = parseInt(b.match(/^\d+/)?.[0] || '999');
                    return numA - numB || a.localeCompare(b, 'th');
                  })
                  .map(div => (
                    <option key={div as string} value={div as string}>{div as string}</option>
                  ))}
              </select>

              <select className="form-select" style={{ width: 'auto', minWidth: '140px' }} value={filterGrp} onChange={e => setFilterGrp(e.target.value)}>
                <option value="all">ทุกแผนก</option>
                {Array.from(new Set(
                  departments
                    .filter(d => filterDiv === 'all' || String(d.division || '').trim() === filterDiv)
                    .map(d => String(d.dept_name || '').trim())
                ))
                  .filter(Boolean)
                  .filter(grp => {
                    const g = grp.replace(/เเ/g, 'แ');
                    if (g === '-') return false;
                    if (g === 'กลุ่มการแพทย์' || g === 'กลุ่มงานการแพทย์' || g === 'การแพทย์') return false;
                    if (g === 'กลุ่มงานเทคนิคการแพทย์' || g === 'เทคนิคการแพทย์') return false;
                    if (g === 'กลุ่มงานเวชกรรมฟื้นฟู' || g === 'เวชกรรมฟื้นฟู') return false;
                    if (g === 'กลุ่มงานทันตกรรม' || g === 'ทันตกรรม') return false;
                    if (g === 'กลุ่มงานแพทย์แผนไทยและการแพทย์ทางเลือก' || g === 'แพทย์แผนไทยและการแพทย์ทางเลือก') return false;
                    if (g === 'กลุ่มงานเภสัชกรรมและคุ้มครองผู้บริโภค' || g === 'เภสัชกรรมและคุ้มครองผู้บริโภค') return false;
                    if (g === 'กลุ่มงานโภชนศาสตร์' || g === 'โภชนศาสตร์') return false;
                    if (g === 'กลุ่มงานรังสีวิทยา' || g === 'รังสีวิทยา') return false;
                    return true;
                  })
                  .sort((a, b) => a.localeCompare(b, 'th'))
                  .map(grp => (
                    <option key={grp as string} value={grp as string}>{grp as string}</option>
                  ))}
              </select>

            </div>
            {/* Custom Searchable Typeable Dropdown */}
            <div style={{ position: 'relative', width: 'auto', minWidth: '220px' }}>
              <input
                type="text"
                className="form-select"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '12px', fontSize: '14px', outline: 'none', background: 'white' }}
                placeholder="พิมพ์ค้นหาตำแหน่ง..."
                value={posSearch || (filterPos === 'all' ? '' : (positions.find(p => String(p.pos_id) === String(filterPos))?.pos_name || filterPos))}
                onFocus={() => setIsPosOpen(true)}
                onChange={(e) => {
                  const val = e.target.value;
                  setPosSearch(val);
                  setIsPosOpen(true);

                  const found = positions.find(p => p.pos_name === val);
                  if (found) {
                    setFilterPos(found.pos_id);
                  } else if (val === '') {
                    setFilterPos('all');
                  }
                }}
              />
              {isPosOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.15)', zIndex: 100, padding: '6px' }}>
                  <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }} className="custom-scrollbar">
                    <div
                      onClick={() => { setFilterPos('all'); setPosSearch(''); setIsPosOpen(false); }}
                      style={{ padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', background: filterPos === 'all' ? '#eff6ff' : 'transparent', color: filterPos === 'all' ? '#1d4ed8' : '#334155', fontWeight: filterPos === 'all' ? 700 : 500, fontSize: '13px' }}
                      onMouseEnter={e => { if (filterPos !== 'all') e.currentTarget.style.background = '#f1f5f9'; }}
                      onMouseLeave={e => { if (filterPos !== 'all') e.currentTarget.style.background = 'transparent'; }}
                    >
                      ทุกตำแหน่ง
                    </div>
                    {positions
                      .filter(p => !posSearch || p.pos_name.toLowerCase().includes(posSearch.toLowerCase()))
                      .map((p: any) => (
                        <div
                          key={p.pos_id}
                          onClick={() => { setFilterPos(p.pos_id); setPosSearch(p.pos_name); setIsPosOpen(false); }}
                          style={{ padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', background: String(filterPos) === String(p.pos_id) ? '#eff6ff' : 'transparent', color: String(filterPos) === String(p.pos_id) ? '#1d4ed8' : '#334155', fontWeight: String(filterPos) === String(p.pos_id) ? 700 : 500, fontSize: '13px' }}
                          onMouseEnter={e => { if (String(filterPos) !== String(p.pos_id)) e.currentTarget.style.background = '#f1f5f9'; }}
                          onMouseLeave={e => { if (String(filterPos) !== String(p.pos_id)) e.currentTarget.style.background = 'transparent'; }}
                        >
                          {p.pos_name}
                        </div>
                      ))}
                  </div>
                </div>
              )}
              {/* Clicking outside closes popup */}
              {isPosOpen && <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, zIndex: 90 }} onClick={() => setIsPosOpen(false)} />}
            </div>
            <select className="form-select" style={{ width: 'auto', minWidth: '150px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">สถานะการทำงาน: ทั้งหมด</option>
              <option value="ทำงานปกติ">ทำงานปกติ (Active)</option>
              <option value="ทดลองงาน">ทดลองงาน</option>
              <option value="ลาศึกษา">ลาศึกษา / ศึกษาต่อ</option>
              <option value="หยุดปฏิบัติงาน">หยุดปฏิบัติงาน</option>
              <option value="เกษียณอายุ 60 ปีขึ้นไป">เกษียณ (อายุ 60)</option>
              <option value="ให้ออก">ให้ออก</option>
            </select>
            <select className="form-select" style={{ width: 'auto', minWidth: '160px' }} value={filterLicense} onChange={e => setFilterLicense(e.target.value)}>
              <option value="all">ใบประกอบฯ: ทั้งหมด</option>
              <option value="Active">ปกติ (Active)</option>
              <option value="Expiring Soon">ใกล้หมดอายุ</option>
              <option value="Expired">หมดอายุแล้ว</option>
              <option value="Suspended">พักใช้/ระงับ</option>
            </select>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'center', width: '40px' }}>
                    <input type="checkbox" checked={selectedIds.length === currentData.length && currentData.length > 0} onChange={toggleSelectAll} style={{ width: '16px', height: '16px', accentColor: '#3b82f6', cursor: 'pointer' }} />
                  </th>
                  <th style={{ textAlign: 'center', width: '60px' }}>ลำดับ</th>
                  <th style={{ textAlign: 'center', width: '80px' }}>รูปภาพ</th>
                  <th style={{ textAlign: 'center' }}>เลขประจำตำแหน่ง</th>
                  <th style={{ textAlign: 'center' }}>เลขบัตรประชาชน</th>
                  <th>ชื่อ-สกุลพนักงาน</th>
                  <th>ชื่อเล่น</th>
                  <th>ตำแหน่ง</th>
                  <th>กลุ่มงาน</th>
                  <th>แผนก</th>
                  <th style={{ textAlign: 'center', width: '130px' }}>สถานะ</th>
                  <th style={{ textAlign: 'center', width: '120px' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={11} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>กำลังโหลดข้อมูลพนักงาน...</td></tr>
                ) : currentData.length === 0 ? (
                  <tr><td colSpan={11} style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>ไม่มีข้อมูลพนักงานที่ตรงกับการค้นหา</td></tr>
                ) : (
                  currentData.map((emp, idx) => {
                    const dept = departments.find(d => String(d.dept_id) === String(emp.dept_id));
                    return (
                      <tr
                        key={emp.emp_id}
                        onClick={() => openView(emp)}
                        style={{ background: emp.license_status === 'Expired' ? '#fff5f5' : 'transparent', transition: 'all 0.2s', cursor: 'pointer' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = emp.license_status === 'Expired' ? '#fff5f5' : 'transparent'}
                      >
                        <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={selectedIds.includes(emp.emp_id)} onChange={() => toggleSelectRow(emp.emp_id)} style={{ width: '16px', height: '16px', accentColor: '#3b82f6', cursor: 'pointer' }} />
                        </td>
                        <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                          {((currentPage - 1) * itemsPerPage) + idx + 1}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ width: '48px', height: '48px', position: 'relative', borderRadius: '14px', background: '#f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                            {emp.image ? <Image fill src={`/uploads/${encodeURIComponent(emp.image)}`} alt="" style={{ objectFit: 'cover' }} unoptimized onError={(e: any) => { e.currentTarget.onerror = null; e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect fill="%23f1f5f9" width="24" height="24"/><path fill="%2394a3b8" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>'; }} /> : <svg width="24" height="24" viewBox="0 0 24 24" fill="#94a3b8" style={{ display: 'block' }}><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>}                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ padding: '4px 8px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'inline-block', fontWeight: 600, color: '#334155' }}>
                            {(() => {
                              const idVal = emp.position_no;
                              if (!idVal || idVal.trim() === '' || idVal.replace(/0/g, '') === '') return '-';
                              return idVal;
                            })()}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ color: '#64748b', fontFamily: 'monospace', fontWeight: 600 }}>
                            {(() => {
                              const cidVal = emp.citizen_id;
                              if (emp.role === 'Admin' || !cidVal || cidVal.trim() === '' || cidVal.replace(/0/g, '') === '') return '-';
                              return cidVal;
                            })()}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
                            {emp.prefix}{emp.first_name_th} {emp.last_name_th}
                            {(() => {
                              if (!emp.birth_date) return null;
                              const bDate = new Date(emp.birth_date);
                              if (isNaN(bDate.getTime())) return null;
                              const birthYear = bDate.getFullYear();
                              const currentYear = new Date().getFullYear();
                              if (birthYear + 60 !== currentYear) return null;
                              const month = bDate.getMonth();
                              if (month >= 9) {
                                return <span style={{ color: '#f97316', fontSize: '14px', fontWeight: 900, cursor: 'help' }} title="เกษียณปีถัดไปตามงบประมาณ">*</span>;
                              }
                              return null;
                            })()}
                            {emp.license_status === 'Expired' && <span className="badge badge-red" title="ใบประกอบวิชาชีพหมดอายุ">หมดอายุ</span>}
                          </div>
                        </td>
                        <td style={{ color: '#334155' }}>{emp.role === 'Admin' ? '-' : (emp.nickname || '-')}</td>
                        <td style={{ color: '#334155', fontWeight: 500 }}>{emp.role === 'Admin' ? '-' : (getPosName(emp.pos_id) || '-')}</td>
                        <td>{dept?.division || '-'}</td>
                        <td>{dept?.dept_name || '-'}</td>
                        <td style={{ textAlign: 'center' }}>
                          <StatusPicker emp={emp} isAdmin={isAdmin} editEmployee={editEmployee} />
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="action-btn-group" style={{ justifyContent: 'center' }}>
                            <button className="icon-btn hover-glow" onClick={() => { setIsBulkPrinting(false); setSelectedEmpForCard(emp); setShowIdCard(true); }} title="พิมพ์บัตรพนักงาน" style={{ color: '#0ea5e9', background: '#f0f9ff' }}>
                              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                            </button>
                            {isAdmin && (
                              <>
                                <button className="icon-btn hover-glow" onClick={() => handleResetPassword(emp)} title="ส่งอีเมลรีเซ็ตรหัสผ่าน" style={{ color: '#d97706', background: '#fefce8' }}>
                                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                                </button>
                                <button className="icon-btn hover-glow" onClick={() => openEdit(emp)} title="แก้ไขข้อมูล" style={{ color: '#3b82f6' }}>
                                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002-2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                                <button className="icon-btn hover-glow" onClick={() => handleDelete(emp.emp_id)} title="ลบข้อมูล" style={{ color: '#ef4444', background: '#fef2f2' }}>
                                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2-0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', padding: '10px 0' }}>
              <span style={{ fontSize: '14px', color: '#64748b' }}>แสดงรายการจากทั้งหมด {filteredData.length} รายการ (คน)</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  style={{ padding: '6px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  หน้าก่อน
                </button>
                <div style={{ background: '#afceecff', padding: '6px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val >= 1 && val <= totalPages) {
                        setCurrentPage(val);
                      }
                    }}
                    style={{ width: '45px', textAlign: 'center', border: 'none', background: 'transparent', fontWeight: 'bold' }}
                  />
                  <span>/ {totalPages}</span>
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  style={{ padding: '6px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                >
                  หน้าถัดไป
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Shared Full Functionality Edit/Add Modal */}
      <EmployeeFormModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        employee={formData}
        onSave={async (fd, editing) => await handleSaveWrapper(fd, editing, formData?.emp_id)}
        viewMode={viewMode}
        isProfileMode={false}
        departments={departments}
        positions={positions}
      />


      {/* ID Card Modal */}
      {showIdCard && (isBulkPrinting ? selectedIds.length > 0 : selectedEmpForCard) && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1100 }}>
          <div className="modal-box" style={{ background: '#ffffff', borderRadius: '24px', padding: '24px', width: '950px', maxWidth: '95vw', maxHeight: '95vh', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)' }}>

            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px', position: 'relative' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>{isBulkPrinting ? 'บัตรพนักงาน (จำนวนมาก)' : 'บัตรพนักงาน'}</h3>
              <button type="button" onClick={() => setShowIdCard(false)} style={{ position: 'absolute', right: 0, background: '#f8fafc', border: '1px solid #e2e8f0', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <div style={{ display: 'flex', gap: '24px', width: '100%', flex: 1, overflow: 'hidden' }}>
              {/* Left: Controls */}
              <div style={{ width: '320px', flexShrink: 0, background: '#f8fafc', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto', border: '1px solid #e2e8f0' }} className="custom-scrollbar">

                <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700, color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>⚙️ ปรับแต่งบัตร</h4>

                <button type="button" onClick={saveSettings} style={{ background: '#3b82f6', color: 'white', padding: '10px', borderRadius: '10px', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 4px 6px -1px rgba(59,130,246,0.3)' }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                  บันทึกการตั้งค่า
                </button>

                {/* Background & Colors */}
                <div style={{ background: 'white', padding: '12px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>🖼️ ภาพพื้นหลังการ์ด</label>
                  <input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setCardBgImage(reader.result as string);
                        setShowWaveDecoration(false);
                      };
                      reader.readAsDataURL(file);
                    }
                  }} style={{ fontSize: '12px', width: '100%', marginBottom: '6px' }} />
                  {cardBgImage && <button onClick={() => { setCardBgImage(null); setShowWaveDecoration(true); }} style={{ fontSize: '11px', color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>ล้างภาพพื้นหลัง</button>}
                </div>

                <div style={{ background: 'white', padding: '12px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>🎨 ชุดสี (พื้นหลัง / หลัก / รอง)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="color" title="สีพื้นหลัง" value={cardBgColor} onChange={(e) => setCardBgColor(e.target.value)} style={{ flex: 1, height: '36px', padding: '2px', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer' }} />
                    <input type="color" title="สีหลัก" value={cardPrimaryColor} onChange={(e) => setCardPrimaryColor(e.target.value)} style={{ flex: 1, height: '36px', padding: '2px', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer' }} />
                    <input type="color" title="สีรอง" value={cardSecondaryColor} onChange={(e) => setCardSecondaryColor(e.target.value)} style={{ flex: 1, height: '36px', padding: '2px', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer' }} />
                  </div>
                </div>

                <div style={{ background: 'white', padding: '12px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>🌊 ลายเส้น/คลื่นตกแต่ง</label>
                  <input type="checkbox" checked={showWaveDecoration} onChange={(e) => setShowWaveDecoration(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#3b82f6', cursor: 'pointer' }} />
                </div>

                {/* Logo 1 (Top Left) */}
                <div style={{ background: 'white', padding: '12px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>🏢 โลโก้ 1 (ซ้ายบน)</label>
                    <input type="checkbox" checked={showTopLogo} onChange={(e) => setShowTopLogo(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#3b82f6', cursor: 'pointer' }} />
                  </div>
                  <input type="file" accept="image/*" onChange={handleTopLogoUpload} style={{ fontSize: '12px', width: '100%', padding: '6px', border: '1px dashed #cbd5e1', borderRadius: '8px', background: '#f8fafc', marginBottom: '8px' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginBottom: '2px' }}><span>ความกว้าง</span><span>{topLogoWidth}px</span></div>
                  <input type="range" min="30" max="150" value={topLogoWidth} onChange={(e) => setTopLogoWidth(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#3b82f6', marginBottom: '6px' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginBottom: '2px' }}><span>ความสูง</span><span>{topLogoHeight}px</span></div>
                  <input type="range" min="30" max="150" value={topLogoHeight} onChange={(e) => setTopLogoHeight(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#3b82f6' }} />
                </div>

                {/* Logo 2 (Bottom Right) */}
                <div style={{ background: 'white', padding: '12px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>🏢 โลโก้ 2 (ขวาล่าง)</label>
                    <input type="checkbox" checked={showBottomLogo} onChange={(e) => setShowBottomLogo(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#3b82f6', cursor: 'pointer' }} />
                  </div>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ fontSize: '12px', width: '100%', padding: '6px', border: '1px dashed #cbd5e1', borderRadius: '8px', background: '#f8fafc', marginBottom: '8px' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginBottom: '2px' }}><span>ความกว้าง</span><span>{bottomLogoWidth}px</span></div>
                  <input type="range" min="40" max="250" value={bottomLogoWidth} onChange={(e) => setBottomLogoWidth(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#3b82f6', marginBottom: '6px' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginBottom: '2px' }}><span>ความสูง</span><span>{bottomLogoHeight}px</span></div>
                  <input type="range" min="20" max="200" value={bottomLogoHeight} onChange={(e) => setBottomLogoHeight(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#3b82f6' }} />
                </div>

                {/* Profile Adjustments */}
                <div style={{ background: 'white', padding: '12px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>👤 ความกว้างรูปพนักงาน:</span>
                    <span style={{ fontWeight: 700, color: '#16a34a' }}>{empImageWidth}px</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => setEmpImageWidth(prev => Math.max(80, prev - 5))} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                    <input type="range" min="80" max="250" value={empImageWidth} onChange={(e) => setEmpImageWidth(parseInt(e.target.value))} style={{ flex: 1, accentColor: '#16a34a' }} />
                    <button onClick={() => setEmpImageWidth(prev => Math.min(250, prev + 5))} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                  </div>
                </div>

                <div style={{ background: 'white', padding: '12px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>👤 ความสูงรูปพนักงาน:</span>
                    <span style={{ fontWeight: 700, color: '#16a34a' }}>{empImageHeight}px</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => setEmpImageHeight(prev => Math.max(100, prev - 5))} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                    <input type="range" min="100" max="300" value={empImageHeight} onChange={(e) => setEmpImageHeight(parseInt(e.target.value))} style={{ flex: 1, accentColor: '#16a34a' }} />
                    <button onClick={() => setEmpImageHeight(prev => Math.min(300, prev + 5))} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                  </div>
                </div>

                <div style={{ background: 'white', padding: '12px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>👤 ความโค้งมนรูป:</span>
                    <span style={{ fontWeight: 700, color: '#16a34a' }}>{empImageBorderRadius}px</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => setEmpImageBorderRadius(prev => Math.max(0, prev - 2))} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                    <input type="range" min="0" max="100" value={empImageBorderRadius} onChange={(e) => setEmpImageBorderRadius(parseInt(e.target.value))} style={{ flex: 1, accentColor: '#16a34a' }} />
                    <button onClick={() => setEmpImageBorderRadius(prev => Math.min(100, prev + 2))} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                  </div>
                </div>

                <div style={{ background: 'white', padding: '12px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>📍 ตำแหน่งแนวตั้งรูป:</span>
                    <span style={{ fontWeight: 700, color: '#16a34a' }}>{profileYOffset}px</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => setProfileYOffset(prev => Math.max(20, prev - 5))} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                    <input type="range" min="20" max="150" value={profileYOffset} onChange={(e) => setProfileYOffset(parseInt(e.target.value))} style={{ flex: 1, accentColor: '#16a34a' }} />
                    <button onClick={() => setProfileYOffset(prev => Math.min(150, prev + 5))} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                  </div>
                </div>

                {/* Text Adjustments */}
                <div style={{ background: 'white', padding: '12px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>🔤 สีตัวอักษรหลัก</label>
                  <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} style={{ width: '100%', height: '36px', padding: '2px', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer' }} />
                </div>

                <div style={{ background: 'white', padding: '12px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>📏 ขนาดชื่อ:</span>
                    <span style={{ fontWeight: 700, color: '#7c3aed' }}>{nameFontSize}px</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => setNameFontSize(prev => Math.max(10, prev - 1))} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                    <input type="range" min="10" max="30" value={nameFontSize} onChange={(e) => setNameFontSize(parseInt(e.target.value))} style={{ flex: 1, accentColor: '#7c3aed' }} />
                    <button onClick={() => setNameFontSize(prev => Math.min(30, prev + 1))} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                  </div>
                </div>

                <div style={{ background: 'white', padding: '12px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>📏 ขนาดตำแหน่ง:</span>
                    <span style={{ fontWeight: 700, color: '#7c3aed' }}>{posFontSize}px</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => setPosFontSize(prev => Math.max(10, prev - 1))} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                    <input type="range" min="10" max="30" value={posFontSize} onChange={(e) => setPosFontSize(parseInt(e.target.value))} style={{ flex: 1, accentColor: '#7c3aed' }} />
                    <button onClick={() => setPosFontSize(prev => Math.min(30, prev + 1))} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                  </div>
                </div>

                {/* Overrides */}
                <div style={{ background: 'white', padding: '12px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h5 style={{ margin: '0', fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>📝 ข้อมูลพนักงาน (เขียนทับ)</h5>
                  {isBulkPrinting && <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>* คลิกเลือกบัตรในตัวอย่างเพื่อแก้ไขรายคน</p>}

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>ตำแหน่ง:</label>
                    <input type="text" placeholder="เว้นว่างเพื่อใช้ค่าจากระบบ" value={activeOverride.pos || ''} onChange={(e) => setOverrideField('pos', e.target.value)} style={{ width: '100%', padding: '6px 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>ชื่อ-สกุล (ไทย):</label>
                    <input type="text" placeholder="เว้นว่างเพื่อใช้ค่าจากระบบ" value={activeOverride.nameTH || ''} onChange={(e) => setOverrideField('nameTH', e.target.value)} style={{ width: '100%', padding: '6px 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>ชื่อ-สกุล (อังกฤษ):</label>
                    <input type="text" placeholder="เว้นว่างเพื่อใช้ค่าจากระบบ" value={activeOverride.nameEN || ''} onChange={(e) => setOverrideField('nameEN', e.target.value)} style={{ width: '100%', padding: '6px 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                  </div>
                </div>

                {/* Director */}
                <div style={{ background: 'white', padding: '12px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h5 style={{ margin: '0', fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>👤 ข้อมูลลงนาม</h5>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <label style={{ fontSize: '11px', color: '#64748b' }}>แสดง</label>
                      <input type="checkbox" checked={showSignature} onChange={(e) => setShowSignature(e.target.checked)} style={{ width: '14px', height: '14px', accentColor: '#3b82f6', cursor: 'pointer' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>ชื่อ-นามสกุล:</label>
                    <input type="text" value={directorName} onChange={(e) => setDirectorName(e.target.value)} style={{ width: '100%', padding: '6px 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>ตำแหน่ง:</label>
                    <input type="text" value={directorTitle} onChange={(e) => setDirectorTitle(e.target.value)} style={{ width: '100%', padding: '6px 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>อัปโหลดลายเซ็นใหม่:</label>
                    <input type="file" accept="image/*" onChange={handleSignatureUpload} style={{ fontSize: '11px', width: '100%', padding: '6px', border: '1px dashed #cbd5e1', borderRadius: '8px', background: '#f8fafc' }} />
                  </div>
                </div>
              </div>



              {/* Right: Card Preview */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'block', background: '#f1f5f9', borderRadius: '16px', padding: '24px' }} className="custom-scrollbar">
                {(() => {
                  const cardsToPrint = isBulkPrinting ? currentData.filter(emp => selectedIds.includes(emp.emp_id)) : [selectedEmpForCard!];
                  const chunks = isBulkPrinting ? cardsToPrint.reduce((acc, item, i) => {
                    const chunkIndex = Math.floor(i / 9);
                    if (!acc[chunkIndex]) acc[chunkIndex] = [];
                    acc[chunkIndex].push(item);
                    return acc;
                  }, [] as Employee[][]) : [cardsToPrint];

                  return (
                    <>
                      <style type="text/css">
                        {`
                            @media print {
                              @page { size: A4; margin: 0; }
                              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; }
                              body > * { display: none !important; }
                              .modal-overlay, .modal-overlay * { display: none !important; }
                              .modal-overlay { display: block !important; position: static !important; background: white !important; padding: 0 !important; width: 210mm !important; }
                              .modal-box { display: block !important; position: static !important; width: 210mm !important; padding: 0 !important; box-shadow: none !important; }
                              .modal-box > div { display: none !important; }
                              .modal-box > div:has(.print-area-container) { display: block !important; }
                              .print-area-container, .print-area-container * { display: block !important; }
                              .print-page { 
                                display: grid !important;
                                grid-template-columns: repeat(3, 1fr) !important;
                                grid-template-rows: repeat(3, 1fr) !important;
                                gap: 0 !important;
                                padding: 0 !important;
                                page-break-after: always; 
                                width: 210mm !important;
                                height: 295mm !important;
                                background: white !important;
                                box-sizing: border-box !important;
                                overflow: hidden !important;
                                margin: 0 !important;
                              }
                              .card-to-print {
                                width: 70mm !important;
                                height: 99mm !important;
                                transform: none !important;
                                box-shadow: none !important;
                                border: 0.1mm solid #eee !important;
                                margin: 0 !important;
                              }
                              /* Hide sidebar and UI */
                              [style*="width: 320px"], .btn-primary, .btn-outline, h3, h4, .active-card-border { display: none !important; }
                            }
                          `}
                      </style>
                      <div ref={printRef} className="print-area-container" style={{ background: 'transparent' }}>
                        {chunks.map((chunk, pageIndex) => (
                          <div
                            key={pageIndex}
                            className={isBulkPrinting ? "print-page" : ""}
                            style={isBulkPrinting ? {
                              display: 'grid',
                              gridTemplateColumns: 'repeat(3, 1fr)',
                              gridTemplateRows: 'repeat(3, 1fr)',
                              gap: '0',
                              padding: '0',
                              background: 'white',
                              width: '210mm',
                              height: '297mm',
                              margin: '0',
                              justifyItems: 'center',
                              alignItems: 'center',
                              boxSizing: 'border-box',
                              overflow: 'hidden'
                            } : {
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '40px',
                              padding: '16px',
                              background: 'transparent',
                              width: 'auto',
                              margin: '0 auto',
                              alignItems: 'center'
                            }}
                          >
                            {chunk.map((empForCard) => {
                              const overrides = cardOverrides[empForCard.emp_id] || {};
                              const isActive = activeEditCardId === empForCard.emp_id || (!activeEditCardId && !isBulkPrinting);

                              return (
                                <div
                                  key={empForCard.emp_id}
                                  onClick={() => setActiveEditCardId(empForCard.emp_id)}
                                  style={{
                                    display: 'flex',
                                    gap: '24px',
                                    flexWrap: 'wrap',
                                    justifyContent: 'center',
                                    pageBreakInside: 'avoid',
                                    margin: isBulkPrinting ? '0' : '0 auto',
                                    width: isBulkPrinting ? '70mm' : '100%',
                                    height: isBulkPrinting ? '99mm' : 'auto',
                                    cursor: 'pointer',
                                    position: 'relative'
                                  }}
                                >
                                  {isActive && isBulkPrinting && (
                                    <div className="active-card-border" style={{ position: 'absolute', top: '-10px', left: '-10px', right: '-10px', bottom: '-10px', border: '3px solid #3b82f6', borderRadius: '20px', pointerEvents: 'none', zIndex: 10 }}></div>
                                  )}

                                  {/* --- Front Card --- */}
                                  <div id={`card-${empForCard.emp_id}`} className="card-to-print" style={{ width: isBulkPrinting ? '70mm' : '300px', height: isBulkPrinting ? '99mm' : '480px', background: cardBgColor, backgroundImage: cardBgImage ? `url(${cardBgImage})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: isActive ? '0 10px 25px -5px rgba(59, 130, 246, 0.3)' : '0 10px 25px -5px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden', color: '#1e293b', flexShrink: 0, transformOrigin: 'top left' }}>
                                    {/* Background SVG Waves & Dots */}
                                    {showWaveDecoration && !cardBgImage && (
                                      <svg width={isBulkPrinting ? "264" : "300"} height={isBulkPrinting ? "374" : "480"} viewBox="0 0 300 480" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
                                        <defs>
                                          <pattern id={`dots-${empForCard.emp_id}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                            <circle cx="10" cy="10" r="2.5" fill="#cbd5e1" opacity="0.6" />
                                          </pattern>
                                          <linearGradient id={`fade-grad-${empForCard.emp_id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stop-color="white" stop-opacity="1" />
                                            <stop offset="80%" stop-color="white" stop-opacity="0.1" />
                                          </linearGradient>
                                          <mask id={`dots-mask-${empForCard.emp_id}`}>
                                            <rect width="300" height="480" fill={`url(#fade-grad-${empForCard.emp_id})`} />
                                          </mask>
                                        </defs>

                                        {/* Full Background Dots with Mask for subtle fade */}
                                        <rect width="300" height="480" fill={`url(#dots-${empForCard.emp_id})`} mask={`url(#dots-mask-${empForCard.emp_id})`} />

                                        {/* Top Right Waves */}
                                        <path d="M 100 0 Q 220 120 300 240 L 300 0 Z" fill={cardSecondaryColor} />
                                        <path d="M 180 0 Q 250 80 300 150 L 300 0 Z" fill={cardPrimaryColor} />

                                        {/* Bottom Left Waves */}
                                        <path d="M 0 280 Q 120 380 250 480 L 0 480 Z" fill={cardSecondaryColor} />
                                        <path d="M 0 380 Q 80 430 150 480 L 0 480 Z" fill={cardPrimaryColor} />
                                      </svg>
                                    )}


                                    {/* MOPH Logo (Top Left) */}
                                    {showTopLogo && (
                                      <div style={{ position: 'absolute', top: isBulkPrinting ? '10px' : '15px', left: isBulkPrinting ? '10px' : '15px', zIndex: 2 }}>
                                        <Image src={topLogo} width={isBulkPrinting ? Math.round(topLogoWidth * 0.8) : topLogoWidth} height={isBulkPrinting ? Math.round(topLogoHeight * 0.8) : topLogoHeight} style={{ objectFit: 'contain' }} alt="Top Logo" />
                                      </div>
                                    )}

                                    {/* Photo */}
                                    <div style={{ position: 'absolute', top: `${isBulkPrinting ? Math.round(profileYOffset * 0.8) : profileYOffset}px`, left: '50%', transform: 'translateX(-50%)', width: `${isBulkPrinting ? Math.round(empImageWidth * 0.8) : empImageWidth}px`, height: `${isBulkPrinting ? Math.round(empImageHeight * 0.8) : empImageHeight}px`, border: '1px solid #cbd5e1', background: '#f8fafc', zIndex: 2, overflow: 'hidden', borderRadius: `${empImageBorderRadius}px` }}>
                                      <Image fill src={empForCard.image ? `/uploads/${encodeURIComponent(empForCard.image)}` : `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 32 32"><rect fill="%23f8fafc" x="-4" y="-4" width="32" height="32"/><path fill="%2394a3b8" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`} alt="Employee" style={{ objectFit: 'cover', borderRadius: `${empImageBorderRadius}px` }} unoptimized onError={(e: any) => { e.currentTarget.onerror = null; e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 32 32"><rect fill="%23f8fafc" x="-4" y="-4" width="32" height="32"/><path fill="%2394a3b8" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>'; }} />
                                    </div>

                                    {/* Details */}
                                    <div style={{ position: 'absolute', top: `${(isBulkPrinting ? Math.round(profileYOffset * 0.8) + Math.round(empImageHeight * 0.8) : profileYOffset + empImageHeight) + 10}px`, left: '0', right: '0', textAlign: 'center', zIndex: 2, padding: isBulkPrinting ? '0 10px' : '0 20px', fontFamily: "'Sarabun', sans-serif" }}>
                                      {/* Position */}
                                      <div style={{ fontSize: `${isBulkPrinting ? Math.round(posFontSize * 0.85) : posFontSize}px`, fontWeight: 'bold', color: textColor, marginBottom: '4px' }}>
                                        {overrides.pos || getPosName(empForCard.pos_id) || 'พนักงาน'}
                                      </div>
                                      {/* Name TH */}
                                      <div style={{ fontSize: `${isBulkPrinting ? Math.round(nameFontSize * 0.85) : nameFontSize}px`, fontWeight: 'bold', color: textColor, marginBottom: '2px' }}>
                                        {overrides.nameTH || `${empForCard.prefix || ''}${empForCard.first_name_th} ${empForCard.last_name_th}`}
                                      </div>
                                      {/* Name EN */}
                                      <div style={{ fontSize: `${isBulkPrinting ? 11 : 14}px`, color: '#475569', fontStyle: 'italic', marginBottom: '12px' }}>
                                        {overrides.nameEN || (empForCard.first_name_th === 'อิงครัตน์' ? 'Engkarat Chodsatidpokin' : `${empForCard.first_name_th} ${empForCard.last_name_th}`)}
                                      </div>

                                      {/* Signature Area */}
                                      {showSignature && (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: isBulkPrinting ? '2px' : '5px' }}>
                                          {directorSignature ? (
                                            <img src={directorSignature} style={{ width: isBulkPrinting ? '50px' : '60px', height: isBulkPrinting ? '25px' : '30px', objectFit: 'contain', display: 'block', margin: '0 auto' }} alt="Director Signature" />
                                          ) : (
                                            <svg width={isBulkPrinting ? "50" : "60"} height={isBulkPrinting ? "25" : "30"} viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', margin: '0 auto' }}>
                                              <path d="M 20 40 Q 30 10 50 30 T 80 20" stroke={cardPrimaryColor} strokeWidth="2" strokeLinecap="round" fill="none" />
                                            </svg>
                                          )}
                                          <div style={{ fontSize: `${isBulkPrinting ? 10 : 11}px`, fontWeight: 'bold', color: '#1e293b', marginTop: '2px' }}>
                                            {directorName}
                                          </div>
                                          <div style={{ fontSize: `${isBulkPrinting ? 9 : 10}px`, color: '#64748b' }}>
                                            {directorTitle}
                                          </div>

                                        </div>
                                      )}
                                    </div>


                                    {/* Hospital Logo (Bottom Right) */}
                                    {showBottomLogo && (
                                      <div style={{ position: 'absolute', bottom: isBulkPrinting ? '10px' : '15px', right: isBulkPrinting ? '10px' : '15px', zIndex: 2 }}>
                                        <Image src={bottomLogo} width={isBulkPrinting ? Math.round(bottomLogoWidth * 0.8) : bottomLogoWidth} height={isBulkPrinting ? Math.round(bottomLogoHeight * 0.8) : bottomLogoHeight} style={{ objectFit: 'contain' }} alt="Bottom Logo" />
                                      </div>
                                    )}

                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '24px' }}>
              <button
                className="btn-outline"
                onClick={async () => {
                  const targetId = activeEditCardId || (isBulkPrinting ? selectedIds[0] : selectedEmpForCard?.emp_id);
                  if (!targetId) return;
                  const element = document.getElementById(`card-${targetId}`);
                  if (element) {
                    // Temporarily remove transform for high quality capture
                    const originalTransform = element.style.transform;
                    element.style.transform = 'none';
                    const canvas = await html2canvas(element, { useCORS: true, scale: 2 });
                    element.style.transform = originalTransform;

                    const link = document.createElement('a');
                    link.download = `ID_Card_${targetId}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                  }
                }}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                บันทึกภาพบัตร (PNG)
              </button>

              <button
                className="btn-primary"
                onClick={() => handlePrint()}
                style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: '#0f172a', color: 'white', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                พิมพ์บัตร {isBulkPrinting ? `A4 (${selectedIds.length} ใบ)` : ''}
              </button>
            </div>
          </div>
        </div>
      )}

    </AppLayout>
  );
}

function StatusPicker({ emp, isAdmin, editEmployee }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(emp.status);
  const containerRef = useRef<HTMLDivElement>(null);
  const [openUp, setOpenUp] = useState(false);

  useEffect(() => {
    if (isOpen) setSelectedStatus(emp.status);
  }, [isOpen, emp.status]);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUp(spaceBelow < 250);
    }
  }, [isOpen]);

  const statusOptions = [
    { value: 'ทำงานปกติ', label: 'ทำงานปกติ', color: '#16a34a', bg: '#dcfce7' },
    { value: 'ทดลองงาน', label: 'ทดลองงาน', color: '#a16207', bg: '#fef9c3' },
    { value: 'ลาศึกษา', label: 'ลาศึกษา / ศึกษาต่อ', color: '#2563eb', bg: '#dbeafe' },
    { value: 'หยุดปฏิบัติงาน', label: 'หยุดปฏิบัติงาน', color: '#64748b', bg: '#f1f5f9' },
    { value: 'เกษียณอายุ 60 ปีขึ้นไป', label: 'เกษียณ (อายุ 60)', color: '#7c3aed', bg: '#ede9fe' },
    { value: 'ให้ออก', label: 'ให้ออก', color: '#7f1d1d', bg: '#fecaca' },
  ];

  const statusMapping: { [key: string]: string } = {
    'Active': 'ทำงานปกติ',
    'Probation': 'ทดลองงาน',
    'Study Leave': 'ลาศึกษา',
    'Inactive': 'หยุดปฏิบัติงาน',
    'Retired': 'เกษียณอายุ 60 ปีขึ้นไป',
    'Resigned': 'ลาออก/พ้นสภาพ',
    'Terminated': 'ให้ออก'
  };

  const currentStatus = statusOptions.find(o => o.value === emp.status || o.label === emp.status) ||
    statusOptions.find(o => o.value === statusMapping[emp.status]) ||
    statusOptions[0];

  const handleUpdate = async (newStatus: string) => {
    if (newStatus === emp.status) {
      setIsOpen(false);
      return;
    }
    const formData = new FormData();
    formData.append('status', newStatus);
    const res = await editEmployee(emp.emp_id, formData);
    if (res.success) {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <div
        onClick={(e) => {
          if (!isAdmin) return;
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        style={{
          padding: '4px 12px',
          borderRadius: '10px',
          fontSize: '12px',
          fontWeight: 700,
          background: currentStatus.bg,
          color: currentStatus.color,
          cursor: isAdmin ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.2s',
          border: '1px solid transparent'
        }}
      >
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: currentStatus.color }} />
        {currentStatus.label}
        {isAdmin && (
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>

      {isOpen && isAdmin && (
        <div
          style={{
            position: 'absolute',
            [openUp ? 'bottom' : 'top']: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
            zIndex: 10,
            padding: '6px',
            minWidth: '160px',
            border: '1px solid #f1f5f9'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {statusOptions.map(opt => (
            <div
              key={opt.value}
              onClick={() => setSelectedStatus(opt.value)}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: opt.value === selectedStatus ? opt.color : '#475569',
                background: opt.value === selectedStatus ? opt.bg : 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (opt.value !== selectedStatus) e.currentTarget.style.background = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                if (opt.value !== selectedStatus) e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: opt.color }} />
              {opt.label}
            </div>
          ))}
          <button
            type="button"
            onClick={() => handleUpdate(selectedStatus)}
            style={{
              width: '100%',
              marginTop: '8px',
              padding: '8px',
              background: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '12px',
              boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.4)'
            }}
          >
            บันทึกสถานะ
          </button>
        </div>
      )}
    </div>
  );
}

export default function EmployeesPage() {
  return (
    <Suspense fallback={<AppLayout><div style={{ textAlign: 'center', padding: '50px' }}>กำลังโหลด...</div></AppLayout>}>
      <EmployeesContent />
    </Suspense>
  );
}