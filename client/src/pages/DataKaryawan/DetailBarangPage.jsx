// src/pages/DataBarang/DetailBarangPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './DetailBarangPage.module.css';

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
    'purchase': 'Pembelian',
    'purchase_cancel': 'Batal Beli',
    'production': 'Produksi',
    'distribution': 'Distribusi',
    'adjustment': 'Penyesuaian',
};

const stokStatusVariant = {
    'Aman': 'success',
    'Overstock': 'warning',
    'Kritis': 'danger',
};

function getStokStatus(stok, min, max) {
    if (stok <= min) return 'Kritis';
    if (stok >= max) return 'Overstock';
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

    useEffect(() => {
        async function fetchAll() {
            setLoading(true);
            setError(null);
            try {
                const headers = { Authorization: `Bearer ${getToken()}` };

                const [resItem, resStok, resMov] = await Promise.all([
                    fetch(`${BASE_URL}/items/${id}`, { headers }),
                    fetch(`${BASE_URL}/stock-per-location?item_id=${id}`, { headers }),
                    fetch(`${BASE_URL}/stock-movements?item_id=${id}&limit=20`, { headers }),
                ]);

                const [jItem, jStok, jMov] = await Promise.all([
                    resItem.json(), resStok.json(), resMov.json()
                ]);

                if (!resItem.ok) throw new Error(jItem.payload?.message ?? 'Barang tidak ditemukan');

                setItem(jItem.payload?.data ?? jItem);
                setStokLoks(Array.isArray(jStok.payload?.data) ? jStok.payload.data : (Array.isArray(jStok) ? jStok : []));
                setMovements(Array.isArray(jMov.payload?.data) ? jMov.payload.data : (Array.isArray(jMov) ? jMov : []));

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchAll();
    }, [id]);

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
                            <span className={styles.metaText}>Satuan: <strong>{item.unit}</strong></span>
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
                        <span className={styles.heroStatLabel}>Harga Terakhir</span>
                        <span className={styles.heroStatValue}>{formatRp(item.last_cost)}<small>/{item.unit}</small></span>
                    </div>
                    <div className={styles.heroStatDivider} />
                    <div className={styles.heroStat}>
                        <span className={styles.heroStatLabel}>Rata-rata Harga</span>
                        <span className={styles.heroStatValue}>{formatRp(item.avg_cost)}<small>/{item.unit}</small></span>
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
                                const stokStatus = getStokStatus(lok.current_stock, lok.min_qty, lok.max_qty);
                                return (
                                    <div key={lok.location_id} className={styles.lokRow}>
                                        <div className={styles.lokInfo}>
                                            <span className={styles.lokName}>{lok.location_name ?? `Lokasi ${lok.location_id}`}</span>
                                            <span className={styles.lokType}>{lok.location_type ?? ''}</span>
                                        </div>
                                        <div className={styles.lokRight}>
                                            <span className={styles.lokStok}>
                                                {lok.current_stock} <small>{item.unit}</small>
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
                                                    width: lok.max_qty > 0
                                                        ? `${Math.min(100, (lok.current_stock / lok.max_qty) * 100)}%`
                                                        : '0%',
                                                    background: stokStatus === 'Kritis'
                                                        ? 'var(--danger)'
                                                        : stokStatus === 'Overstock'
                                                            ? 'var(--warning)'
                                                            : 'var(--success)',
                                                }}
                                            />
                                        </div>
                                        <div className={styles.lokMinMax}>
                                            <span>Min: {lok.min_qty} {item.unit}</span>
                                            <span>Max: {lok.max_qty} {item.unit}</span>
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
                            { label: 'ID Barang', value: `#${String(item.id).padStart(3, '0')}` },
                            { label: 'Nama', value: item.name },
                            { label: 'Kategori', value: item.category },
                            { label: 'Satuan Dasar', value: item.unit },
                            { label: 'Harga Terakhir', value: `${formatRp(item.last_cost)} / ${item.unit}` },
                            { label: 'Rata-rata Harga', value: `${formatRp(item.avg_cost)} / ${item.unit}` },
                            { label: 'Dibuat', value: formatTgl(item.created_at) },
                            { label: 'Diupdate', value: formatTgl(item.updated_at) },
                        ].map(row => (
                            <div key={row.label} className={styles.infoRow}>
                                <span className={styles.infoLabel}>{row.label}</span>
                                <span className={styles.infoValue}>{row.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Riwayat Pergerakan Stok */}
                <div className={`${styles.card} ${styles.fullWidth}`}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardTitle}>Riwayat Pergerakan Stok</span>
                        <span className={styles.cardSubtitle}>20 transaksi terakhir</span>
                    </div>
                    {movements.length === 0 ? (
                        <div className={styles.emptyState}>Belum ada pergerakan stok</div>
                    ) : (
                        <div className={styles.tableWrap}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Tanggal</th>
                                        <th>Tipe</th>
                                        <th>Sumber</th>
                                        <th>Lokasi</th>
                                        <th>Qty</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {movements.map(mov => {
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
                                                <td className={styles.monoCell}>
                                                    <span className={mov.movement_type === 'IN' ? styles.qtyIn : styles.qtyOut}>
                                                        {mov.movement_type === 'IN' ? '+' : '-'}{mov.qty} {item.unit}
                                                    </span>
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
