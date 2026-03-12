//กราฟวงกลม
export default function DonutChart({ data = [] }: { data?: any[] }) {
    const total = data.reduce((acc, curr) => acc + curr.value, 0);
    let currentOffset = 0;

    return (
        <div
            className="glass-card hover-glow"
            style={{
                background: "white",
                borderRadius: 20,
                padding: "28px 32px",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 10px 30px rgba(0,0,0,0.04)"
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1e293b" }}>สถิติวิชาชีพบุคลากร</h3>
                <span style={{ fontSize: 13, color: "#64748b", background: "#f1f5f9", padding: "4px 12px", borderRadius: 20, fontWeight: 600 }}>อัพเดทล่าสุด</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", gap: 20, flex: 1, flexWrap: 'wrap' }}>

                {/* Donut */}
                <div style={{ position: "relative", width: 220, height: 220, filter: "drop-shadow(0px 8px 16px rgba(0,0,0,0.06))" }}>
                    <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>

                        {/* background */}
                        <path
                            fill="none"
                            stroke="#f1f5f9"
                            strokeWidth="3.2"
                            d="M18 2.0845
                 a 15.9155 15.9155 0 0 1 0 31.831
                 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />

                        {data.map((item, index) => {
                            if (total === 0 || item.value === 0) return null;
                            const percentage = (item.value / total) * 100;
                            const strokeDasharray = `${percentage},100`;
                            const strokeDashoffset = -currentOffset;
                            currentOffset += percentage;

                            return (
                                <path
                                    key={index}
                                    fill="none"
                                    stroke={item.color}
                                    strokeWidth="3.2"
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                    style={{
                                        transition: "stroke-dashoffset 1s ease-in-out, stroke-dasharray 1s ease-in-out",
                                        cursor: "pointer"
                                    }}
                                    d="M18 2.0845
                         a 15.9155 15.9155 0 0 1 0 31.831
                         a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                            );
                        })}
                    </svg>

                    <div
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%,-50%)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center"
                        }}
                    >
                        <span style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>
                            {total > 0 ? "100%" : "0%"}
                        </span>
                        <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500, marginTop: 4 }}>
                            สัดส่วนทั้งหมด
                        </span>
                    </div>
                </div>

                {/* legend */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {data.length > 0 ? data.map((item, index) => {
                        const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
                        return (
                            <div key={index} className="chart-legend-item" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, fontSize: 14, background: "#f8fafc", padding: "8px 16px", borderRadius: 12 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <span style={{ width: 12, height: 12, borderRadius: '50%', background: item.color, display: 'inline-block', boxShadow: `0 2px 6px ${item.color}66` }}></span>
                                    <span style={{ color: "#334155", fontWeight: 500 }}>{item.name}</span>
                                </div>
                                <span style={{ fontWeight: 700, color: "#0f172a" }}>{percent}%</span>
                            </div>
                        )
                    }) : <span style={{ color: "#94a3b8", textAlign: 'center', width: '100%' }}>ไม่มีข้อมูล</span>}
                </div>

            </div>
        </div>
    )
}