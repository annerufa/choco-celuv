import styles from './Distribusi.module.css';
import DistribusiTable from '../../components/Distribusi/DistribusiTable';

export default function DistribusiPage() {
    return (
        <div className={styles.page}>

            {/* Header */}
            <div className={styles.pageHeader}>
                <div className={styles.breadcrumb}>
                    <span>Data Transaksi</span>
                    ›
                    Data Distribusi
                </div>
                <h1 className={styles.pageTitle}>Data Distribusi</h1>
                <p className={styles.pageSubtitle}>Kelola data distribusi bahan baku</p>
            </div>

            {/* Tabel */}
            <DistribusiTable />

        </div>
    );
}