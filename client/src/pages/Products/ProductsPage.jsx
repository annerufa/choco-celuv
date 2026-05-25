// src/pages/Products/ProductsPage.jsx
import styles from './Products.module.css';
import ProductsTable from '../../components/Products/ProductsTable';

export default function ProductsPage() {
    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div className={styles.breadcrumb}>
                    <span>Master Data</span> › Produk
                </div>
                <h1 className={styles.pageTitle}>Kelola Produk</h1>
                <p className={styles.pageSubtitle}>Atur produk, ukuran, harga, dan komponen bahan</p>
            </div>
            <ProductsTable />
        </div>
    );
}
