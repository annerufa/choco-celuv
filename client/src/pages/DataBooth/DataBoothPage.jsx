// src/pages/DataBooth/DataBoothPage.jsx
import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import styles from './DataBoothPage.module.css';
import BoothTable from '../../components/BoothTable/BoothTable';
import BarangBoothTable from '../../components/BoothTable/BarangBoothTable';
import StatsGrid from '../../components/StatsGrid/StatsGrid';
import { getStatsBooth } from '../../components/StatsGrid/statsConfig';



export default function DataBoothPage() {
    const {
        data: boothData,
        loading,
        error,
        createData,
        updateData,
        deleteData,
    } = useApi('/booth');


    // State dengan default DUMMY_BOOTHS dulu
    const [boothList, setBoothList] = useState([]);

    // Effect untuk update saat boothData datang
    useEffect(() => {
        if (!boothData) return;
        const booths = Array.isArray(boothData) ? boothData : (boothData.payload?.data ?? []);

        if (booths.length > 0) {
            setBoothList(booths);
        }
    }, [boothData]); // jalan setiap boothData berubah



    const stats = getStatsBooth(boothList);
    // const totalPegawai = boothList.reduce((sum, b) => sum + (b.staff?.length ?? 0), 0);


    return (
        <div className={styles.page}>

            {/* Header */}
            <div className={styles.pageHeader}>
                <div className={styles.breadcrumb}>
                    <span>Data Master</span>
                    ›
                    Daftar Booth
                </div>
                <h1 className={styles.pageTitle}>Data Booth</h1>
                <p className={styles.pageSubtitle}>Kelola semua booth dan lokasi penjualan</p>
            </div>

            {/* Stats */}
            <StatsGrid stats={stats} />

            {/* Booth Table + Grid + Drawer */}
            <BoothTable
                boothList={boothList}
                setBoothList={setBoothList}
                loading={loading}
                error={error}
            />

        </div>
    );
}
