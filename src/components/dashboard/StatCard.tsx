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
    variant?: "glass" | "clay"
}
export default function StatCard({
    icon = "",
    iconBg = "#f1f5f9",
    label,
    value,
    unit,
    trend = "",
    trendUp,
    href = "#",
    iconColor = "#333",
    variant = "glass"
}: Props) {
    const isClay = variant === "clay";
    const cardClass = isClay ? "clay-card" : "glass-card hover-lift";
    
    // For clay we might use different base colors if no iconBg provided
    const defaultIconBg = isClay ? (trendUp ? "clay-accent-mint" : "clay-accent-peach") : iconBg;
    
    return (
        <Link href={href} style={{ textDecoration: "none" }}>
            <div className={cardClass} style={{ padding: '24px 28px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, alignItems: 'flex-start' }}>
                    <div 
                        className={isClay ? defaultIconBg : ""}
                        style={{
                            width: 52,
                            height: 52,
                            borderRadius: isClay ? '50%' : 16,
                            background: isClay ? undefined : iconBg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: isClay ? undefined : iconColor,
                            boxShadow: isClay ? undefined : '0 4px 12px rgba(0,0,0,0.05)'
                        }}
                    >
                        {icon.length > 10 ? (
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: 26, height: 26 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isClay ? 2.5 : 2} d={icon} />
                            </svg>
                        ) : (
                            <span style={{ fontSize: 24, fontWeight: 700 }}>{icon}</span>
                        )}
                    </div>

                    {trend && (
                        <span 
                            className={isClay ? "clay-pill" : ""}
                            style={{ 
                                fontSize: 12, 
                                fontWeight: isClay ? 800 : 600,
                                color: isClay ? '#64748b' : (trendUp ? "#059669" : "#64748b"),
                                background: isClay ? undefined : (trendUp ? "#d1fae5" : "#f1f5f9"),
                                padding: isClay ? undefined : '4px 8px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                            }}
                        >
                            {trend}
                        </span>
                    )}

                </div>
                
                <div style={{ marginTop: 'auto' }}>
                    <span style={{ fontSize: 14, color: isClay ? "#94a3b8" : "#64748b", fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                        {label}
                    </span>
                    <h2 style={{ margin: 0, fontSize: 36, fontWeight: 800, color: isClay ? '#334155' : '#0f172a', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        {value} <small style={{ fontSize: 16, color: '#94a3b8', fontWeight: 700 }}>{unit}</small>
                    </h2>
                </div>
            </div>
        </Link>
    );
}