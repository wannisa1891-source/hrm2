import Link from "next/link";

export default function SystemAlert() {
    return (
        <div
            style={{
                background: "linear-gradient(135deg,#3F4B3B,#2c3330)",
                color: "white",
                borderRadius: 22,
                padding: 28,
                position: "relative",
                overflow: "hidden"
            }}
        >
            <span
                style={{
                    fontSize: 11,
                    background: "rgba(255,255,255,0.2)",
                    padding: "4px 10px",
                    borderRadius: 8
                }}
            >
                SYSTEM ALERT
            </span>

            <h3 style={{ marginTop: 14 }}>ใบประกอบวิชาชีพ</h3>

            <p style={{ opacity: 0.85, fontSize: 14 }}>
                พบข้อมูลใกล้หมดอายุใน 30 วัน
            </p>

            <Link href="/license">
                <button
                    style={{
                        marginTop: 18,
                        background: "#d2a679",
                        border: "none",
                        padding: "10px 18px",
                        borderRadius: 12,
                        cursor: "pointer",
                        fontWeight: 600
                    }}
                >
                    ตรวจสอบทันที
                </button>
            </Link>
        </div>
    );
}