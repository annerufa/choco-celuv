// src/components/StatsGrid/StatsGrid.jsx
import styles from './StatsGrid.module.css';

export default function StatsGrid({ stats = [] }) {

    // Icon SVG per jenis — copy dari HTML kamu
    const statIcons = {
        barang: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
        ),
        bahan: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
        ),
        perlengkapan: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
            </svg>
        ),
        warning: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
        ),
    };

    // Arrow icon untuk stat-change
    const ArrowUp = () => (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="18 15 12 9 6 15" />
        </svg>
    );
    const ArrowDown = () => (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
        </svg>
    );

    // ── Sub-component StatCard ──────────────────────────
    function StatCard({ icon, iconVariant, value, label, change }) {
        return (
            <div className={styles.statCard}>
                <div className={`${styles.statIcon} ${styles[iconVariant]}`}>
                    {statIcons[icon]}
                </div>
                <div className={styles.statInfo}>
                    <div className={styles.statValue}>{value}</div>
                    <div className={styles.statLabel}>{label}</div>
                    {change && (
                        <div className={`${styles.statChange} ${styles[change.type]}`}>
                            {change.type === 'up' ? <ArrowUp /> : <ArrowDown />}
                            {change.text}
                        </div>
                    )}
                </div>
            </div>
        );
    }
    // ── Main component ──────────────────────────────────
    // export default function StatsGrid() {
    return (
        <div className={styles.statsGrid}>
            {stats.map(stat => (
                <StatCard key={stat.id} {...stat} />
            ))}
        </div>
    );
}