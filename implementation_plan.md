# Migration Plan: Vue + Express → Next.js (Full-Stack)

## เป้าหมาย

ย้ายระบบ HRM จาก Vue 3 (Vite) + Express.js แบบ 2 โปรเจกต์แยก มาเป็น **Next.js 14 (App Router)** โปรเจกต์เดียวที่รวม frontend และ backend API ไว้ด้วยกัน ใช้ MySQL เหมือนเดิม

## โครงสร้างใหม่

```
c:\xampp\htdocs\hrm2\hrm-nextjs\
├── app/
│   ├── layout.tsx              ← Layout หลัก + Sidebar
│   ├── page.tsx                ← redirect to login/dashboard
│   ├── login/page.tsx          ← หน้า Login
│   ├── dashboard/page.tsx      ← Dashboard
│   ├── employees/page.tsx      ← รายชื่อพนักงาน
│   ├── org-structure/page.tsx  ← ผังองค์กร
│   ├── transfer/page.tsx       ← การโยกย้าย
│   ├── leave/page.tsx          ← ระบบการลา
│   ├── schedule/page.tsx       ← ตารางเวร
│   ├── payroll/page.tsx        ← เงินเดือน
│   ├── license/page.tsx        ← ใบประกอบวิชาชีพ
│   └── api/
│       ├── employees/route.ts          ← GET, POST
│       ├── employees/[id]/route.ts     ← PUT
│       ├── employees/dept/[deptId]/route.ts
│       ├── staff-search/route.ts
│       ├── leaves/route.ts             ← GET, POST
│       ├── leaves/[id]/route.ts        ← PUT
│       ├── transfers/route.ts          ← POST
│       ├── departments/route.ts        ← GET
│       ├── positions/route.ts          ← GET
│       └── auth/login/route.ts         ← POST login
├── components/
│   ├── Sidebar.tsx
│   ├── Dashboard.tsx
│   ├── EmployeeList.tsx
│   ├── Transfer.tsx
│   ├── LeaveSystem.tsx
│   ├── Schedule.tsx
│   ├── Payroll.tsx
│   ├── License.tsx
│   ├── OrgStructure.tsx
│   └── AuthProvider.tsx        ← Context สำหรับ session
├── lib/
│   └── db.ts                   ← MySQL connection pool
├── public/
│   └── assets/ (รูปภาพจาก Vue)
└── package.json
```

## Proposed Changes

### Backend: Express → Next.js API Routes

แทนที่ [backend/server.js](file:///c:/xampp/htdocs/hrm2/backend/server.js) ด้วย Next.js Route Handlers ใน `app/api/`

- `lib/db.ts` — MySQL connection pool (ใช้ mysql2/promise)
- `app/api/employees/route.ts` — GET all employees, POST new employee (ใช้ multer/formidable)
- `app/api/employees/[id]/route.ts` — PUT update employee
- `app/api/employees/dept/[deptId]/route.ts` — GET by dept
- `app/api/staff-search/route.ts` — search employees
- `app/api/leaves/route.ts` — GET all leaves, POST new leave
- `app/api/leaves/[id]/route.ts` — PUT update leave status
- `app/api/transfers/route.ts` — POST new transfer
- `app/api/departments/route.ts` — GET all departments
- `app/api/positions/route.ts` — GET all positions
- `app/api/auth/login/route.ts` — POST login (simple credential check)

---

### Frontend: Vue → Next.js (React)

**Authentication & Session**
- ใช้ `localStorage` หรือ `Context API` เก็บ session แทน `ref(isLoggedIn)`
- `components/AuthProvider.tsx` — Context สำหรับ auth state

**Layout & Routing**
- `app/layout.tsx` — Layout หลัก พร้อม Sidebar (ต่างจาก Vue ที่ใช้ก้อนเดียวใน App.vue)
- ใช้ Next.js `useRouter` แทน `activeMenu` state ของ Vue

**Components (แปลง Vue → React)**
| Vue | Next.js |
|-----|---------|
| [LoginView.vue](file:///c:/xampp/htdocs/hrm2/frontend/src/components/Login/LoginView.vue) | `app/login/page.tsx` |
| [Sidebar_UI.vue](file:///c:/xampp/htdocs/hrm2/frontend/src/components/Sidebar/Sidebar_UI.vue) + [useSidebarLogic.js](file:///c:/xampp/htdocs/hrm2/frontend/src/components/Sidebar/useSidebarLogic.js) | `components/Sidebar.tsx` |
| [Dashboard.vue](file:///c:/xampp/htdocs/hrm2/frontend/src/components/Dashboard/Dashboard.vue) | `components/Dashboard.tsx` |
| [EmployeeList.vue](file:///c:/xampp/htdocs/hrm2/frontend/src/components/EmployeeList/EmployeeList.vue) + [Employee_UI.vue](file:///c:/xampp/htdocs/hrm2/frontend/src/components/EmployeeList/Employee_UI.vue) | `components/EmployeeList.tsx` |
| [Transfer.vue](file:///c:/xampp/htdocs/hrm2/frontend/src/components/Transfer/Transfer.vue) | `components/Transfer.tsx` |
| [Leave_System.vue](file:///c:/xampp/htdocs/hrm2/frontend/src/components/LeaveSystem/Leave_System.vue) + [Leave_UI.vue](file:///c:/xampp/htdocs/hrm2/frontend/src/components/LeaveSystem/Leave_UI.vue) | `components/LeaveSystem.tsx` |
| `Schedule.vue` | `components/Schedule.tsx` |
| `Payroll.vue` | `components/Payroll.tsx` |
| `License.vue` | `components/License.tsx` |
| `OrgStructure.vue` | `components/OrgStructure.tsx` |

**Styling**
- Port CSS จาก Vue components มาเป็น CSS Modules หรือ `globals.css`
- ใช้ Google Fonts (Sarabun) เหมือนเดิม

## User Review Required

> [!IMPORTANT]
> **โปรเจกต์ใหม่จะสร้างใน folder แยก**: `c:\xampp\htdocs\hrm2\hrm-nextjs\`
> โปรเจกต์ Vue และ Express เดิมจะ**ไม่ถูกลบ** แต่จะถูกแทนที่ด้วย Next.js
> หากต้องการให้สร้างในที่เดิมโดยลบของเดิมออก โปรดแจ้ง

> [!NOTE]
> **Login**: จะใช้ simple credential check เหมือนเดิม (admin/1234) ด้วย `localStorage` เก็บ session  
> ไม่ใช้ NextAuth เพื่อให้ง่ายและไม่ต้องเปลี่ยน Database

> [!NOTE]
> **File Upload**: ใช้ `formidable` หรือ built-in Next.js form handling แทน multer  
> รูปภาพพนักงานจะถูก serve จาก `/public/uploads/`

## Verification Plan

### Automated Checks
```bash
# รันที่ c:\xampp\htdocs\hrm2\hrm-nextjs\
npm run build   # ตรวจสอบไม่มี TypeScript/build error
npm run dev     # รัน dev server ที่ http://localhost:3000
```

### Manual Verification (ผ่าน Browser)
1. เปิด http://localhost:3000 → ควร redirect ไปหน้า Login
2. ใส่ username/password → ควรเข้าสู่ Dashboard
3. ทดสอบ Sidebar navigation ทุกเมนู
4. ทดสอบ เพิ่ม/แก้ไข/ลบ พนักงาน
5. ทดสอบ บันทึกใบลา / อนุมัติ
6. ทดสอบ บันทึกคำสั่งย้าย
