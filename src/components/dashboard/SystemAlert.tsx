import Link from "next/link";

export default function SystemAlert() {
    return (
        <div
            className="animate-pulse-btn hover-glow shadow-md"
            style={{
                background: "linear-gradient(135deg,#3F4B3B,#2c3330)",
                color: "white",
                borderRadius: 24,
                padding: "32px 28px",
                position: "relative",
                overflow: "hidden",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
            }}
        >
            <div className="animate-pulse-bg" style={{
                position: "absolute",
                top: "-50%",
                right: "-20%",
                width: "150px",
                height: "150px",
                background: "radial-gradient(circle, rgba(210,166,121,0.4) 0%, rgba(0,0,0,0) 70%)",
                borderRadius: "50%",
                filter: "blur(20px)"
            }}></div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span
                    style={{
                        fontSize: 11,
                        background: "rgba(239, 68, 68, 0.15)",
                        color: "#fca5a5",
                        padding: "6px 12px",
                        borderRadius: 20,
                        fontWeight: 800,
                        letterSpacing: "1px",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                    }}
                >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 6px #ef4444' }}></span>
                    SYSTEM ALERT
                </span>
            </div>

            <h3 style={{ margin: 0, fontSize: 24, fontWeight: 800, zIndex: 1, letterSpacing: "-0.5px" }}>ใบประกอบวิชาชีพ</h3>

            <p style={{ opacity: 0.85, fontSize: 15, zIndex: 1, marginTop: 8, marginBottom: 24, lineHeight: 1.5, color: "#cbd5e1" }}>
                พบข้อมูลผู้ปฏิบัติงานที่มีใบประกอบวิชาชีพกำลังจะหมดอายุภายใน <strong style={{ color: "#d2a679" }}>30 วัน</strong>
            </p>

            <Link href="/license" style={{ zIndex: 1, textDecoration: 'none', display: 'block', marginTop: 'auto' }}>
                <button
                    className="hover-lift"
                    style={{
                        width: '100%',
                        background: "linear-gradient(135deg, #d2a679, #b98a58)",
                        color: "white",
                        border: "none",
                        padding: "14px 20px",
                        borderRadius: 14,
                        cursor: "pointer",
                        fontWeight: 700,
                        fontSize: 15,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 8,
                        boxShadow: "0 4px 14px rgba(210, 166, 121, 0.4)",
                        transition: "all 0.3s ease"
                    }}
                >
                    ตรวจสอบทันที
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: 18, height: 18 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </Link>
        </div>
    );
}