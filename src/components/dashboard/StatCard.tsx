//กล่องสถิติ
import Link from "next/link";
type Props = {
    icon: string
    iconBg: string
    label: string
    value: number
    unit: string
    trend: string
    trendUp?: boolean
    href: string
}
export default function StatCard({
    icon,
    iconBg,
    label,
    value,
    unit,
    trend,
    trendUp,
    href
}: Props) {
    return (
        <Link href={href} style={{ textDecoration: "none" }}>
            <div className="glass-card" style={{ padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
                    <div style={{
                        width: 50,
                        height: 50,
                        borderRadius: 16,
                        background: iconBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}>
                        {icon}
                    </div>

                    <span style={{ fontSize: 12, color: trendUp ? "#27ae60" : "#999" }}>
                        {trend}
                    </span>

                </div>
                <span style={{ fontSize: 13, color: "#888" }}>
                    {label}
                </span>
                <h2 style={{ margin: 0 }}>
                    {value} <small>{unit}</small>
                </h2>
            </div>
        </Link>
    );
}