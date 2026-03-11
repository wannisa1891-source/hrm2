//วันที่-ข้อความต้อนรับ-ช่องค้นหา-รูปโปรไฟล์
export default function DashboardHeader({ today }: { today: string }) {
  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>

      <div>
        <span style={{
          background: 'white',
          padding: '4px 14px',
          borderRadius: 100,
          fontSize: 12,
          fontWeight: 700,
          color: '#4A5644',
          boxShadow: '0 2px 10px rgba(0,0,0,0.06)'
        }}>
          {today}
        </span>

        <h1 style={{ fontSize: 32, fontWeight: 700, margin: '10px 0 4px' }}>
          สวัสดีครับ, <span style={{ color: '#4A5644' }}>Hospital HRM</span>
        </h1>

        <p style={{ color: '#666', margin: 0 }}>
          มาดูความเคลื่อนไหวของบุคลากรวันนี้กันครับ
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

        <div style={{
          background: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid white',
          padding: '10px 18px',
          borderRadius: 15,
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <span>🔍</span>

          <input
            type="text"
            placeholder="ค้นหาข้อมูล..."
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              width: 180,
              fontFamily: 'Sarabun, sans-serif',
              fontSize: 14
            }}
          />
        </div>

        <div style={{ position: 'relative', width: 45, height: 45 }}>

          <div style={{
            width: 45,
            height: 45,
            background: '#4A5644',
            color: 'white',
            borderRadius: 15,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700
          }}>
            W
          </div>

          <div style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: 12,
            height: 12,
            background: '#4cd137',
            border: '2px solid #f0f2f5',
            borderRadius: '50%'
          }} />

        </div>

      </div>
    </header>
  )
}