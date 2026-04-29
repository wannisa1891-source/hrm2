import Link from 'next/link'

export default function QuickActions() {
    return (
        <div className="glass-card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 20 }}>📌</span>
                <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e2433' }}>เมนูลัด</h3>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Quick Actions</div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link href="/employees/add" className="quick-btn hover-glow" style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12, textDecoration: 'none', color: '#374151', fontSize: 14, fontWeight: 500
                }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                    เพิ่มพนักงานใหม่
                </Link>

                <Link href="/transfers" className="quick-btn hover-glow" style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12, textDecoration: 'none', color: '#374151', fontSize: 14, fontWeight: 500
                }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                    </div>
                    ทำเรื่องย้ายแผนก
                </Link>
            </div>
        </div>
    )
}
