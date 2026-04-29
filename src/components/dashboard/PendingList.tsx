//รายการรออนุมัติ
import Link from "next/link"

export default function PendingList({
    transfersCount = 0
}: { transfersCount?: number }) {
    return (
        <div
            className="glass-card hover-glow"
            style={{
                background: "white",
                borderRadius: 20,
                padding: "24px 28px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column"
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b" }}>รายการรออนุมัติ</h3>
                { (transfersCount) > 0 && (
                    <span style={{ fontSize: 11, background: "#fee2e2", color: "#ef4444", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>
                        {transfersCount} งาน
                    </span>
                )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Link
                    href="/transfers"
                    className="hover-lift"
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 14px",
                        background: "#f8fafc",
                        border: "1px solid #f1f5f9",
                        borderRadius: 12,
                        textDecoration: "none",
                        color: "#334155",
                        transition: "all 0.2s"
                    }}
                >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500, fontSize: 13 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#4f46e5" }}>
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: 16, height: 16 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                            </svg>
                        </div>
                        คำขอย้ายแผนก
                    </span>
                    <span style={{ fontWeight: 700, fontSize: 13, color: transfersCount > 0 ? "#0f172a" : "#94a3b8" }}>
                        {transfersCount} <span style={{ fontSize: 12, fontWeight: 500, color: "#94a3b8" }}>รายการ</span>
                    </span>
                </Link>
            </div>
        </div>
    )
}