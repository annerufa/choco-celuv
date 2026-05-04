// src/pages/DataKaryawan/DataKaryawanPage.jsx
import { useState } from 'react';
import styles from './DataKaryawanPage.module.css';
import KaryawanTable from '../../components/KaryawanTable/KaryawanTable';

// ── Dummy data ────────────────────────────────────────────────
const DUMMY = [
    { id: 1, name: 'Rina Penjaga', employee_code: 'EMP-001', role: 'Penjaga Booth', booth: 'Booth Kebonrojo', phone: '0812-3456-7890', email: 'rina@chococeluv.id', join_date: '2024-01-15', is_active: true },
    { id: 2, name: 'Dani Penjaga', employee_code: 'EMP-002', role: 'Penjaga Booth', booth: 'Booth Banggle', phone: '0821-9876-5432', email: 'dani@chococeluv.id', join_date: '2024-02-01', is_active: true },
    { id: 3, name: 'Bowo Penjaga', employee_code: 'EMP-003', role: 'Penjaga Booth', booth: 'Booth Tanjung', phone: '0856-1234-5678', email: 'bowo@chococeluv.id', join_date: '2024-03-10', is_active: true },
    { id: 4, name: 'Sari Kurir', employee_code: 'EMP-004', role: 'Kurir', booth: 'Booth Kebonrojo', phone: '0877-1111-2222', email: 'sari@chococeluv.id', join_date: '2024-04-05', is_active: false },
    // { id: 5, name: 'Agus Supervisor', employee_code: 'EMP-005', role: 'Supervisor', booth: '—', phone: '0811-5555-6666', email: 'agus@chococeluv.id', join_date: '2023-11-01', is_active: true },
];

export default function DataKaryawanPage() {
    // const { data, loading, error, fetchData, createData, updateData, deleteData } = useApi('/employees');
    const [karyawanList, setKaryawanList] = useState(DUMMY);
    const loading = false;
    const error = null;

    // ── Stats ─────────────────────────────────────────────────
    const totalKaryawan = karyawanList.length;
    const karyawanAktif = karyawanList.filter(k => k.is_active).length;
    const karyawanNonaktif = karyawanList.filter(k => !k.is_active).length;
    const totalBooth = [...new Set(karyawanList.filter(k => k.booth !== '—').map(k => k.booth))].length;

    const stats = [
        { icon: '👤', variant: 'br', value: totalKaryawan, label: 'Total Karyawan' },
        { icon: '✅', variant: 'gn', value: karyawanAktif, label: 'Aktif' },
        { icon: '⛔', variant: 'rd', value: karyawanNonaktif, label: 'Nonaktif' },
        { icon: '🏪', variant: 'or', value: totalBooth, label: 'Booth Bertugas' },
    ];

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
            <div className={styles.statsRow}>
                {stats.map(s => (
                    <div key={s.label} className={styles.miniStat}>
                        <div className={`${styles.msIcon} ${styles[s.variant]}`}>{s.icon}</div>
                        <div>
                            <div className={styles.msVal}>{s.value}</div>
                            <div className={styles.msLbl}>{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

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