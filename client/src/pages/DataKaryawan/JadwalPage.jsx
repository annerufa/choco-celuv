// src/pages/Jadwal/JadwalPage.jsx
import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import styles from './JadwalPage.module.css';
import JadwalTable from '../../components/JadwalTable/JadwalTable';

// ── Dummy data ─────────────────────────────────────────────────
const DUMMY_KARYAWAN = [
    { id: 1, name: 'Rina Penjaga', employee_code: 'EMP-001', role: 'Booth Keeper', booth: 'Booth Kebonrojo', is_active: true },
    { id: 2, name: 'Dani Penjaga', employee_code: 'EMP-002', role: 'Booth Keeper', booth: 'Booth Banggle', is_active: true },
    { id: 3, name: 'Bowo Penjaga', employee_code: 'EMP-003', role: 'Booth Keeper', booth: 'Booth Tanjung', is_active: true },
    // { id: 4, name: 'Agus Supervisor', employee_code: 'EMP-005', role: 'Supervisor',   booth: '—',              is_active: true },
];

//  [karyawan_id][date_iso] = { type: 'pagi'|'sore'|'malam'|'libur', start: '07:00', end: '13:00' }
const TODAY = new Date();
function isoDate(d) {
    return d.toISOString().split('T')[0];
}
function getWeekDates(offset = 0) {
    const d = new Date(TODAY);
    const day = d.getDay();
    const mon = new Date(d);
    mon.setDate(d.getDate() - ((day + 6) % 7) + offset * 7);
    return Array.from({ length: 7 }, (_, i) => {
        const x = new Date(mon);
        x.setDate(mon.getDate() + i);
        return x;
    });
}

const DUMMY_SHIFTS = {
    1: {
        [isoDate(getWeekDates()[0])]: { type: 'pagi', start: '10:00', end: '17:00', location: 'Booth Kebonrojo' },
        [isoDate(getWeekDates()[1])]: { type: 'pagi', start: '10:00', end: '17:00', location: 'Booth Kebonrojo' },
        [isoDate(getWeekDates()[2])]: { type: 'pagi', start: '10:00', end: '17:00', location: 'Booth Kebonrojo' },
        [isoDate(getWeekDates()[3])]: { type: 'pagi', start: '10:00', end: '17:00', location: 'Booth Kebonrojo' },
        [isoDate(getWeekDates()[4])]: { type: 'pagi', start: '10:00', end: '17:00', location: 'Booth Kebonrojo' },
        [isoDate(getWeekDates()[5])]: { type: 'pagi', start: '10:00', end: '17:00', location: 'Booth Kebonrojo' },
        [isoDate(getWeekDates()[6])]: { type: 'libur' },
    },
    2: {
        [isoDate(getWeekDates()[0])]: { type: 'pagi', start: '10:00', end: '17:00', location: 'Banggle' },
        [isoDate(getWeekDates()[1])]: { type: 'pagi', start: '10:00', end: '17:00', location: 'Banggle' },
        [isoDate(getWeekDates()[2])]: { type: 'pagi', start: '10:00', end: '17:00', location: 'Banggle' },
        [isoDate(getWeekDates()[3])]: { type: 'pagi', start: '10:00', end: '17:00', location: 'Banggle' },
        [isoDate(getWeekDates()[4])]: { type: 'pagi', start: '10:00', end: '17:00', location: 'Banggle' },
        [isoDate(getWeekDates()[5])]: { type: 'pagi', start: '10:00', end: '17:00', location: 'Banggle' },
        [isoDate(getWeekDates()[6])]: { type: 'libur' },
    },
    3: {
        [isoDate(getWeekDates()[0])]: { type: 'pagi', start: '11:00', end: '17:00', location: 'Tanjung' },
        [isoDate(getWeekDates()[1])]: { type: 'pagi', start: '11:00', end: '17:00', location: 'Tanjung' },
        [isoDate(getWeekDates()[2])]: { type: 'pagi', start: '11:00', end: '17:00', location: 'Tanjung' },
        [isoDate(getWeekDates()[3])]: { type: 'libur' },
        [isoDate(getWeekDates()[4])]: { type: 'pagi', start: '11:00', end: '17:00', location: 'Tanjung' },
        [isoDate(getWeekDates()[5])]: { type: 'pagi', start: '11:00', end: '17:00', location: 'Tanjung' },
        [isoDate(getWeekDates()[6])]: { type: 'pagi', start: '11:00', end: '17:00', location: 'Tanjung' },
    },
};

function getInitials(name) {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function JadwalPage() {
    // const { data: karyawanData, loading, error } = useApi('/employees?is_active=true');
    const [karyawanList] = useState(DUMMY_KARYAWAN);
    const [shifts, setShifts] = useState(DUMMY_SHIFTS);
    const loading = false;
    const error = null;

    // ── Stats ─────────────────────────────────────────────────
    const weekDates = getWeekDates(0);
    const totalShift = karyawanList.reduce((acc, k) => {
        return acc + weekDates.filter(d => {
            const s = shifts[k.id]?.[isoDate(d)];
            return s && s.type !== 'libur';
        }).length;
    }, 0);
    const totalLibur = karyawanList.reduce((acc, k) => {
        return acc + weekDates.filter(d => {
            const s = shifts[k.id]?.[isoDate(d)];
            return s?.type === 'libur';
        }).length;
    }, 0);
    const totalBooth = [...new Set(karyawanList.filter(k => k.booth !== '—').map(k => k.booth))].length;

    const stats = [
        { value: karyawanList.length, label: 'Karyawan Aktif' },
        { value: totalBooth, label: 'Booth Beroperasi' },
        { value: totalShift, label: 'Shift Minggu Ini' },
        { value: totalLibur, label: 'Hari Libur' },
    ];

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.pageHeader}>
                <div className={styles.breadcrumb}>
                    <span>Data Master</span> › Jadwal Jaga
                </div>
                <h1 className={styles.pageTitle}>Jadwal Jaga Booth</h1>
                <p className={styles.pageSubtitle}>Atur jadwal shift karyawan per booth per minggu</p>
            </div>

            {/* Stats */}
            <div className={styles.statsRow}>
                {stats.map(s => (
                    <div key={s.label} className={styles.statCard}>
                        <div className={styles.statVal}>{s.value}</div>
                        <div className={styles.statLbl}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Jadwal */}
            <JadwalTable
                karyawanList={karyawanList}
                shifts={shifts}
                setShifts={setShifts}
                loading={loading}
                error={error}
                getWeekDates={getWeekDates}
                isoDate={isoDate}
                getInitials={getInitials}
            />
        </div>
    );
}
