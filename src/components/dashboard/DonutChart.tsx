//กราฟวงกลม
import { useState } from 'react';
import Modal from '@/components/common/Modal';

export default function DonutChart({ data = [] }: { data?: any[] }) {
    const [selectedDivision, setSelectedDivision] = useState<any>(null);
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
                height: "100%",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
                minHeight: 0,
                overflow: 'hidden'
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1e293b" }}>สถิติกลุ่มงานบุคลากร</h3>
                <span style={{ fontSize: 13, color: "#64748b", background: "#f1f5f9", padding: "4px 12px", borderRadius: 20, fontWeight: 600 }}>คลิกเพื่อดูแผนกย่อย</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", gap: 20, flex: 1, flexWrap: 'wrap' }}>

                {/* Donut Container */}
                <div style={{ position: "relative", width: '100%', maxWidth: 220, aspectRatio: '1/1', maxHeight: '35vh', filter: "drop-shadow(0px 8px 16px rgba(0,0,0,0.06))", transition: "transform 0.3s ease", cursor: "pointer", flexShrink: 1 }} onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"} onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}>
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
                                    onClick={() => setSelectedDivision(item)}
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
                <div className="custom-scrollbar" style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, overflowY: 'auto', paddingRight: 4, minHeight: 0 }}>
                    {data.length > 0 ? data.map((item, index) => {
                        const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
                        return (
                            <div 
                                key={index} 
                                className="chart-legend-item" 
                                onClick={() => setSelectedDivision(item)}
                                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, fontSize: 14, background: "#f8fafc", padding: "8px 16px", borderRadius: 12, cursor: 'pointer' }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <span style={{ width: 12, height: 12, borderRadius: '50%', background: item.color, display: 'inline-block', boxShadow: `0 2px 6px ${item.color}66` }}></span>
                                    <span style={{ color: "#334155", fontWeight: 500 }}>{item.name}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span style={{ color: "#64748b", fontWeight: 600, fontSize: 12 }}>{item.value} คน</span>
                                    <span style={{ fontWeight: 700, color: "#0f172a" }}>{percent}%</span>
                                </div>
                            </div>
                        )
                    }) : <span style={{ color: "#94a3b8", textAlign: 'center', width: '100%' }}>ไม่มีข้อมูล</span>}
                </div>

            </div>

            <Modal
                isOpen={!!selectedDivision}
                onClose={() => setSelectedDivision(null)}
                title={`รายละเอียดแผนกย่อย: ${selectedDivision?.name}`}
            >
                {selectedDivision && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 20px', borderRadius: 12 }}>
                            <span style={{ fontSize: 16, fontWeight: 700, color: '#334155' }}>บุคลากรทั้งหมดในกลุ่มงาน</span>
                            <span style={{ fontSize: 20, fontWeight: 800, color: selectedDivision.color }}>{selectedDivision.value} คน</span>
                        </div>
                        
                        <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4 }} className="custom-scrollbar">
                            {selectedDivision.subDepts && selectedDivision.subDepts.length > 0 ? (
                                selectedDivision.subDepts.map((sub: any, idx: number) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: '#f8fafc', borderLeft: `4px solid ${selectedDivision.color}`, borderRadius: '4px 12px 12px 4px' }}>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{sub.name}</span>
                                        <span style={{ fontSize: 14, fontWeight: 700, color: '#64748b' }}>{sub.value} คน</span>
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0' }}>ไม่มีข้อมูลแผนกย่อย</div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}