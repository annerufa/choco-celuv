// src/pages/DataBarang/DataBarangPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import styles from './DataBarangPage.module.css';
import StatsGrid from '../../components/StatsGrid/StatsGrid';
import StockChart from '../../components/StockChart/StockChart';
import BarangTable from '../../components/BarangTable/BarangTable';
import { getStatsBarang } from '../../components/StatsGrid/statsConfig';


function getStokStatus(stok, min, max, safetyStock) {
    if (stok <= 0) return 'Habis';
    if (stok <= safetyStock) return 'Kritis';  // di bawah safety stock = darurat
    if (stok <= min) return 'Menipis';          // sudah waktunya order
    if (stok > max) return 'Overstock';         // terlalu banyak
    return 'Aman';
}
export default function DataBarangPage() {
    const { user } = useAuth();
    const stokEndpoint = user?.location_id ? `/items?location_id=${user.location_id}` : null;
    // console.log('stokEndpoint:', stokEndpoint);
    const { data: stokData, loading, error, fetchData, createData, updateData, deleteData } = useApi(stokEndpoint);

    const [barangList, setBarangList] = useState([]);

    useEffect(() => {
        if (!stokData) return;
        const unitMap = { ml: 'L', gram: 'kg' };
        const items = Array.isArray(stokData) ? stokData : (stokData.payload?.data ?? []);
        const processed = items.map(item => {
            const stok_sekarang = parseFloat(item.current_stock ?? 0);
            const min = item.min_qty ?? 0;
            const max = item.max_qty ?? 0;
            // console.log(`Processing item ${item.id}: stok_sekarang=${stok_sekarang}, min=${min}, max=${max}`);
            return {
                ...item,
                display_stok: unitMap[item.unit] ? stok_sekarang / 1000 : stok_sekarang,
                display_unit: unitMap[item.unit] || item.unit,
                display_last_price: item.last_price != null
                    ? (unitMap[item.unit] ? item.last_price * 1000 : item.last_price)
                    : null,
                min, max,
                stok_status: getStokStatus(stok_sekarang, min, max, item.safety_stock ?? 0),
                status_label: item.is_active ? 'Aktif' : 'Nonaktif',
            };
        });
        setBarangList(processed);
    }, [stokData]);

    const stats = getStatsBarang(barangList);

    return (
        <div className={styles.page}>

            {/* Header */}
            <div className={styles.pageHeader}>
                <div className={styles.breadcrumb}>
                    <span>Data Master</span>
                    ›
                    Daftar Barang
                </div>
                <h1 className={styles.pageTitle}>Data Barang</h1>
                <p className={styles.pageSubtitle}>Kelola bahan baku & perlengkapan</p>
            </div>

            {/* Stats */}

            <StatsGrid stats={stats} />

            {/* <StatsGrid /> */}

            {/* Chart */}
            {/* <StockChart /> */}

            {/* Tabel */}
            <BarangTable
                barangList={barangList}
                setBarangList={setBarangList}
                loading={loading}
                error={error}
                fetchData={fetchData}
            />
            {/* <BarangTable /> */}

        </div>
    );
}