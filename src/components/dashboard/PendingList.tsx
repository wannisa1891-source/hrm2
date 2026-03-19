//รายการรออนุมัติ
import Link from "next/link"

export default function PendingList({
    transfersCount = 0,
    leavesCount = 0
}: { transfersCount?: number, leavesCount?: number }) {
    return (
        <div
            className="glass-card hover-glow"
            style={{
                background: "white",
                borderRadius: 20,
                padding: "16px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
                width: "100%"
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b" }}>รายการรออนุมัติ</h3>
                { (transfersCount + leavesCount) > 0 && (
                    <span style={{ fontSize: 11, background: "#fee2e2", color: "#ef4444", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>
                        {transfersCount + leavesCount} งาน
                    </span>
                )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Link
                    href="/transfer"
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

                <Link
                    href="/leave"
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
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ffedd5", display: "flex", alignItems: "center", justifyContent: "center", color: "#ea580c" }}>
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: 16, height: 16 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                            </svg>
                        </div>
                        ใบลาพักร้อน
                    </span>
                    <span style={{ fontWeight: 700, fontSize: 13, color: leavesCount > 0 ? "#0f172a" : "#94a3b8" }}>
                        {leavesCount} <span style={{ fontSize: 12, fontWeight: 500, color: "#94a3b8" }}>รายการ</span>
                    </span>
                </Link>
            </div>
        </div>
    )
}