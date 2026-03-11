//รายการรออนุมัติ
import Link from "next/link"

export default function PendingList() {
    return (
        <div
            style={{
                background: "white",
                borderRadius: 20,
                padding: 24,
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)"
            }}
        >
            <h3 style={{ marginBottom: 20 }}>📌 รายการรออนุมัติ</h3>

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
                <span>📄 คำขอย้ายแผนก</span>
                <span>3 รายการ</span>
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
                <span>🏖️ ใบลาพักร้อน</span>
                <span>1 รายการ</span>
            </Link>
        </div>
    )
}