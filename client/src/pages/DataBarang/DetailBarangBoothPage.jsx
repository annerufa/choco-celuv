// src/pages/DataBarang/DetailBarangBoothPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './DetailBarangPage.module.css';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

function getToken() {
    return localStorage.getItem('token');
}

function formatRp(val) {
    if (!val && val !== 0) return '-';
    return `Rp ${Number(val).toLocaleString('id')}`;
}

function formatTgl(val) {
    if (!val) return '-';
    return new Date(val).toLocaleDateString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
}

const movementVariant = {
    'IN': { label: 'Masuk', cls: 'in' },
    'OUT': { label: 'Keluar', cls: 'out' },
};

const sourceLabel = {
    'PEMBELIAN': 'Pembelian',
    'PEMBATALAN PEMBELIAN': 'Batal Beli',
    'PRODUKSI': 'Produksi',
    'DISTRIBUSI': 'Distribusi',
    'KOREKSI': 'Penyesuaian',
};

const stokStatusVariant = {
    'Aman': 'success',
    'Overstock': 'warning',
    'Menipis': 'warning',
    'Kritis': 'danger',
    'Habis': 'danger',
};

function getStokStatus(stok, min, max, safetyStock) {
    stok = parseFloat(stok);
    min = parseFloat(min);
    max = parseFloat(max);
    safetyStock = parseFloat(safetyStock);
    if (stok <= 0) return 'Habis';
    if (stok <= safetyStock) return 'Kritis';
    if (stok <= min) return 'Menipis';
    if (stok > max) return 'Overstock';
    return 'Aman';
}

function getRangeDates(range) {
    const to = new Date();
    const from = new Date();
    if (range === '7d') from.setDate(to.getDate() - 7);
    else if (range === '30d') from.setDate(to.getDate() - 30);
    else if (range === '3m') from.setMonth(to.getMonth() - 3);
    else return null;
    return {
        from: from.toISOString().slice(0, 10),
        to: to.toISOString().slice(0, 10),
    };
}

export default function DetailBarangBoothPage() {
    const { item_id, booth_id } = useParams();
    const navigate = useNavigate();

    const [item, setItem] = useState(null);
    const [boothStok, setBoothStok] = useState(null); // stok spesifik booth ini
    const [boothName, setBoothName] = useState('');
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // filter riwayat
    const [movRange, setMovRange] = useState('30d');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const [movLoading, setMovLoading] = useState(false);

    // Fetch item info + stok booth
    useEffect(() => {
        async function fetchAll() {
            setLoading(true);
            setError(null);
            try {
                const headers = { Authorization: `Bearer ${getToken()}` };

                const [resItem, resStok] = await Promise.all([
                    fetch(`${BASE_URL}/items/${item_id}`, { headers }),
                    fetch(`${BASE_URL}/items/stockPer?item_id=${item_id}`, { headers }),
                ]);

                const [jItem, jStok] = await Promise.all([
                    resItem.json(), resStok.json()
                ]);

                if (!resItem.ok) throw new Error(jItem.payload?.message ?? 'Barang tidak ditemukan');

                setItem(jItem.payload?.data ?? jItem);

                // Cari data stok spesifik booth ini
                const allStok = Array.isArray(jStok.payload?.data) ? jStok.payload.data : (Array.isArray(jStok) ? jStok : []);
                const thisBooth = allStok.find(s => String(s.location_id) === String(booth_id));
                setBoothStok(thisBooth ?? null);
                setBoothName(thisBooth?.location_name ?? `Booth ${booth_id}`);

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchAll();
    }, [item_id, booth_id]);

    // Fetch movements — filter per item + booth
    useEffect(() => {
        if (!item_id || !booth_id) return;

        async function fetchMovements() {
            setMovLoading(true);
            try {
                const headers = {
                    Authorization: `Bearer ${getToken()}`,
                    'Cache-Control': 'no-cache',
                };
                let dateFrom, dateTo;

                if (movRange === 'custom') {
                    if (!customFrom || !customTo) { setMovLoading(false); return; }
                    dateFrom = customFrom;
                    dateTo = customTo;
                } else {
                    const dates = getRangeDates(movRange);
                    dateFrom = dates.from;
                    dateTo = dates.to;
                }

                const url = `${BASE_URL}/items/trackItem?item_id=${item_id}&location_id=${booth_id}&limit=200&date_from=${dateFrom}&date_to=${dateTo}`;
                const res = await fetch(url, { headers });
                const json = await res.json();
                const raw = Array.isArray(json.payload?.data) ? json.payload.data : (Array.isArray(json) ? json : []);
                setMovements(raw);
            } catch (err) {
                console.error('Gagal fetch movements:', err);
            } finally {
                setMovLoading(false);
            }
        }

        fetchMovements();
    }, [item_id, booth_id, movRange, customFrom, customTo]);

    // Hitung saldo running
    const movWithSaldo = (() => {
        const sorted = [...movements].sort(
            (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
        let saldo = 0;
        const withSaldo = sorted.map(mov => {
            const qty = Number(mov.qty ?? 0);
            saldo += mov.movement_type === 'IN' ? qty : -qty;
            return { ...mov, saldo_after: saldo };
        });
        return withSaldo.reverse();
    })();

    // ── Loading & Error ───────────────────────────────────
    if (loading) return (
        <div className={styles.page}>
            <div className={styles.loadingWrap}>
                <div className={styles.spinner} />
                <span>Memuat data barang booth...</span>
            </div>
        </div>
    );

    if (error) return (
        <div className={styles.page}>
            <div className={styles.errorWrap}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="40" height="40">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p>{error}</p>
                <button className={styles.btnGhost} onClick={() => navigate('/barang-booth')}>Kembali</button>
            </div>
        </div>
    );

    const stokBooth = parseFloat(boothStok?.current_stock ?? 0);
    const stokStatus = boothStok
        ? getStokStatus(boothStok.current_stock, boothStok.min_qty, boothStok.max_qty, boothStok.safety_stock)
        : 'Nonaktif';

    // Progress bar stok
    const progressPct = boothStok && parseFloat(boothStok.max_qty) > 0
        ? Math.max(0, Math.min(100, (stokBooth / parseFloat(boothStok.max_qty)) * 100))
        : 0;

    const progressColor = stokStatus === 'Habis' || stokStatus === 'Kritis'
        ? 'var(--danger)'
        : stokStatus === 'Menipis'
            ? 'var(--warning)'
            : stokStatus === 'Overstock'
                ? 'var(--warning)'
                : 'var(--success)';


    // ── Export Excel ─────────────────────────────────────
    function handleExportExcel() {
        const periodLabel = movRange === '7d' ? '7 Hari'
            : movRange === '30d' ? '30 Hari'
                : movRange === '3m' ? '3 Bulan'
                    : `${customFrom} sd ${customTo}`;

        const rows = movWithSaldo.map(mov => ({
            'Tanggal': formatTgl(mov.created_at),
            'Tipe': movementVariant[mov.movement_type]?.label ?? mov.movement_type,
            'Transaksi': sourceLabel[mov.source_type] ?? mov.source_type,
            [`Qty (${item?.unit})`]: `${mov.movement_type === 'IN' ? '+' : '-'}${parseFloat(mov.qty)}`,
            [`Saldo (${item?.unit})`]: Number(mov.saldo_after).toLocaleString('id'),
        }));

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Riwayat Stok');

        // Header info di atas tabel
        XLSX.utils.sheet_add_aoa(ws, [
            [`Riwayat Pergerakan Stok - ${item?.name}`],
            [`Booth: ${boothName}`],
            [`Periode: ${periodLabel}`],
            [],
        ], { origin: 'A1' });
        XLSX.utils.sheet_add_json(ws, rows, { origin: 'A5' });

        XLSX.writeFile(wb, `riwayat-stok_${item?.name}_${boothName}_${periodLabel}.xlsx`);
    }

    // ── Export PDF ───────────────────────────────────────
    function handleExportPDF() {
        const periodLabel = movRange === '7d' ? '7 Hari'
            : movRange === '30d' ? '30 Hari'
                : movRange === '3m' ? '3 Bulan'
                    : `${customFrom} s/d ${customTo}`;

        const doc = new jsPDF({ orientation: 'landscape' });

        // Header
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text(`Riwayat Pergerakan Stok — ${item?.name}`, 14, 16);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Booth: ${boothName}`, 14, 23);
        doc.text(`Periode: ${periodLabel}`, 14, 29);
        doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}`, 14, 35);

        // Tabel
        autoTable(doc, {
            startY: 41,
            head: [['Tanggal', 'Tipe', 'Transaksi', `Qty (${item?.unit})`, `Saldo (${item?.unit})`]],
            body: movWithSaldo.map(mov => [
                formatTgl(mov.created_at),
                movementVariant[mov.movement_type]?.label ?? mov.movement_type,
                sourceLabel[mov.source_type] ?? mov.source_type,
                `${mov.movement_type === 'IN' ? '+' : '-'}${parseFloat(mov.qty)}`,
                Number(mov.saldo_after).toLocaleString('id'),
            ]),
            styles: { fontSize: 9 },
            headStyles: { fillColor: [93, 53, 25] }, // coklat choco celuv
            alternateRowStyles: { fillColor: [250, 245, 240] },
            columnStyles: {
                3: { halign: 'right' },
                4: { halign: 'right', fontStyle: 'bold' },
            },
        });

        doc.save(`riwayat-stok_${item?.name}_${boothName}_${periodLabel}.pdf`);
    }
    return (
        <div className={styles.page}>

            {/* ── Breadcrumb & Back ─────────────────────── */}
            <div className={styles.pageHeader}>
                <button className={styles.backBtn} onClick={() => navigate('/barang-booth')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Kembali
                </button>
                <div className={styles.breadcrumb}>
                    <span onClick={() => navigate('/barang-booth')} className={styles.breadcrumbLink}>
                        Data Barang Booth
                    </span>
                    › {item?.name}
                    › {boothName}
                </div>
            </div>

            {/* ── Hero card ────────────────────────────── */}
            <div className={styles.heroCard}>
                <div className={styles.heroLeft}>
                    <div className={styles.itemIcon}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                    </div>
                    <div>
                        <h1 className={styles.itemName}>{item?.name}</h1>
                        <div className={styles.itemMeta}>
                            <span className={`${styles.pill} ${styles.pillBrown}`}>{item?.category}</span>
                            <span className={styles.metaDot}>·</span>
                            <span className={styles.metaText}>Booth: <strong>{boothName}</strong></span>
                            <span className={styles.metaDot}>·</span>
                            <span className={`${styles.pill} ${styles[stokStatusVariant[stokStatus] ? stokStatusVariant[stokStatus] : 'pillBrown']}`}>
                                {stokStatus}
                            </span>
                        </div>
                    </div>
                </div>
                <div className={styles.heroStats}>
                    <div className={styles.heroStat}>
                        <span className={styles.heroStatLabel}>Stok di Booth</span>
                        <span className={styles.heroStatValue}>
                            {stokBooth} <small>{item?.unit}</small>
                        </span>
                    </div>
                    <div className={styles.heroStatDivider} />
                    <div className={styles.heroStat}>
                        <span className={styles.heroStatLabel}>Batas Min</span>
                        <span className={styles.heroStatValue}>
                            {parseFloat(boothStok?.min_qty ?? 0)} <small>{item?.unit}</small>
                        </span>
                    </div>
                    <div className={styles.heroStatDivider} />
                    <div className={styles.heroStat}>
                        <span className={styles.heroStatLabel}>Batas Max</span>
                        <span className={styles.heroStatValue}>
                            {parseFloat(boothStok?.max_qty ?? 0)} <small>{item?.unit}</small>
                        </span>
                    </div>
                    <div className={styles.heroStatDivider} />
                    <div className={styles.heroStat}>
                        <span className={styles.heroStatLabel}>Safety Stock</span>
                        <span className={styles.heroStatValue}>
                            {parseFloat(boothStok?.safety_stock ?? 0)} <small>{item?.unit}</small>
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Grid bawah ───────────────────────────── */}
            <div className={styles.grid}>

                {/* Info stok booth — progress bar */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardTitle}>Status Stok di {boothName}</span>
                    </div>
                    {!boothStok ? (
                        <div className={styles.emptyState}>Barang tidak aktif di booth ini</div>
                    ) : (
                        <div className={styles.lokList}>
                            <div className={styles.lokRow}>
                                <div className={styles.lokInfo}>
                                    <span className={styles.lokName}>{boothName}</span>
                                    <span className={styles.lokType}>booth</span>
                                </div>
                                <div className={styles.lokRight}>
                                    <span className={styles.lokStok}>
                                        {stokBooth} <small>{item?.unit}</small>
                                    </span>
                                    <span className={`${styles.pill} ${styles[stokStatusVariant[stokStatus] ?? 'pillBrown']}`}>
                                        {stokStatus}
                                    </span>
                                </div>
                                <div className={styles.lokProgress}>
                                    <div
                                        className={styles.lokProgressBar}
                                        style={{ width: `${progressPct}%`, background: progressColor }}
                                    />
                                </div>
                                <div className={styles.lokMinMax}>
                                    <span>Min: {parseFloat(boothStok.min_qty)} {item?.unit}</span>
                                    <span>Max: {parseFloat(boothStok.max_qty)} {item?.unit}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Info barang */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardTitle}>Informasi Barang</span>
                    </div>
                    <div className={styles.infoList}>
                        {[
                            { label: 'ID Barang', value: `#${String(item?.id).padStart(3, '0')}` },
                            { label: 'Nama', value: item?.name },
                            { label: 'Kategori', value: item?.category },
                            { label: 'Satuan Dasar', value: item?.unit },
                            { label: 'Harga Terakhir', value: `${formatRp(item?.last_price)} / ${item?.unit}` },
                            { label: 'Rata-rata Harga', value: `${formatRp(item?.avg_price)} / ${item?.unit}` },
                            { label: 'Diupdate', value: formatTgl(item?.updated_at) },
                            { label: 'Status Barang', value: item?.is_active ? 'Aktif' : 'Nonaktif' },
                        ].map(row => (
                            <div key={row.label} className={styles.infoRow}>
                                <span className={styles.infoLabel}>{row.label}</span>
                                <span className={styles.infoValue}>{row.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Riwayat Pergerakan Stok — full width */}
                <div className={`${styles.card} ${styles.fullWidth}`}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardTitle}>Riwayat Pergerakan Stok</span>
                        <span className={styles.cardSubtitle}>{boothName}</span>
                    </div>

                    {/* Filter bar */}
                    <div className={styles.filterBar}>
                        <div className={styles.filterPresets}>
                            {[
                                { key: '7d', label: '7 Hari' },
                                { key: '30d', label: '30 Hari' },
                                { key: '3m', label: '3 Bulan' },
                                { key: 'custom', label: 'Custom' },
                            ].map(opt => (
                                <button
                                    key={opt.key}
                                    onClick={() => setMovRange(opt.key)}
                                    className={`${styles.filterBtn} ${movRange === opt.key ? styles.filterBtnActive : ''}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {movRange === 'custom' && (
                            <div className={styles.filterCustom}>
                                <input
                                    type="date"
                                    value={customFrom}
                                    onChange={e => setCustomFrom(e.target.value)}
                                    className={styles.filterDateInput}
                                />
                                <span className={styles.filterSep}>s/d</span>
                                <input
                                    type="date"
                                    value={customTo}
                                    onChange={e => setCustomTo(e.target.value)}
                                    className={styles.filterDateInput}
                                />
                            </div>
                        )}

                        <div className={styles.filterMeta}>
                            {movLoading && <span className={styles.filterLoading}>Memuat...</span>}
                            <span className={styles.filterCount}>{movWithSaldo.length} transaksi</span>

                            {/* Tombol export — hanya tampil kalau ada data */}
                            {movWithSaldo.length > 0 && (
                                <div className={styles.exportBtns}>
                                    <button
                                        className={styles.btnExport}
                                        onClick={handleExportExcel}
                                        title="Export ke Excel"
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                        </svg>
                                        Excel
                                    </button>
                                    <button
                                        className={styles.btnExport}
                                        onClick={handleExportPDF}
                                        title="Export ke PDF"
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                        </svg>
                                        PDF
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {movWithSaldo.length === 0 ? (
                        <div className={styles.emptyState}>
                            {movLoading ? 'Memuat...' : 'Tidak ada transaksi di periode ini'}
                        </div>
                    ) : (
                        <div className={styles.tableWrap}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Tanggal</th>
                                        <th>Tipe</th>
                                        <th>Transaksi</th>
                                        <th style={{ textAlign: 'right' }}>Qty</th>
                                        <th style={{ textAlign: 'right' }}>Saldo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {movWithSaldo.map(mov => {
                                        const mv = movementVariant[mov.movement_type] ?? { label: mov.movement_type, cls: '' };
                                        return (
                                            <tr key={mov.id}>
                                                <td>{formatTgl(mov.created_at)}</td>
                                                <td>
                                                    <span className={`${styles.movPill} ${styles[mv.cls]}`}>
                                                        {mv.label}
                                                    </span>
                                                </td>
                                                <td>{sourceLabel[mov.source_type] ?? mov.source_type}</td>
                                                <td className={styles.monoCell} style={{ textAlign: 'right' }}>
                                                    <span className={mov.movement_type === 'IN' ? styles.qtyIn : styles.qtyOut}>
                                                        {mov.movement_type === 'IN' ? '+' : '-'}{parseFloat(mov.qty)} {item?.unit}
                                                    </span>
                                                </td>
                                                <td className={styles.monoCell} style={{ textAlign: 'right', fontWeight: 600 }}>
                                                    {Number(mov.saldo_after).toLocaleString('id')} {item?.unit}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
