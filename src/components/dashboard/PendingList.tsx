//รายการรออนุมัติ
import Link from "next/link"

export default function PendingList({
    transfersCount = 0,
    leavesCount = 0
}: { transfersCount?: number, leavesCount?: number }) {
    return (
        <div
            style={{
                background: "white",
                borderRadius: 20,
                padding: 24,
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)"
            }}
        >
            <h3 style={{ marginBottom: 20 }}>รายการรออนุมัติ</h3>

            <Link
                href="/transfer"
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: 12,
                    marginBottom: 10,
                    background: "#f7f7f7",
                    borderRadius: 12,
                    textDecoration: "none",
                    color: "black"
                }}
            >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: 18, height: 18, color: '#666' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                    </svg>
                    คำขอย้ายแผนก
                </span>
                <span>{transfersCount} รายการ</span>
            </Link>

            <Link
                href="/leave"
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: 12,
                    background: "#f7f7f7",
                    borderRadius: 12,
                    textDecoration: "none",
                    color: "black"
                }}
            >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: 18, height: 18, color: '#666' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                    ใบลาพักร้อน
                </span>
                <span>{leavesCount} รายการ</span>
            </Link>
        </div>
    )
}