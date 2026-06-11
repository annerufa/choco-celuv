
import styles from './DashboardPage.module.css';
import StatsGrid from '../../components/StatsGrid/StatsGrid';
import StockChart from '../../components/StockChart/StockChart';

export default function PemilikDashboard() {
    return (
        <div className={styles.page}>

            {/* Header */}
            <div className={styles.pageHeader}>
                <div className={styles.breadcrumb}>
                    <span>Dashboard</span>
                </div>
                <h1 className={styles.pageTitle}>Dashboard Pemilik</h1>
                <p className={styles.pageSubtitle}>Selamat datang!</p>
            </div>

            {/* Stats */}
            <StatsGrid />

            {/* Chart */}
            <StockChart />


        </div>
    );
}