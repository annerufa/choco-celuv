// src/pages/DataBarang/DetailBarangPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './DetailBarangPage.module.css';
import SatuanBeliSection from './SatuanBeliSection';

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
    'PEMBATALAN DISTRIBUSI': 'Batal Kirim',
    'PRODUKSI': 'Produksi',
    'DISTRIBUSI': 'Distribusi',
    'KOREKSI': 'Penyesuaian',
};

const stokStatusVariant = {
    'Aman': 'success',
    'Overstock': 'warning',
    'Kritis': 'danger',
    'Habis': 'danger',
};

function getStokStatus(stok, min, max, safetyStock) {
    stok = parseFloat(stok);
    min = parseFloat(min);
    max = parseFloat(max);
    safetyStock = parseFloat(safetyStock);
    if (stok <= 0) return 'Habis';
    if (stok <= safetyStock) return 'Kritis';  // di bawah safety stock = darurat
    if (stok <= min) return 'Menipis';          // sudah waktunya order
    if (stok > max) return 'Overstock';         // terlalu banyak
    return 'Aman';
}

export default function DetailBarangPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [item, setItem] = useState(null);
    const [stokLoks, setStokLoks] = useState([]);
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ── State filter riwayat ──────────────────────────────
    const [movRange, setMovRange] = useState('30d'); // '7d' | '30d' | '3m' | 'custom'
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const [movLoading, setMovLoading] = useState(false);

    function getRangeDates(range) {
        const toLocalDate = (d) => d.toLocaleDateString('en-CA');
        const to = new Date();
        const from = new Date();
        if (range === '7d') from.setDate(to.getDate() - 7);
        else if (range === '30d') from.setDate(to.getDate() - 30);
        else if (range === '3m') from.setMonth(to.getMonth() - 3);
        else return null; // custom — gunakan customFrom/customTo
        return {
            from: toLocalDate(from),
            to: toLocalDate(to),
        };
    }
    useEffect(() => {
        async function fetchAll() {
            setLoading(true);
            setError(null);
            try {
                const headers = { Authorization: `Bearer ${getToken()}` };

                const [resItem, resStok] = await Promise.all([
                    fetch(`${BASE_URL}/items/${id}`, { headers }),
                    fetch(`${BASE_URL}/items/stockPer?item_id=${id}`, { headers }),
                    // fetch(`${BASE_URL}/items/trackItem?item_id=${id}&limit=20`, { headers }),
                ]);

                const [jItem, jStok] = await Promise.all([
                    resItem.json(), resStok.json()
                ]);

                if (!resItem.ok) throw new Error(jItem.payload?.message ?? 'Barang tidak ditemukan');

                setItem(jItem.payload?.data ?? jItem);
                setStokLoks(Array.isArray(jStok.payload?.data) ? jStok.payload.data : (Array.isArray(jStok) ? jStok : []));
                // setMovements(Array.isArray(jMov.payload?.data) ? jMov.payload.data : (Array.isArray(jMov) ? jMov : []));

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchAll();
    }, [id]);
    // Fetch movements terpisah agar bisa di-trigger ulang saat filter berubah
    useEffect(() => {
        if (!id) return;

        async function fetchMovements() {
            setMovLoading(true);
            try {
                const headers = { Authorization: `Bearer ${getToken()}` };
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

                const url = `${BASE_URL}/items/trackItem?item_id=${id}&limit=200&date_from=${dateFrom}&date_to=${dateTo}`;
                // const res = await fetch(url, { headers });
                const res = await fetch(url, {
                    headers: {
                        Authorization: `Bearer ${getToken()}`,
                        'Cache-Control': 'no-cache',  // ← tambah ini
                    }
                });
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
    }, [id, movRange, customFrom, customTo]);

    // Hitung saldo running — urutkan ASC dulu, akumulasi, lalu balik ke DESC untuk tampil
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
        return withSaldo; // tampil terbaru di atas
    })();
    if (loading) return (
        <div className={styles.page}>
            <div className={styles.loadingWrap}>
                <div className={styles.spinner} />
                <span>Memuat data barang...</span>
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
                <button className={styles.btnGhost} onClick={() => navigate('/barang')}>Kembali</button>
            </div>
        </div>
    );

    const totalStok = stokLoks.reduce((s, l) => s + Number(l.current_stock ?? 0), 0);
    console.log('Item data:', item);
    const statusItem = getStokStatus(item.current_stock, item.min_qty, item.max_qty, item.safety_stock);
    // console.log(`Status item: ${statusItem} (stok: ${item.current_stock}, min: ${item.min_qty}, max: ${item.max_qty}, safety: ${item.safety_stock})`);
    return (
        <div className={styles.page}>

            {/* ── Breadcrumb & Back ─────────────────────── */}
            <div className={styles.pageHeader}>
                <button className={styles.backBtn} onClick={() => navigate('/barang')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Kembali
                </button>
                <div className={styles.breadcrumb}>
                    <span onClick={() => navigate('/barang')} className={styles.breadcrumbLink}>Data Barang</span>
                    › Detail Barang
                </div>
            </div>

            {/* ── Hero card ────────────────────────────── */}
            <div className={styles.heroCard}>
                <div className={styles.heroLeft}>
                    <div className={styles.itemIcon}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className={styles.itemName}>{item.name}</h1>
                        <div className={styles.itemMeta}>
                            <span className={`${styles.pill} ${styles.pillBrown}`}>{item.category}</span>
                            <span className={styles.metaDot}>·</span>
                            <span className={styles.metaText}>Status: <strong>{statusItem}</strong></span>
                            <span className={styles.metaDot}>·</span>
                            <span className={`${styles.pill} ${item.is_active ? styles.pillSuccess : styles.pillDanger}`}>
                                {item.is_active ? 'Aktif' : 'Nonaktif'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className={styles.heroStats}>
                    <div className={styles.heroStat}>
                        <span className={styles.heroStatLabel}>Total Stok</span>
                        <span className={styles.heroStatValue}>{totalStok} <small>{item.unit}</small></span>
                    </div>
                    <div className={styles.heroStatDivider} />
                    <div className={styles.heroStat}>
                        <span className={styles.heroStatLabel}>Stok di Lokasimu</span>
                        <span className={styles.heroStatValue}>{parseFloat(item.current_stock)} <small>{item.unit}</small></span>
                    </div>
                    <div className={styles.heroStatDivider} />
                    <div className={styles.heroStat}>
                        <span className={styles.heroStatLabel}>Harga Terakhir</span>
                        <span className={styles.heroStatValue}>{formatRp(item.last_price)}<small>/{item.unit}</small></span>
                    </div>
                    <div className={styles.heroStatDivider} />
                    <div className={styles.heroStat}>
                        <span className={styles.heroStatLabel}>Rata-rata Harga</span>
                        <span className={styles.heroStatValue}>{formatRp(item.avg_price)}<small>/{item.unit}</small></span>
                    </div>
                </div>
            </div>

            {/* ── Grid bawah ───────────────────────────── */}
            <div className={styles.grid}>

                {/* Stok per Lokasi */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardTitle}>Stok per Lokasi</span>
                    </div>
                    {stokLoks.length === 0 ? (
                        <div className={styles.emptyState}>Belum ada data stok</div>
                    ) : (
                        <div className={styles.lokList}>
                            {stokLoks.map(lok => {
                                const stokStatus = getStokStatus(lok.current_stock, lok.min_qty, lok.max_qty, lok.safety_stock);
                                console.log(`Status item: ${stokStatus} (stok: ${lok.current_stock}, min: ${lok.min_qty}, max: ${lok.max_qty}, safety: ${lok.safety_stock})`);

                                return (
                                    <div key={lok.location_id} className={styles.lokRow}>
                                        <div className={styles.lokInfo}>
                                            <span className={styles.lokName}>{lok.location_name ?? `Lokasi ${lok.location_id}`}</span>
                                            <span className={styles.lokType}>{lok.location_type ?? ''}</span>
                                        </div>
                                        <div className={styles.lokRight}>
                                            <span className={styles.lokStok}>
                                                {parseFloat(lok.current_stock)} <small>{item.unit}</small>
                                            </span>
                                            <span className={`${styles.pill} ${styles[stokStatusVariant[stokStatus]]}`}>
                                                {stokStatus}
                                            </span>
                                        </div>
                                        {/* Progress bar min-max */}
                                        <div className={styles.lokProgress}>
                                            <div
                                                className={styles.lokProgressBar}
                                                style={{
                                                    width: parseFloat(lok.max_qty) > 0
                                                        ? `${Math.max(0, Math.min(100, (parseFloat(lok.current_stock) / parseFloat(lok.max_qty)) * 100))}%`
                                                        : stokStatus === 'Overstock' ? '100%' : '0%',
                                                    background: stokStatus === 'Habis'
                                                        ? 'var(--danger)'
                                                        : stokStatus === 'Kritis'
                                                            ? 'var(--danger)'
                                                            : stokStatus === 'Menipis'
                                                                ? 'var(--warning)'
                                                                : stokStatus === 'Overstock'
                                                                    ? 'var(--warning)'
                                                                    : 'var(--success)',
                                                }}
                                            />
                                        </div>
                                        <div className={styles.lokMinMax}>
                                            <span>Min: {parseFloat(lok.min_qty)} {item.unit}</span>
                                            <span>Max: {parseFloat(lok.max_qty)} {item.unit}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Info tambahan */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardTitle}>Informasi</span>
                    </div>
                    <div className={styles.infoList}>
                        {[
                            { label: 'ID Barang', value: `#${String(item.id).padStart(3, '00')}` },
                            { label: 'Nama', value: item.name },
                            { label: 'Kategori', value: item.category },
                            { label: 'Satuan Dasar', value: item.unit },
                            { label: 'Batas Stok Minimal', value: parseFloat(item.min_qty) },
                            { label: 'Batas Stok Maksimal', value: parseFloat(item.max_qty) },
                            { label: 'Batas Stok Cadangan', value: parseFloat(item.safety_stock) },
                            { label: 'Harga Terakhir', value: `${formatRp(item.last_price)} / ${item.unit}` },
                            { label: 'Rata-rata Harga', value: `${formatRp(item.avg_price)} / ${item.unit}` },
                            { label: 'Diupdate', value: formatTgl(item.updated_at) },
                            { label: 'Status', value: item.is_active ? 'Aktif' : 'Nonaktif' },
                        ].map(row => (
                            <div key={row.label} className={styles.infoRow}>
                                <span className={styles.infoLabel}>{row.label}</span>
                                <span className={styles.infoValue}>{row.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <SatuanBeliSection itemId={item.id} baseUnit={item.unit} />

                {/* Riwayat Pergerakan Stok */}
                <div className={`${styles.card} ${styles.fullWidth}`}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardTitle}>Riwayat Pergerakan Stok</span>
                        <span className={styles.cardSubtitle}>Buku kas barang</span>
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
                                        <th>Lokasi</th>
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
                                                <td>{mov.location_name ?? `Lokasi ${mov.location_id}`}</td>
                                                <td className={styles.monoCell} style={{ textAlign: 'right' }}>
                                                    <span className={mov.movement_type === 'IN' ? styles.qtyIn : styles.qtyOut}>
                                                        {mov.movement_type === 'IN' ? '+' : '-'}{parseFloat(mov.qty)} {item.unit}
                                                    </span>
                                                </td>
                                                <td className={styles.monoCell} style={{ textAlign: 'right', fontWeight: 600 }}>
                                                    {Number(mov.saldo_after).toLocaleString('id')} {item.unit}
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
