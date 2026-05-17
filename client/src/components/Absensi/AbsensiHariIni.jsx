// components/AbsensiTable/AbsensiHariIni.jsx
import { useState } from 'react';
import styles from './AbsensiTable.module.css';
import StatusModal from './StatusModal';

const statusVariant = {
    hadir:     { cls: 'success', label: 'Hadir' },
    terlambat: { cls: 'warning', label: 'Terlambat' },
    absen:     { cls: 'danger',  label: 'Absen' },
    izin:      { cls: 'accent',  label: 'Izin' },
    sakit:     { cls: 'brown',   label: 'Sakit' },
    libur:     { cls: 'grey',    label: 'Libur' },
};

function formatJam(dt) {
    if (!dt) return '–';
    return new Date(dt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function selisihMenit(clockIn, expectedIn) {
    if (!clockIn || !expectedIn) return null;
    const actual = new Date(clockIn);
    const [h, m] = expectedIn.split(':').map(Number);
    const expected = new Date(actual);
    expected.setHours(h, m, 0, 0);
    return Math.round((actual - expected) / 60000);
}

function SelisihBadge({ menit }) {
    if (menit === null) return <span style={{ color: 'var(--brown-400)' }}>–</span>;
    if (menit <= 0) return <span style={{ color: 'var(--success)', fontSize: 12, fontWeight: 600 }}>Tepat waktu</span>;
    return (
        <span style={{ color: 'var(--warning)', fontSize: 12, fontWeight: 600 }}>
            +{menit} mnt
        </span>
    );
}

function LokasiDot({ valid }) {
    if (valid === null || valid === undefined) return <span style={{ color: 'var(--brown-300)' }}>–</span>;
    return valid
        ? <span style={{ color: 'var(--success)', fontSize: 12 }}>✓ Valid</span>
        : <span style={{ color: 'var(--danger)', fontSize: 12 }}>✗ Di luar</span>;
}

export default function AbsensiHariIni({ data = [], loading, error, onUbahStatus }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusModal, setStatusModal] = useState({ isOpen: false, item: null });
    const [actionLoading, setActionLoading] = useState(null);

    const filtered = data.filter(d =>
        d.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.booth_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleUbahStatus = async (status, notes) => {
        const item = statusModal.item;
        setActionLoading(item.employee_id);
        try {
            await onUbahStatus(
                item.employee_id,
                item.booth_id,
                item.schedule_id,
                item.shift,
                status,
                notes,
            );
            setStatusModal({ isOpen: false, item: null });
        } catch {
            // error sudah ditangani di parent
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <>
            <div className={styles.card}>
                {/* Header */}
                <div className={styles.cardHeader}>
                    <div>
                        <span className={styles.cardTitle}>Absensi Hari Ini</span>
                        <span style={{ fontSize: 12, color: 'var(--brown-400)', marginLeft: 10 }}>
                            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                    <div className={styles.cardActions}>
                        {/* Summary pills */}
                        {['hadir', 'terlambat', 'belum', 'izin', 'sakit'].map(s => {
                            const count = s === 'belum'
                                ? data.filter(d => !d.clock_in && !d.status).length
                                : data.filter(d => d.status === s).length;
                            if (count === 0) return null;
                            return (
                                <span key={s} className={`${styles.pill} ${styles[statusVariant[s]?.cls ?? 'grey']}`}>
                                    {count} {s === 'belum' ? 'belum absen' : statusVariant[s]?.label}
                                </span>
                            );
                        })}
                        <div className={styles.searchBox}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Cari karyawan atau booth..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Tabel */}
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Karyawan</th>
                                <th>Booth</th>
                                <th>Shift</th>
                                <th>Seharusnya</th>
                                <th>Jam Masuk</th>
                                <th>Selisih</th>
                                <th>Jam Keluar</th>
                                <th>Lokasi</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={11} className={styles.stateCell}>Memuat data...</td></tr>
                            ) : error ? (
                                <tr><td colSpan={11} className={styles.stateCell} style={{ color: 'var(--danger)' }}>Gagal memuat data</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={11} className={styles.stateCell}>Tidak ada data</td></tr>
                            ) : (
                                filtered.map((item, idx) => {
                                    const belumAbsen = !item.clock_in && !item.status;
                                    const menit = selisihMenit(item.clock_in, item.expected_clock_in);
                                    const sv = statusVariant[item.status] ?? { cls: 'grey', label: 'Belum Absen' };

                                    return (
                                        <tr key={item.employee_id} style={{ opacity: actionLoading === item.employee_id ? 0.5 : 1 }}>
                                            <td className={styles.idCell}>{idx + 1}</td>
                                            <td className={styles.namaCell}>{item.employee_name}</td>
                                            <td>{item.booth_name}</td>
                                            <td>
                                                <span className={`${styles.pill} ${styles[item.shift === 'pagi' ? 'success' : 'warning']}`}>
                                                    {item.shift?.charAt(0).toUpperCase() + item.shift?.slice(1)}
                                                </span>
                                            </td>
                                            <td className={styles.monoCell}>
                                                {item.expected_clock_in?.slice(0, 5) ?? '–'} – {item.expected_clock_out?.slice(0, 5) ?? '–'}
                                            </td>
                                            <td className={styles.monoCell}>{formatJam(item.clock_in)}</td>
                                            <td><SelisihBadge menit={menit} /></td>
                                            <td className={styles.monoCell}>{formatJam(item.clock_out)}</td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                    <LokasiDot valid={item.location_in_valid} />
                                                    {item.clock_out && <LokasiDot valid={item.location_out_valid} />}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`${styles.pill} ${styles[sv.cls]}`}>
                                                    {item.status ? sv.label : 'Belum Absen'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className={styles.actionBtns}>
                                                    {belumAbsen && (
                                                        <button
                                                            className={styles.btnUbahStatus}
                                                            onClick={() => setStatusModal({ isOpen: true, item })}
                                                            disabled={actionLoading === item.employee_id}
                                                        >
                                                            Ubah Status
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className={styles.tableFooter}>
                    <span>
                        {filtered.length} dari {data.length} karyawan
                    </span>
                </div>
            </div>

            <StatusModal
                isOpen={statusModal.isOpen}
                item={statusModal.item}
                onClose={() => setStatusModal({ isOpen: false, item: null })}
                onSubmit={handleUbahStatus}
                loading={actionLoading === statusModal.item?.employee_id}
            />
        </>
    );
}
