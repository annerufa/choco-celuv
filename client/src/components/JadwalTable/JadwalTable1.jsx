// src/components/JadwalTable/JadwalTable.jsx
import { useState } from 'react';
import toast from 'react-hot-toast';
import styles from './JadwalTable.module.css';

const DAY_NAMES = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const SHIFT_CONFIG = {
    pagi: { label: 'Pagi', start: '07:00', end: '13:00', className: 'shiftPagi' },
    sore: { label: 'Sore', start: '13:00', end: '19:00', className: 'shiftSore' },
    malam: { label: 'Malam', start: '19:00', end: '00:00', className: 'shiftMalam' },
    libur: { label: 'Libur', start: '', end: '', className: 'shiftLibur' },
};

const AVATAR_COLORS = ['#D4500A', '#0F6E56', '#185FA5', '#854F0B', '#5B21B6', '#9A3412'];

export default function JadwalTable({
    karyawanList = [],
    shifts = {},
    setShifts,
    loading = false,
    error = null,
    getWeekDates,
    isoDate,
    getInitials,
}) {
    const [weekOffset, setWeekOffset] = useState(0);
    const [modalData, setModalData] = useState(null); // { karyawan, date, existing }
    const [modalShift, setModalShift] = useState('pagi');
    const [modalStart, setModalStart] = useState('07:00');
    const [modalEnd, setModalEnd] = useState('13:00');
    const [modalLocation, setModalLocation] = useState('');
    const weekDates = getWeekDates(weekOffset);
    const todayIso = isoDate(new Date());
    // Ambil daftar lokasi unik untuk pilihan di modal
    const daftarLokasi = [...new Set(karyawanList.map(k => k.booth))];

    // ── Helpers ───────────────────────────────────────────────
    function formatWeekRange(dates) {
        const fmt = d => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        return `${fmt(dates[0])} – ${fmt(dates[6])} ${dates[0].getFullYear()}`;
    }

    // ── Modal ─────────────────────────────────────────────────
    function openModal(k, date) {
        const iso = isoDate(date);
        const existing = shifts[k.id]?.[iso];
        setModalData({ karyawan: k, date, iso });
        setModalShift(existing?.type ?? 'pagi');
        setModalStart(existing?.start ?? SHIFT_CONFIG.pagi.start);
        setModalEnd(existing?.end ?? SHIFT_CONFIG.pagi.end);
        // Set lokasi: ambil dari jadwal existing, atau default dari booth asal karyawan
        setModalLocation(existing?.location ?? k.booth);
    }

    function handleShiftTypeChange(type) {
        setModalShift(type);
        if (type !== 'libur') {
            setModalStart(SHIFT_CONFIG[type].start);
            setModalEnd(SHIFT_CONFIG[type].end);
        } else {
            setModalStart('');
            setModalEnd('');
        }
    }

    function handleSaveShift() {
        const { karyawan, iso } = modalData;
        setShifts(prev => ({
            ...prev,
            [karyawan.id]: {
                ...(prev[karyawan.id] ?? {}),
                [iso]: modalShift === 'libur'
                    ? { type: 'libur' }
                    : { type: modalShift, start: modalStart, end: modalEnd, location: modalLocation },
            },
        }));
        toast.success(`Shift ${karyawan.name} diperbarui`);
        setModalData(null);
    }

    function handleDeleteShift() {
        const { karyawan, iso } = modalData;
        setShifts(prev => {
            const updated = { ...(prev[karyawan.id] ?? {}) };
            delete updated[iso];
            return { ...prev, [karyawan.id]: updated };
        });
        toast.success(`Shift ${karyawan.name} dihapus`);
        setModalData(null);
    }

    return (
        <>
            <div className={styles.card}>
                {/* Card Header */}
                <div className={styles.cardHeader}>
                    <div className={styles.weekNav}>
                        <button className={styles.navBtn} onClick={() => setWeekOffset(o => o - 1)}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
                        </button>
                        <span className={styles.weekLabel}>{formatWeekRange(weekDates)}</span>
                        <button className={styles.navBtn} onClick={() => setWeekOffset(o => o + 1)}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                        </button>
                        {weekOffset !== 0 && (
                            <button className={styles.btnToday} onClick={() => setWeekOffset(0)}>Minggu Ini</button>
                        )}
                    </div>
                    <div className={styles.cardActions}>
                        <div className={styles.legend}>
                            <div className={styles.legItem}><div className={`${styles.legDot} ${styles.legPagi}`} />Pagi</div>
                            <div className={styles.legItem}><div className={`${styles.legDot} ${styles.legSore}`} />Sore</div>
                            <div className={styles.legItem}><div className={`${styles.legDot} ${styles.legMalam}`} />Malam</div>
                            <div className={styles.legItem}><div className={`${styles.legDot} ${styles.legLibur}`} />Libur</div>
                        </div>
                        <button className={styles.btnGhost}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Ekspor
                        </button>
                        <button className={styles.btnPrimary}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Tambah Shift
                        </button>
                    </div>
                </div>

                {/* Grid */}
                <div className={styles.tableWrap}>
                    <div className={styles.scheduleGrid} style={{ gridTemplateColumns: `160px repeat(7, 1fr)` }}>

                        {/* Header row */}
                        <div className={styles.gridHead} style={{ textAlign: 'left', paddingLeft: 16 }}>Karyawan</div>
                        {weekDates.map((d, i) => {
                            const iso = isoDate(d);
                            const isToday = iso === todayIso;
                            return (
                                <div
                                    key={iso}
                                    className={`${styles.gridHead} ${isToday ? styles.todayHead : ''}`}
                                >
                                    {DAY_NAMES[i]} {d.getDate()}
                                    {isToday && <span className={styles.todayBadge}>Hari ini</span>}
                                </div>
                            );
                        })}

                        {/* Body rows */}
                        {loading ? (
                            <div className={styles.stateCell} style={{ gridColumn: '1 / -1' }}>Memuat data...</div>
                        ) : error ? (
                            <div className={`${styles.stateCell} ${styles.errorCell}`} style={{ gridColumn: '1 / -1' }}>Gagal memuat data jadwal</div>
                        ) : karyawanList.map((k, ki) => (
                            <>
                                {/* Karyawan cell */}
                                <div key={`emp-${k.id}`} className={styles.empCell}>
                                    <div
                                        className={styles.avatar}
                                        style={{ background: AVATAR_COLORS[ki % AVATAR_COLORS.length] }}
                                    >
                                        {getInitials(k.name)}
                                    </div>
                                    <div>
                                        <div className={styles.empName}>{k.name}</div>
                                        <div className={styles.empRole}>{k.booth}</div>
                                    </div>
                                </div>

                                {/* Day cells */}
                                {weekDates.map(d => {
                                    const iso = isoDate(d);
                                    const isToday = iso === todayIso;
                                    const shift = shifts[k.id]?.[iso];
                                    const cfg = shift ? SHIFT_CONFIG[shift.type] : null;

                                    return (
                                        <div
                                            key={`${k.id}-${iso}`}
                                            className={`${styles.dayCell} ${isToday ? styles.todayCol : ''}`}
                                            onClick={() => openModal(k, d)}
                                            title="Klik untuk atur shift"
                                        >
                                            {cfg ? (
                                                <>
                                                    <span className={`${styles.shiftPill} ${styles[cfg.className]}`}>
                                                        {cfg.label}
                                                    </span>
                                                    {shift.type !== 'libur' && (
                                                        <>
                                                            <span className={styles.shiftTime}>
                                                                {shift.start}–{shift.end}
                                                            </span>
                                                            {/* Tampilkan Lokasi[cite: 2] */}
                                                            <span style={{ fontSize: '10px', color: '#666', fontWeight: '500', marginTop: '2px' }}>
                                                                📍 {shift.location}
                                                            </span>
                                                        </>
                                                    )}
                                                </>
                                            ) : (
                                                <span className={styles.shiftEmpty}>–</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className={styles.tableFooter}>
                    <span>
                        {karyawanList.length} karyawan · {
                            karyawanList.reduce((acc, k) =>
                                acc + weekDates.filter(d => {
                                    const s = shifts[k.id]?.[isoDate(d)];
                                    return s && s.type !== 'libur';
                                }).length, 0)
                        } shift terjadwal minggu ini
                    </span>
                    <div style={{ fontSize: 12, color: 'var(--brown-400)' }}>
                        Klik sel untuk mengatur shift
                    </div>
                </div>
            </div>

            {/* ── Shift Modal ──────────────────────────────────────── */}
            {modalData && (
                <>
                    <div className={styles.modalBackdrop} onClick={() => setModalData(null)} />
                    <div className={styles.modal}>
                        <div className={styles.modalHead}>
                            <div>
                                <div className={styles.modalTitle}>Atur Shift</div>
                                <div className={styles.modalSub}>
                                    {modalData.karyawan.name} ·{' '}
                                    {modalData.date.toLocaleDateString('id-ID', {
                                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                                    })}
                                </div>
                            </div>
                            <button className={styles.modalClose} onClick={() => setModalData(null)}>✕</button>
                        </div>

                        <div className={styles.modalBody}>
                            {/* Shift type picker */}
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Jenis Shift</label>
                                <div className={styles.shiftPicker}>
                                    {Object.entries(SHIFT_CONFIG).map(([key, cfg]) => (
                                        <button
                                            key={key}
                                            className={`${styles.shiftPickBtn} ${modalShift === key ? styles.shiftPickActive : ''} ${styles[cfg.className + 'Pick'] || ''}`}
                                            onClick={() => handleShiftTypeChange(key)}
                                        >
                                            {cfg.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom time */}
                            {modalShift !== 'libur' && (
                                <>
                                    <div className={styles.timeRow}>
                                        <div className={styles.formGroup}>
                                            <label className={styles.formLabel}>Mulai</label>
                                            <input
                                                type="time"
                                                className={styles.timeInput}
                                                value={modalStart}
                                                onChange={e => setModalStart(e.target.value)}
                                            />
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label className={styles.formLabel}>Selesai</label>
                                            <input
                                                type="time"
                                                className={styles.timeInput}
                                                value={modalEnd}
                                                onChange={e => setModalEnd(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.timeRow}>
                                        <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
                                            <label className={styles.formLabel}>Lokasi Penugasan</label>
                                            <select
                                                className={styles.timeInput} // Gunakan style yang sudah ada atau buat baru
                                                style={{ width: '100%', padding: '8px' }}
                                                value={modalLocation}
                                                onChange={e => setModalLocation(e.target.value)}
                                            >
                                                {daftarLokasi.map(loc => (
                                                    <option key={loc} value={loc}>{loc}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </>

                            )}
                        </div>

                        <div className={styles.modalFoot}>
                            {shifts[modalData.karyawan.id]?.[modalData.iso] && (
                                <button
                                    className={styles.btnDanger}
                                    onClick={handleDeleteShift}
                                >
                                    Hapus Shift
                                </button>
                            )}
                            <div style={{ flex: 1 }} />
                            <button className={styles.btnGhost} onClick={() => setModalData(null)}>Batal</button>
                            <button className={styles.btnPrimary} onClick={handleSaveShift}>Simpan</button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
