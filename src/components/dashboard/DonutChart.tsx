//กราฟวงกลม
export default function DonutChart() {
    return (
        <div
            style={{
                background: "white",
                borderRadius: 20,
                padding: 24,
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)"
            }}
        >
            <h3 style={{ marginBottom: 20 }}>สถิติวิชาชีพบุคลากร</h3>

            <div style={{ display: "flex", alignItems: "center", gap: 30 }}>

                {/* Donut */}
                <div style={{ position: "relative", width: 180 }}>
                    <svg viewBox="0 0 36 36">

                        {/* background */}
                        <path
                            fill="none"
                            stroke="#eee"
                            strokeWidth="3.8"
                            d="M18 2.0845
                 a 15.9155 15.9155 0 0 1 0 31.831
                 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />

                        {/* nurse */}
                        <path
                            fill="none"
                            stroke="#4A5644"
                            strokeWidth="3.8"
                            strokeDasharray="50,100"
                            d="M18 2.0845
                 a 15.9155 15.9155 0 0 1 0 31.831"
                        />

                        {/* doctor */}
                        <path
                            fill="none"
                            stroke="#C5A073"
                            strokeWidth="3.8"
                            strokeDasharray="10,100"
                            strokeDashoffset="-50"
                            d="M18 2.0845
                 a 15.9155 15.9155 0 0 1 0 31.831"
                        />

                    </svg>

                    <div
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%,-50%)",
                            fontWeight: 700,
                            fontSize: 20
                        }}
                    >
                        100%
                    </div>
                </div>

                {/* legend */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <span>🟢 พยาบาล 50%</span>
                    <span>🟡 แพทย์ 10%</span>
                    <span>⚪ อื่นๆ 40%</span>
                </div>

            </div>
        </div>
    )
}