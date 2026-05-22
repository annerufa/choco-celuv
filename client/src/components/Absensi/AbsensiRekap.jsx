// components/AbsensiTable/AbsensiRekap.jsx
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import styles from './AbsensiTable.module.css';
// Tambahkan di bagian atas file, setelah import lainnya
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

function authApi() {
    return axios.create({
        baseURL: API,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
// function formatJam(dt) {
//     if (!dt) return '–';
//     return new Date(dt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
// }
// Helper: konversi "HH:mm:ss" atau datetime ke Date object hari ini
function toDate(val) {
    if (!val) return null;
    // Kalau format TIME "HH:mm:ss" atau "HH:mm"
    if (typeof val === 'string' && val.length <= 8 && val.includes(':')) {
        const [h, m, s] = val.split(':').map(Number);
        const d = new Date();
        d.setHours(h, m, s ?? 0, 0);
        return d;
    }
    // Kalau datetime lengkap
    return new Date(val);
}
function formatJam(dt) {
    if (!dt) return '–';
    if (typeof dt === 'string' && dt.length <= 8 && dt.includes(':')) {
        return dt.slice(0, 5);
    }
    return new Date(dt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function formatTanggal(d) {
    if (!d) return '–';
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function selisihMenit(clockIn, expectedIn) {
    if (!clockIn || !expectedIn) return null;
    const actual = toDate(clockIn);
    const [h, m] = expectedIn.split(':').map(Number);
    const expected = new Date();
    expected.setHours(h, m, 0, 0);
    return Math.round((actual - expected) / 60000);
}

function selisihPulang(clockOut, expectedOut) {
    if (!clockOut || !expectedOut) return null;
    const actual = toDate(clockOut);
    const [h, m] = expectedOut.split(':').map(Number);
    const expected = new Date();
    expected.setHours(h, m, 0, 0);
    return Math.round((actual - expected) / 60000);
}

// Durasi (formatDurasi juga perlu diupdate)
function formatDurasi(clockIn, clockOut) {
    if (!clockIn || !clockOut) return null;
    const menit = Math.round((toDate(clockOut) - toDate(clockIn)) / 60000);
    if (isNaN(menit) || menit < 0) return null;
    return formatMenit(menit);
}
function getDefaultRange() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const fmt = d => d.toISOString().slice(0, 10);
    return { start: fmt(firstDay), end: fmt(now) };
}
function formatMenit(menit) {
    if (menit === null || isNaN(menit)) return null;
    const jam = Math.floor(Math.abs(menit) / 60);
    const sisa = Math.abs(menit) % 60;
    if (jam === 0) return `${sisa} menit`;
    if (sisa === 0) return `${jam} jam`;
    return `${jam} jam ${sisa} menit`;
}
const statusVariant = {
    hadir: { cls: 'success', label: 'Hadir' },
    terlambat: { cls: 'warning', label: 'Terlambat' },
    absen: { cls: 'danger', label: 'Absen' },
    izin: { cls: 'accent', label: 'Izin' },
    sakit: { cls: 'brown', label: 'Sakit' },
    libur: { cls: 'grey', label: 'Libur' },
};

// ── Leaflet Map ───────────────────────────────────────────────────────────────
function DetailMap({ boothLat, boothLon, clockInLat, clockInLon, clockOutLat, clockOutLon }) {
    const mapRef = useRef(null);

    useEffect(() => {
        if (!boothLat || !boothLon) return;
        if (!mapRef.current) return;
        if (mapRef.current._leaflet_id) return;

        const map = L.map(mapRef.current, {
            zoomControl: false, attributionControl: false,
            dragging: false, scrollWheelZoom: false,
            touchZoom: false, doubleClickZoom: false,
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);

        // Radius booth
        L.circle([boothLat, boothLon], {
            radius: 100, color: '#c47b10', fillColor: '#c47b10',
            fillOpacity: 0.08, weight: 1.5, dashArray: '4 4',
        }).addTo(map);

        // Marker booth
        const boothIcon = L.divIcon({
            html: `<div style="width:24px;height:24px;background:#c47b10;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.2)"></div>`,
            iconSize: [24, 24], iconAnchor: [12, 24], className: '',
        });
        L.marker([boothLat, boothLon], { icon: boothIcon }).addTo(map).bindPopup('<b>📍 Booth</b>');

        const points = [[boothLat, boothLon]];

        if (clockInLat && clockInLon) {
            points.push([clockInLat, clockInLon]);
            const inIcon = L.divIcon({
                html: `<div style="width:14px;height:14px;background:#2e8a56;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.2)"></div>`,
                iconSize: [14, 14], iconAnchor: [7, 7], className: '',
            });
            L.marker([clockInLat, clockInLon], { icon: inIcon }).addTo(map).bindPopup('<b>✅ Clock In</b>');
        }

        if (clockOutLat && clockOutLon) {
            points.push([clockOutLat, clockOutLon]);
            const outIcon = L.divIcon({
                html: `<div style="width:14px;height:14px;background:#c0392b;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.2)"></div>`,
                iconSize: [14, 14], iconAnchor: [7, 7], className: '',
            });
            L.marker([clockOutLat, clockOutLon], { icon: outIcon }).addTo(map).bindPopup('<b>🔴 Clock Out</b>');
        }

        if (points.length > 1) {
            map.fitBounds(L.latLngBounds(points), { padding: [30, 30] });
        } else {
            map.setView([boothLat, boothLon], 17);
        }

        return () => {
            map.remove();
        };
    }, [boothLat, boothLon, clockInLat, clockInLon, clockOutLat, clockOutLon]);
    return (
        <div style={{ position: 'relative' }}>
            <div ref={mapRef} style={{ width: '100%', height: 200, borderRadius: 10, overflow: 'hidden' }} />
            <div style={{ position: 'absolute', inset: 0, borderRadius: 10, zIndex: 1 }} />
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 10;

export default function AbsensiRekap() {
    const def = getDefaultRange();
    const [startDate, setStartDate] = useState(def.start);
    const [endDate, setEndDate] = useState(def.end);
    const [employeeId, setEmployeeId] = useState('');
    const [data, setData] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [drawerItem, setDrawerItem] = useState(null);

    // Fetch employee list untuk dropdown
    useEffect(() => {
        authApi().get('/karyawan/penjaga')
            .then(r => setEmployees(r.data?.payload?.data ?? []))
            .catch(() => { });
    }, []);

    // Fetch rekap
    const fetchRekap = async () => {
        setLoading(true);
        setCurrentPage(1);
        try {
            const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
            if (employeeId) params.append('employee_id', employeeId);
            const r = await authApi().get(`/attendance/range?${params}`);
            const result = r.data?.payload?.data ?? [];

            console.log('rekap data:', result);
            console.log('sample item[0]:', result[0]); // lihat struktur 1 item
            setData(result);
        } catch {
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    // Auto fetch saat mount
    useEffect(() => { fetchRekap(); }, []);

    // ── Pagination ────────────────────────────────────────────
    const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
    const paginated = data.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
        .reduce((acc, page, i, arr) => {
            if (i > 0 && page - arr[i - 1] > 1) acc.push('...');
            acc.push(page);
            return acc;
        }, []);

    // ── Print ─────────────────────────────────────────────────────────────────
    const handlePrint = () => {
        const printContent = document.getElementById('rekap-print-area');
        const win = window.open('', '_blank');
        win.document.write(`
            <html><head>
            <title>Rekap Absensi</title>
            <style>
                body { font-family: sans-serif; font-size: 12px; color: #1a1309; }
                table { width: 100%; border-collapse: collapse; }
                th { background: #f7f5f2; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e6e0d8; }
                td { padding: 8px 10px; border-bottom: 1px solid #eeeae4; }
                h2 { margin-bottom: 4px; }
                p { color: #6b5a42; margin-bottom: 12px; font-size: 11px; }
                @media print { button { display: none; } }
            </style>
            </head><body>
            <h2>Rekap Absensi</h2>
            <p>${startDate} s/d ${endDate}${employeeId ? ' · ' + (employees.find(e => String(e.id) === String(employeeId))?.name ?? '') : ' · Semua Karyawan'}</p>
            ${printContent.innerHTML}
            </body></html>
        `);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); win.close(); }, 300);
    };

    // ── Download Excel ─────────────────────────────────────────────────────────
    const handleDownload = () => {
        if (data.length === 0) return;

        const employeeName = employeeId
            ? (employees.find(e => String(e.id) === String(employeeId))?.name ?? 'Karyawan')
            : 'Semua Karyawan';

        const rows = data.map((item, idx) => {
            const menit = selisihMenit(item.clock_in, item.expected_clock_in);
            const sp = selisihPulang(item.clock_out, item.expected_clock_out);
            const durasi = formatDurasi(item.clock_in, item.clock_out);
            const sv = statusVariant[item.status] ?? { label: '–' };

            return {
                'No': idx + 1,
                'Karyawan': item.employee_name,
                'Tanggal': formatTanggal(item.date),
                'Booth': item.booth_name,
                'Shift': item.shift,
                'Jadwal Masuk': item.expected_clock_in?.slice(0, 5) ?? '–',
                'Jadwal Keluar': item.expected_clock_out?.slice(0, 5) ?? '–',
                'Jam Masuk': formatJam(item.clock_in),
                'Keterlambatan (mnt)': menit === null ? '' : menit <= 0 ? 0 : menit,
                'Jam Keluar': formatJam(item.clock_out),
                'Lebih Awal (mnt)': sp === null ? '' : sp < 0 ? Math.abs(sp) : 0,
                'Durasi Kerja': durasi ?? '–',
                'Lokasi Masuk': item.location_in_valid === true ? 'Valid' : item.location_in_valid === false ? 'Di luar radius' : '–',
                'Lokasi Keluar': item.location_out_valid === true ? 'Valid' : item.location_out_valid === false ? 'Di luar radius' : '–',
                'Status': sv.label,
                'Catatan': item.notes ?? '',
            };
        });

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Rekap Absensi');
        XLSX.writeFile(wb, `rekap-absensi_${startDate}_${endDate}_${employeeName.replace(/\s+/g, '-')}.xlsx`);
    };

    return (
        <>
            <div className={styles.card}>
                {/* Header + Filter */}
                <div className={styles.cardHeader} style={{ flexWrap: 'wrap', gap: 12 }}>
                    <span className={styles.cardTitle}>Rekap Absensi</span>
                    <div className={styles.cardActions} style={{ flexWrap: 'wrap' }}>
                        {/* Filter karyawan */}
                        <select
                            className={styles.filterSelect}
                            value={employeeId}
                            onChange={e => setEmployeeId(e.target.value)}
                        >
                            <option value="">Semua Karyawan</option>
                            {employees.map(e => (
                                <option key={e.id} value={e.id}>{e.name}</option>
                            ))}
                        </select>

                        {/* Range tanggal */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input
                                type="date"
                                className={styles.filterDate}
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                            <span style={{ fontSize: 12, color: 'var(--brown-400)' }}>–</span>
                            <input
                                type="date"
                                className={styles.filterDate}
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                            />
                        </div>

                        <button className={styles.btnPrimary} onClick={fetchRekap} disabled={loading}>
                            {loading ? 'Memuat...' : 'Tampilkan'}
                        </button>

                        {/* Divider */}
                        {data.length > 0 && (
                            <div style={{ width: 1, height: 24, background: 'var(--brown-100)', margin: '0 4px' }} />
                        )}

                        {/* Download Excel */}
                        {data.length > 0 && (
                            <button className={styles.btnGhost} onClick={handleDownload} title="Download Excel">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 14, height: 14 }}>
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                Excel
                            </button>
                        )}

                        {/* Print */}
                        {data.length > 0 && (
                            <button className={styles.btnGhost} onClick={handlePrint} title="Print">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 14, height: 14 }}>
                                    <polyline points="6 9 6 2 18 2 18 9" />
                                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                    <rect x="6" y="14" width="12" height="8" />
                                </svg>
                                Print
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabel */}
                <div className={styles.tableWrap} id="rekap-print-area">
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Karyawan</th>
                                <th>Tanggal</th>
                                <th>Booth</th>
                                <th>Shift</th>
                                <th>Jam Masuk</th>
                                <th>Keterlambatan</th>
                                <th>Jam Keluar</th>
                                <th>Lebih Awal</th>
                                <th>Durasi</th>
                                <th>Lokasi</th>
                                <th>Status</th>
                                <th>Detail</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={12} className={styles.stateCell}>Memuat data...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={12} className={styles.stateCell}>Tidak ada data untuk periode ini</td></tr>
                            ) : (
                                paginated.map((item, idx) => {
                                    const sv = statusVariant[item.status] ?? { cls: 'grey', label: '–' };
                                    const menit = selisihMenit(item.clock_in, item.expected_clock_in);
                                    return (
                                        <tr key={item.id}>
                                            <td className={styles.idCell}>{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                                            <td className={styles.namaCell}>{item.employee_name}</td>
                                            <td className={styles.monoCell}>{formatTanggal(item.date)}</td>
                                            <td>{item.booth_name}</td>
                                            <td>
                                                <span className={`${styles.pill} ${styles[item.shift === 'pagi' ? 'success' : 'warning']}`}>
                                                    {item.shift?.charAt(0).toUpperCase() + item.shift?.slice(1)}
                                                </span>
                                            </td>
                                            <td className={styles.monoCell}>{formatJam(item.clock_in)}</td>
                                            <td>{(() => {
                                                const m = selisihMenit(item.clock_in, item.expected_clock_in);
                                                if (m === null) return <span style={{ color: 'var(--brown-300)' }}>–</span>;
                                                if (m <= 0) return <span style={{ color: 'var(--success)', fontSize: 12, fontWeight: 600 }}>Tepat</span>;
                                                return <span style={{ color: 'var(--warning)', fontSize: 12, fontWeight: 600 }}>+{formatMenit(m)}</span>;
                                            })()}</td>
                                            <td className={styles.monoCell}>{formatJam(item.clock_out)}</td>
                                            <td>{(() => {
                                                const sp = selisihPulang(item.clock_out, item.expected_clock_out);
                                                if (sp === null) return <span style={{ color: 'var(--brown-300)' }}>–</span>;
                                                if (Math.abs(sp) <= 5) return <span style={{ color: 'var(--success)', fontSize: 12, fontWeight: 600 }}>Tepat</span>;
                                                if (sp < 0) return <span style={{ color: 'var(--brown-400)', fontSize: 12, fontWeight: 600 }}>{formatMenit(sp)} lebih awal</span>;
                                                return <span style={{ color: 'var(--success)', fontSize: 12, fontWeight: 600 }}>+{formatMenit(sp)} lembur</span>;
                                            })()}</td>
                                            <td style={{ fontSize: 12, fontWeight: 600, color: 'var(--brown-600)' }}>
                                                {formatDurasi(item.clock_in, item.clock_out) ?? '–'}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                    {item.clock_in && (
                                                        <span style={{ fontSize: 11, color: item.location_in_valid ? 'var(--success)' : item.location_in_valid === false ? 'var(--danger)' : 'var(--brown-300)' }}>
                                                            {item.location_in_valid === true ? '✓ In' : item.location_in_valid === false ? '✗ In' : '– In'}
                                                        </span>
                                                    )}
                                                    {item.clock_out && (
                                                        <span style={{ fontSize: 11, color: item.location_out_valid ? 'var(--success)' : item.location_out_valid === false ? 'var(--danger)' : 'var(--brown-300)' }}>
                                                            {item.location_out_valid === true ? '✓ Out' : item.location_out_valid === false ? '✗ Out' : '– Out'}
                                                        </span>
                                                    )}
                                                    {!item.clock_in && <span style={{ color: 'var(--brown-300)', fontSize: 11 }}>–</span>}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`${styles.pill} ${styles[sv.cls]}`}>{sv.label}</span>
                                            </td>
                                            <td>
                                                <button
                                                    className={styles.iconBtn}
                                                    onClick={() => setDrawerItem(item)}
                                                    aria-label="Lihat detail"
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                        <circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className={styles.tableFooter}>
                    <span>Menampilkan {paginated.length} dari {data.length} record</span>
                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button className={styles.pageBtn} onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                            </button>
                            {pageNumbers.map((page, i) =>
                                page === '...' ? (
                                    <span key={`e-${i}`} className={styles.pageEllipsis}>...</span>
                                ) : (
                                    <button
                                        key={page}
                                        className={`${styles.pageBtn} ${page === currentPage ? styles.active : ''}`}
                                        onClick={() => setCurrentPage(page)}
                                    >{page}</button>
                                )
                            )}
                            <button className={styles.pageBtn} onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Drawer */}
            {drawerItem && (
                <>
                    <div className={styles.drawerBackdrop} onClick={() => setDrawerItem(null)} />
                    <div className={styles.drawer}>
                        <div className={styles.drawerHead}>
                            <div className={styles.drawerInfo}>
                                <div className={styles.drawerName}>{drawerItem.employee_name}</div>
                                <div className={styles.drawerId}>{formatTanggal(drawerItem.date)} · {drawerItem.booth_name}</div>
                            </div>
                            <button className={styles.drawerClose} onClick={() => setDrawerItem(null)}>✕</button>
                        </div>
                        <div className={styles.drawerBody}>
                            {/* Peta */}
                            {drawerItem.booth_lat && (
                                <div style={{ marginBottom: 20 }}>
                                    <div className={styles.detailSectionTitle}>Peta Lokasi</div>
                                    <DetailMap
                                        boothLat={Number(drawerItem.booth_lat)}
                                        boothLon={Number(drawerItem.booth_lon)}
                                        clockInLat={drawerItem.lat_in ? Number(drawerItem.lat_in) : null}
                                        clockInLon={drawerItem.lon_in ? Number(drawerItem.lon_in) : null}
                                        clockOutLat={drawerItem.lat_out ? Number(drawerItem.lat_out) : null}
                                        clockOutLon={drawerItem.lon_out ? Number(drawerItem.lon_out) : null}
                                    />
                                    <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 11, color: 'var(--brown-400)' }}>
                                        <span>🟡 Booth</span>
                                        <span>🟢 Clock In</span>
                                        {drawerItem.clock_out && <span>🔴 Clock Out</span>}
                                    </div>
                                </div>
                            )}

                            {/* Detail info */}
                            <div className={styles.detailSection}>
                                <div className={styles.detailSectionTitle}>Detail Absensi</div>
                                {[
                                    ['Status', <span className={`${styles.pill} ${styles[statusVariant[drawerItem.status]?.cls ?? 'grey']}`}>{statusVariant[drawerItem.status]?.label ?? '–'}</span>],
                                    ['Shift', drawerItem.shift],
                                    ['Jadwal Masuk', drawerItem.expected_clock_in?.slice(0, 5) ?? '–'],
                                    ['Jadwal Keluar', drawerItem.expected_clock_out?.slice(0, 5) ?? '–'],
                                    ['Jam Masuk', formatJam(drawerItem.clock_in)],
                                    ['Jam Keluar', formatJam(drawerItem.clock_out)],
                                    ['Keterlambatan', (() => {
                                        const m = selisihMenit(drawerItem.clock_in, drawerItem.expected_clock_in);
                                        if (m === null) return '–';
                                        if (m <= 0) return <span style={{ color: 'var(--success)', fontWeight: 600 }}>Tepat waktu</span>;
                                        return <span style={{ color: 'var(--warning)', fontWeight: 600 }}>+{m} menit</span>;
                                    })()],
                                    ['Lebih Awal', (() => {
                                        const sp = selisihPulang(drawerItem.clock_out, drawerItem.expected_clock_out);
                                        if (sp === null) return '–';
                                        if (Math.abs(sp) <= 5) return <span style={{ color: 'var(--success)', fontWeight: 600 }}>Tepat waktu</span>;
                                        if (sp < 0) return <span style={{ color: 'var(--brown-500)', fontWeight: 600 }}>{Math.abs(sp)} menit lebih awal</span>;
                                        return <span style={{ color: 'var(--success)', fontWeight: 600 }}>Lembur {sp} menit</span>;
                                    })()],
                                    ['Durasi Kerja', (() => {
                                        const d = formatDurasi(drawerItem.clock_in, drawerItem.clock_out);
                                        return d ?? '–';
                                    })()],
                                    ['Lokasi Masuk', drawerItem.location_in_valid === true ? <span style={{ color: 'var(--success)' }}>✓ Valid</span> : drawerItem.location_in_valid === false ? <span style={{ color: 'var(--danger)' }}>✗ Di luar radius</span> : '–'],
                                    ['Lokasi Keluar', drawerItem.location_out_valid === true ? <span style={{ color: 'var(--success)' }}>✓ Valid</span> : drawerItem.location_out_valid === false ? <span style={{ color: 'var(--danger)' }}>✗ Di luar radius</span> : '–'],
                                    ...(drawerItem.notes ? [['Catatan', drawerItem.notes]] : []),
                                ].map(([key, val]) => (
                                    <div key={key} className={styles.detailRow}>
                                        <span className={styles.detailKey}>{key}</span>
                                        <span className={styles.detailVal}>{val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}