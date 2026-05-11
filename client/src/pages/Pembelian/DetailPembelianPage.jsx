// src/pages/Pembelian/DetailPembelianPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './DetailPembelianPage.module.css';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

function getToken() { return localStorage.getItem('token'); }

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

function formatTglWaktu(val) {
    if (!val) return '-';
    return new Date(val).toLocaleString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

const typeLabel = { warehouse: 'Gudang Pusat', booth: 'Booth' };
const typeVariant = { warehouse: 'accent', booth: 'warning' };
const statusVariant = { dikonfirmasi: 'success', dibatalkan: 'danger' };

export default function DetailPembelianPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [purchase, setPurchase] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        async function fetchDetail() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${BASE_URL}/purchase/${id}`, {
                    headers: { Authorization: `Bearer ${getToken()}` }
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json.message ?? 'Pembelian tidak ditemukan');
                setPurchase(json);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchDetail();
    }, [id]);

    async function handleCancel() {
        if (!window.confirm(`Batalkan pembelian dari "${purchase.supplier}"?`)) return;
        setCancelling(true);
        try {
            const res = await fetch(`${BASE_URL}/purchase/${id}/cancel`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message ?? 'Gagal membatalkan');
            setPurchase(prev => ({ ...prev, status: 'dibatalkan' }));
        } catch (err) {
            alert(err.message);
        } finally {
            setCancelling(false);
        }
    }

    if (loading) return (
        <div className={styles.page}>
            <div className={styles.loadingWrap}>
                <div className={styles.spinner} />
                <span>Memuat data pembelian...</span>
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
                <button className={styles.btnGhost} onClick={() => navigate('/pembelian')}>Kembali</button>
            </div>
        </div>
    );

    const sudahBatal = purchase.status === 'dibatalkan';
    const items = purchase.items ?? [];
    const totalItems = items.reduce((s, i) => s + Number(i.buy_qty ?? 0), 0);

    return (
        <div className={styles.page}>

            {/* Breadcrumb */}
            <div className={styles.pageHeader}>
                <button className={styles.backBtn} onClick={() => navigate('/pembelian')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Kembali
                </button>
                <div className={styles.breadcrumb}>
                    <span onClick={() => navigate('/pembelian')} className={styles.breadcrumbLink}>Data Pembelian</span>
                    › Detail Pembelian
                </div>
            </div>

            {/* Hero Card */}
            <div className={styles.heroCard}>
                <div className={styles.heroLeft}>
                    <div className={styles.itemIcon}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
                            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <path d="M16 10a4 4 0 01-8 0" />
                        </svg>
                    </div>
                    <div>
                        <h1 className={styles.itemName}>{purchase.supplier}</h1>
                        <div className={styles.itemMeta}>
                            <span className={`${styles.pill} ${styles[typeVariant[purchase.type] ?? 'brown']}`}>
                                {typeLabel[purchase.type] ?? purchase.type}
                                {purchase.type === 'booth' && purchase.location_name ? ` — ${purchase.location_name}` : ''}
                            </span>
                            <span className={styles.metaDot}>·</span>
                            <span className={styles.metaText}>{formatTgl(purchase.date)}</span>
                            <span className={styles.metaDot}>·</span>
                            <span className={`${styles.pill} ${styles[statusVariant[purchase.status] ?? 'grey']}`}>
                                {purchase.status}
                            </span>
                        </div>
                    </div>
                </div>

                <div className={styles.heroRight}>
                    <div className={styles.heroStats}>
                        <div className={styles.heroStat}>
                            <span className={styles.heroStatLabel}>Total Pembelian</span>
                            <span className={styles.heroStatValue}>{formatRp(purchase.total)}</span>
                        </div>
                        <div className={styles.heroStatDivider} />
                        <div className={styles.heroStat}>
                            <span className={styles.heroStatLabel}>Jumlah Item</span>
                            <span className={styles.heroStatValue}>{items.length} <small>jenis</small></span>
                        </div>
                        <div className={styles.heroStatDivider} />
                        <div className={styles.heroStat}>
                            <span className={styles.heroStatLabel}>Dicatat oleh</span>
                            <span className={styles.heroStatValue} style={{ fontSize: 15 }}>{purchase.created_by_name ?? '-'}</span>
                        </div>
                    </div>

                    {!sudahBatal && (
                        <button className={styles.btnDanger} onClick={handleCancel} disabled={cancelling}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                            </svg>
                            {cancelling ? 'Membatalkan...' : 'Batalkan Pembelian'}
                        </button>
                    )}
                </div>
            </div>

            {/* Grid bawah */}
            <div className={styles.grid}>

                {/* Detail Item */}
                <div className={`${styles.card} ${styles.fullWidth}`}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardTitle}>Detail Item Pembelian</span>
                        <span className={styles.cardSubtitle}>{items.length} item</span>
                    </div>
                    {items.length === 0 ? (
                        <div className={styles.emptyState}>Tidak ada item</div>
                    ) : (
                        <div className={styles.tableWrap}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>No</th>
                                        <th>Nama Barang</th>
                                        <th>Qty Beli</th>
                                        <th>Satuan Beli</th>
                                        <th>Harga Satuan</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, i) => (
                                        <tr key={item.id ?? i}>
                                            <td className={styles.idCell}>{i + 1}</td>
                                            <td className={styles.namaCell}>{item.item_name ?? `Item #${item.item_id}`}</td>
                                            <td className={styles.monoCell}>{item.buy_qty}</td>
                                            <td>{item.buy_unit ?? item.base_unit ?? '-'}</td>
                                            <td className={styles.monoCell}>{formatRp(item.unit_price)}</td>
                                            <td className={styles.monoCell} style={{ fontWeight: 700 }}>
                                                {formatRp(item.total_price)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'right', fontWeight: 700, padding: '12px 20px', fontSize: 13, color: 'var(--brown-600)' }}>
                                            Total
                                        </td>
                                        <td className={styles.monoCell} style={{ fontWeight: 700, color: 'var(--brown-900)', padding: '12px 20px' }}>
                                            {formatRp(purchase.total)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>

                {/* Info Pembelian */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardTitle}>Informasi Pembelian</span>
                    </div>
                    <div className={styles.infoList}>
                        {[
                            { label: 'ID Pembelian', value: `#${String(purchase.id).padStart(4, '0')}` },
                            { label: 'Supplier', value: purchase.supplier },
                            { label: 'Tanggal Beli', value: formatTgl(purchase.date) },
                            { label: 'Tujuan', value: typeLabel[purchase.type] ?? purchase.type },
                            { label: 'Lokasi', value: purchase.location_name ?? '-' },
                            { label: 'Status', value: purchase.status },
                            { label: 'Dicatat oleh', value: purchase.created_by_name ?? '-' },
                            { label: 'Dicatat pada', value: formatTglWaktu(purchase.created_at) },
                        ].map(row => (
                            <div key={row.label} className={styles.infoRow}>
                                <span className={styles.infoLabel}>{row.label}</span>
                                <span className={styles.infoValue}>{row.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Info Pembatalan (kalau sudah batal) */}
                {sudahBatal && (
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardTitle}>Informasi Pembatalan</span>
                        </div>
                        <div className={styles.infoList}>
                            {[
                                { label: 'Dibatalkan oleh', value: purchase.cancelled_by_name ?? `User #${purchase.cancelled_by}` },
                                { label: 'Dibatalkan pada', value: formatTglWaktu(purchase.cancelled_at) },
                            ].map(row => (
                                <div key={row.label} className={styles.infoRow}>
                                    <span className={styles.infoLabel}>{row.label}</span>
                                    <span className={styles.infoValue}>{row.value}</span>
                                </div>
                            ))}
                        </div>
                        <div className={styles.cancelNote}>
                            Stok item dalam pembelian ini sudah dikembalikan ke sistem.
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
