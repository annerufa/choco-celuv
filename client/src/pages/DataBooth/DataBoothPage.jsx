// src/pages/DataBooth/DataBoothPage.jsx
import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import styles from './DataBoothPage.module.css';
import BoothTable from '../../components/BoothTable/BoothTable';
import BarangBoothTable from '../../components/BoothTable/BarangBoothTable';
import StatsGrid from '../../components/StatsGrid/StatsGrid';
import { getStatsBooth } from '../../components/StatsGrid/statsConfig';


// ── Data dummy (ganti dengan API nanti) ──────────────────────
// const DUMMY_BOOTHS = [
//     {
//         id: 1, name: 'Booth Kebonrojo', code: 'BR-01',
//         address: 'Jl. Diponegoro', phone: '0812-3456-7890', active: true,
//         staff: [{ name: 'Rina Penjaga', role: 'Booth Keeper', initials: 'RP' }],
//         rev: 'Rp 3,2jt', trx: 187, expired: '350ml',
//     },
//     {
//         id: 2, name: 'Booth Banggle', code: 'BG-01',
//         address: 'Depan Toko Annaja', phone: '0821-9876-5432', active: true,
//         staff: [{ name: 'Dani Penjaga', role: 'Booth Keeper', initials: 'DP' }],
//         rev: 'Rp 2,8jt', trx: 154, expired: '500ml',
//     },
//     {
//         id: 3, name: 'Booth Tanjung', code: 'TJ-01',
//         address: 'Jl. Tanjung depan SDN', phone: '0856-1234-5678', active: true,
//         staff: [{ name: 'Bowo Penjaga', role: 'Booth Keeper', initials: 'BK' }],
//         rev: 'Rp 4,1jt', trx: 221, expired: '—',
//     },
// ];

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
            <StatsGrid stats={stats} />;

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
