// src/pages/DataBarang/DataBarangPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import styles from './DataKaryawanPage.module.css';
import StatsGrid from '../../components/StatsGrid/StatsGrid';
import StockChart from '../../components/StockChart/StockChart';
import KaryawanTable from '../../components/KaryawanTable/KaryawanTable';
import { getStatsBarang } from '../../components/StatsGrid/statsConfig';


export default function DataBarangPage() {
    const { user } = useAuth();
    const stokEndpoint = `/karyawan`;
    const { data: karyawanData, loading, error, fetchData, createData, updateData, deleteData } = useApi(stokEndpoint);

    const [karyawanList, setKaryawanList] = useState([]);

    useEffect(() => {
        if (!karyawanData) return;

        // Ambil data karyawan dari response
        const items = Array.isArray(karyawanData) ? karyawanData : (karyawanData.payload?.data ?? []);

        // Proses data karyawan (tanpa konversi unit atau status stok)
        const processed = items.map(item => {
            return {
                ...item,
                // Tambahkan field tambahan jika diperlukan, misal:
                is_active: item.is_active ? 'Aktif' : 'Nonaktif',
                // fullName: `${item.first_name} ${item.last_name}`,
            };
        });

        setKaryawanList(processed);
    }, [karyawanData]);
    console.log(karyawanList);
    return (
        <div className={styles.page}>

            {/* Header */}
            <div className={styles.pageHeader}>
                <div className={styles.breadcrumb}>
                    <span>Karyawan</span>
                    ›
                    Daftar Karyawan
                </div>
                <h1 className={styles.pageTitle}>Data Karyawan</h1>
                <p className={styles.pageSubtitle}>Kelola data karyawan</p>
            </div>

            {/* Stats */}
            <StatsGrid karyawanList={karyawanList} />

            {/* <StatsGrid /> */}

            {/* Chart */}
            {/* <StockChart /> */}

            {/* Tabel */}
            <KaryawanTable
                karyawanList={karyawanList}
                setKaryawanList={setKaryawanList}
                loading={loading}
                error={error}
                fetchData={fetchData}
                createData={createData}    // Tambahkan jika diperlukan
                updateData={updateData}    // Tambahkan jika diperlukan
                deleteData={deleteData}    // Tambahkan jika diperlukan
            />
            {/* <BarangTable /> */}

        </div>
    );
}