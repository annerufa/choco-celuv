// src/pages/DataKaryawan/DataKaryawanPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import styles from './DataKaryawanPage.module.css';
import KaryawanTable from '../../components/KaryawanTable/KaryawanTable';
import StatsGrid from '../../components/StatsGrid/StatsGrid';
import { getStatsKaryawan } from '../../components/StatsGrid/statsConfig';


export default function DataKaryawanPage() {
    const { user } = useAuth();
    // console.log('stokEndpoint:', stokEndpoint);
    const { data: karyawanData, loading, error, fetchData, createData, updateData, deleteData } = useApi('/karyawan/withJadwal');

    const [karyawanList, setKaryawanList] = useState([]);

    // Effect untuk update saat karyawanData datang
    useEffect(() => {
        if (!karyawanData) return;
        const karyawans = Array.isArray(karyawanData) ? karyawanData : (karyawanData.payload?.data ?? []);

        if (karyawans.length > 0) {
            setKaryawanList(karyawans);
        }
    }, [karyawanData]); // jalan setiap karyawanData berubah



    const stats = getStatsKaryawan(karyawanList);

    return (
        <div className={styles.page}>

            {/* Header */}
            <div className={styles.pageHeader}>
                <div className={styles.breadcrumb}>
                    <span>Data Master</span>
                    ›
                    Daftar Karyawan
                </div>
                <h1 className={styles.pageTitle}>Data Karyawan</h1>
                <p className={styles.pageSubtitle}>Kelola data karyawan</p>
            </div>

            {/* Stats */}
            <StatsGrid stats={stats} />

            {/* Tabel */}
            <KaryawanTable
                karyawanList={karyawanList}
                setKaryawanList={setKaryawanList}
                loading={loading}
                error={error}
            />

        </div>
    );
}