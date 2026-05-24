// src/pages/Produksi/ProduksiPage.jsx
import styles from './Produksi.module.css';
import ProduksiTable from '../../components/Produksi/ProduksiTable';

export default function ProduksiPage() {
    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div className={styles.breadcrumb}>
                    <span>Produksi</span>
                    › Kelola Produksi
                </div>
                <h1 className={styles.pageTitle}>Kelola Produksi</h1>
                <p className={styles.pageSubtitle}>Buat dan kelola produksi mixing & adonan</p>
            </div>
            <ProduksiTable />
        </div>
    );
}
