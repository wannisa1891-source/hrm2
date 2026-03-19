//กล่องสถิติ
import Link from "next/link";
type Props = {
    icon?: string
    iconBg?: string
    label: string
    value: number
    unit: string
    trend?: string
    trendUp?: boolean
    href?: string
    iconColor?: string
}
export default function StatCard({
    icon = "",
    iconBg = "#f1f5f9",
    label,
    value,
    unit,
    trend = "-",
    trendUp,
    href = "#",
    iconColor = "#333"
}: Props) {
    return (
        <Link href={href} style={{ textDecoration: "none" }}>
            <div className="glass-card hover-lift" style={{ padding: '16px 20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: 'flex-start' }}>
                    <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: 16,
                        background: iconBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: iconColor,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }}>
                        {icon.length > 10 ? (
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: 24, height: 24 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                            </svg>
                        ) : (
                            icon
                        )}
                    </div>

                    <span style={{ 
                        fontSize: 12, 
                        fontWeight: 600,
                        color: trendUp ? "#059669" : "#64748b",
                        background: trendUp ? "#d1fae5" : "#f1f5f9",
                        padding: '4px 8px',
                        borderRadius: '20px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 2
                    }}>
                        {trend}
                    </span>

                </div>
                
                <div style={{ marginTop: 'auto' }}>
                    <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                        {label}
                    </span>
                    <h2 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                        {value} <small style={{ fontSize: 16, color: '#64748b', fontWeight: 600 }}>{unit}</small>
                    </h2>
                </div>
            </div>
        </Link>
    );
}