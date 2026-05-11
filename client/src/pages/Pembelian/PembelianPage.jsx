import styles from './PembelianPage.module.css';
import PurchaseTable from '../../components/Purchase/PurchaseTable';

export default function PembelianPage() {
    return (
        <div className={styles.page}>

            {/* Header */}
            <div className={styles.pageHeader}>
                <div className={styles.breadcrumb}>
                    <span>Data Transaksi</span>
                    ›
                    Data Pembelian
                </div>
                <h1 className={styles.pageTitle}>Data Pembelian</h1>
                <p className={styles.pageSubtitle}>Kelola data pembelian bahan baku</p>
            </div>

            {/* Tabel */}
            <PurchaseTable />

        </div>
    );
}