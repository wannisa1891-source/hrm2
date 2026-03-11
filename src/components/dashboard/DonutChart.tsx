//กราฟวงกลม
export default function DonutChart({ data = [] }: { data?: any[] }) {
    const total = data.reduce((acc, curr) => acc + curr.value, 0);
    let currentOffset = 0;

    return (
        <div
            style={{
                background: "white",
                borderRadius: 20,
                padding: "20px 24px",
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
                                    strokeWidth="3.8"
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={strokeDashoffset}
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
                            fontWeight: 700,
                            fontSize: 20
                        }}
                    >
                        {total > 0 ? "100%" : "0%"}
                    </div>
                </div>

                {/* legend */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {data.length > 0 ? data.map((item, index) => (
                        <span key={index} style={{ fontSize: 14 }}>
                            <span style={{ color: item.color, marginRight: 8, fontSize: 18 }}>●</span>
                            {item.name} {total > 0 ? Math.round((item.value / total) * 100) : 0}%
                        </span>
                    )) : <span style={{ color: "#999" }}>ไม่มีข้อมูล</span>}
                </div>

            </div>
        </div>
    )
}