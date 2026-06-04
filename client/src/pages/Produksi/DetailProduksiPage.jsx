// src/pages/Produksi/DetailProduksiPage.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './DetailProduksiPage.module.css';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';
function getToken() { return localStorage.getItem('token'); }

/* ─── Konfigurasi status batch adonan ──────────────────────────── */
const STATUS_CFG = {
    ACTIVE: { label: 'Di Freezer', bg: '#DBEAFE', color: '#1D4ED8', icon: '❄️' },
    FROZEN: { label: 'Dibekukan', bg: '#EDE9FE', color: '#7C3AED', icon: '🧊' },
    SOLD_OUT: { label: 'Habis Terjual', bg: '#D1FAE5', color: '#059669', icon: '✅' },
    EXPIRED: { label: 'Kadaluarsa', bg: '#FEF3C7', color: '#D97706', icon: '⚠️' },
    DAMAGED: { label: 'Rusak', bg: '#FEE2E2', color: '#DC2626', icon: '🚫' },
};

/* ─── Helper format ─────────────────────────────────────────────── */
function fmt(date) {
    if (!date) return '-';
    return new Date(date).toLocaleString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function fmtDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', {
        day: '2-digit', month: 'long', year: 'numeric',
    });
}

function fmtRupiah(n) {
    return 'Rp ' + Number(n).toLocaleString('id-ID');
}

/* ─── Sub-komponen label kadaluarsa ─────────────────────────────── */
function ExpiryLabel({ expiredAt, status }) {
    if (!expiredAt) return <span style={{ color: 'var(--brown-400)' }}>-</span>;
    const now = new Date();
    const exp = new Date(expiredAt);
    const diffMs = exp - now;

    if (status !== 'ACTIVE' && status !== 'FROZEN') {
        return <span style={{ color: 'var(--brown-400)' }}>{fmt(expiredAt)}</span>;
    }
    if (diffMs < 0) {
        return (
            <span style={{ color: '#DC2626', fontWeight: 700 }}>
                {fmt(expiredAt)} <span style={{ fontSize: 11 }}>(sudah lewat)</span>
            </span>
        );
    }
    if (diffMs < 3 * 3600 * 1000) {
        const mins = Math.floor(diffMs / 60000);
        return (
            <span style={{ color: '#D97706', fontWeight: 700 }}>
                {fmt(expiredAt)} <span style={{ fontSize: 11 }}>(~{mins} mnt lagi)</span>
            </span>
        );
    }
    return <span>{fmt(expiredAt)}</span>;
}

/* ─── Ikon SVG ──────────────────────────────────────────────────── */
const ChevronLeft = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);
const ChevronRight = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);
const ChevronDown = ({ open }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"
        style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
        <polyline points="6 9 12 15 18 9" />
    </svg>
);
const IconFactory = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28">
        <path d="M2 20h20M4 20V10l4-4 4 4 4-4 4 4v10" />
        <rect x="9" y="14" width="6" height="6" />
    </svg>
);
const IconInfo = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="18" height="18">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><circle cx="12" cy="16" r="1" fill="currentColor" />
    </svg>
);
const IconList = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="13" height="13">
        <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
);
const IconWarehouse = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28">
        <path d="M3 9l9-6 9 6v12H3V9z" /><path d="M9 21V12h6v9" />
    </svg>
);

/* ══════════════════════════════════════════════════════════════════
   Komponen utama
══════════════════════════════════════════════════════════════════ */
export default function DetailProduksiPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openBatch, setOpenBatch] = useState(null);

    useEffect(() => {
        setLoading(true);
        axios.get(`${BASE_URL}/productions/${id}/detail`, {
            headers: { Authorization: `Bearer ${getToken()}` },
        })
            .then(r => setDetail(r.data.payload.data))
            .catch(e => setError(e.response?.data?.payload?.message ?? 'Gagal memuat detail'))
            .finally(() => setLoading(false));
    }, [id]);

    /* ── Loading ── */
    if (loading) return (
        <div className={styles.stateWrap}>
            <div className={styles.spinner} />
            <span>Memuat detail produksi...</span>
        </div>
    );

    /* ── Error ── */
    if (error) return (
        <div className={styles.stateWrap} style={{ color: '#DC2626' }}>
            <IconInfo />
            <span>{error}</span>
        </div>
    );

    /* ── Derivasi data ── */
    const isAdonan = detail.recipe_type === 'adonan';
    const s = detail.batch_summary;           // ringkasan batch (hanya adonan)
    const batches = detail.batches ?? [];
    const totalOutput = Number(detail.output_qty) * detail.qty;

    /* ══════════════════════════════════════════════════════════════
       Render
    ══════════════════════════════════════════════════════════════ */
    return (
        <div className={styles.page}>

            {/* ── Header ───────────────────────────────────────────── */}
            <div className={styles.pageHeader}>
                {/* Breadcrumb */}
                <div className={styles.breadcrumb}>
                    <span className={styles.breadLink} onClick={() => navigate('/produksi')}>Produksi</span>
                    <ChevronRight />
                    <span>Detail #{id}</span>
                </div>

                {/* Judul + back */}
                <div className={styles.headerRow}>
                    <div className={styles.titleWrap}>
                        <div className={styles.titleIcon}>
                            {isAdonan ? <IconFactory /> : <IconWarehouse />}
                        </div>
                        <div>
                            <h1 className={styles.pageTitle}>{detail.recipe_name}</h1>
                            <p className={styles.pageSubtitle}>
                                {isAdonan ? 'Adonan' : 'Mixing'} &middot; {detail.qty}x batch &middot; {fmtDate(detail.created_at)} &middot; {detail.location_name}
                            </p>
                        </div>
                    </div>
                    <button className={styles.backBtn} onClick={() => navigate(-1)}>
                        <ChevronLeft />
                        Kembali
                    </button>
                </div>
            </div>

            {/* ── Hero stats ───────────────────────────────────────── */}
            <div className={styles.heroCard}>
                <div className={styles.heroStats}>
                    {[
                        { label: 'Tipe Produksi', value: isAdonan ? 'Adonan' : 'Mixing', highlight: isAdonan ? 'warning' : 'accent' },
                        { label: 'Jumlah Adonan', value: `${parseFloat(detail.qty)}x` },
                        { label: 'Total Output', value: `${totalOutput.toLocaleString('id-ID')}`, unit: detail.output_unit ?? '' },
                        { label: 'Lokasi', value: detail.location_name ?? '-' },
                        ...(detail.booth_name ? [{ label: 'Booth', value: detail.booth_name }] : []),
                        { label: 'Dibuat oleh', value: detail.created_by_name ?? '-' },
                        ...(isAdonan && detail.expiry_hours
                            ? [{ label: 'Masa Simpan', value: `${detail.expiry_hours} jam` }]
                            : []),
                    ].map((stat, i, arr) => (
                        <div key={stat.label} className={styles.heroStatGroup}>
                            <div className={styles.heroStat}>
                                <span className={styles.heroStatLabel}>{stat.label}</span>
                                {stat.highlight ? (
                                    <span className={`${styles.typePill} ${styles[stat.highlight]}`}>
                                        {stat.value}
                                    </span>
                                ) : (
                                    <span className={styles.heroStatValue}>
                                        {stat.value}
                                        {stat.unit && <small> {stat.unit}</small>}
                                    </span>
                                )}
                            </div>
                            {i < arr.length - 1 && <div className={styles.heroStatDivider} />}
                        </div>
                    ))}
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════
                ADONAN — ringkasan & daftar batch
            ══════════════════════════════════════════════════════ */}
            {isAdonan && (
                <>
                    {/* ── Ringkasan batch ── */}
                    {s && (
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}>Ringkasan Adonan</span>
                                <span className={styles.cardSubtitle}>{batches.length} batch total</span>
                            </div>

                            <div className={styles.summaryGrid}>
                                <div className={styles.summaryCard} style={{ '--sfg': '#1D4ED8', '--sbg': '#DBEAFE' }}>
                                    <div className={styles.summaryIcon}>🏭</div>
                                    <div className={styles.summaryNum}>{Number(s.total_qty).toLocaleString('id-ID')} <span>ml</span></div>
                                    <div className={styles.summaryLbl}>Total Diproduksi</div>
                                </div>
                                <div className={styles.summaryCard} style={{ '--sfg': '#059669', '--sbg': '#D1FAE5' }}>
                                    <div className={styles.summaryIcon}>🧃</div>
                                    <div className={styles.summaryNum} style={{ color: '#059669' }}>{Number(s.used_qty).toLocaleString('id-ID')} <span>ml</span></div>
                                    <div className={styles.summaryLbl}>Terpakai (Penjualan)</div>
                                </div>
                                <div className={styles.summaryCard} style={{ '--sfg': '#7C3AED', '--sbg': '#EDE9FE' }}>
                                    <div className={styles.summaryIcon}>📦</div>
                                    <div className={styles.summaryNum} style={{ color: '#7C3AED' }}>{Number(s.remaining_qty).toLocaleString('id-ID')} <span>ml</span></div>
                                    <div className={styles.summaryLbl}>Sisa Tersedia</div>
                                </div>
                                <div className={styles.summaryCard} style={{ '--sfg': '#DC2626', '--sbg': '#FEE2E2' }}>
                                    <div className={styles.summaryIcon}>🗑️</div>
                                    <div className={styles.summaryNum} style={{ color: '#DC2626' }}>{Number(s.wasted_qty).toLocaleString('id-ID')} <span>ml</span></div>
                                    <div className={styles.summaryLbl}>Terbuang (Expired / Rusak)</div>
                                </div>
                            </div>

                            {/* Progress bar efisiensi */}
                            {s.total_qty > 0 && (
                                <div className={styles.progressWrap}>
                                    <div className={styles.progressLabels}>
                                        <span>Efisiensi Adonan</span>
                                        <span style={{ fontWeight: 700, color: 'var(--brown-900)' }}>
                                            {Math.round((s.used_qty / s.total_qty) * 100)}%
                                        </span>
                                    </div>
                                    <div className={styles.progressTrack}>
                                        <div className={styles.progressSeg} style={{
                                            width: `${(s.used_qty / s.total_qty) * 100}%`,
                                            background: '#10B981',
                                        }} />
                                        <div className={styles.progressSeg} style={{
                                            width: `${(s.wasted_qty / s.total_qty) * 100}%`,
                                            background: '#EF4444',
                                        }} />
                                        {(s.active_count + s.frozen_count) > 0 && (
                                            <div className={styles.progressSeg} style={{
                                                width: `${((s.remaining_qty - s.wasted_qty) / s.total_qty) * 100}%`,
                                                background: '#A78BFA',
                                            }} />
                                        )}
                                    </div>
                                    <div className={styles.progressLegend}>
                                        <span><i style={{ background: '#10B981' }} />Terpakai</span>
                                        {s.wasted_qty > 0 && <span><i style={{ background: '#EF4444' }} />Terbuang</span>}
                                        {(s.active_count + s.frozen_count) > 0 && <span><i style={{ background: '#A78BFA' }} />Sisa aktif</span>}
                                    </div>
                                </div>
                            )}

                            {/* Status badges */}
                            <div className={styles.statusBadges}>
                                {s.active_count > 0 && <span className={styles.sBadge} style={{ background: '#DBEAFE', color: '#1D4ED8' }}>❄️ {s.active_count} di freezer</span>}
                                {s.frozen_count > 0 && <span className={styles.sBadge} style={{ background: '#EDE9FE', color: '#7C3AED' }}>🧊 {s.frozen_count} dibekukan</span>}
                                {s.sold_out_count > 0 && <span className={styles.sBadge} style={{ background: '#D1FAE5', color: '#059669' }}>✅ {s.sold_out_count} habis terjual</span>}
                                {s.expired_count > 0 && <span className={styles.sBadge} style={{ background: '#FEF3C7', color: '#D97706' }}>⚠️ {s.expired_count} kadaluarsa</span>}
                                {s.damaged_count > 0 && <span className={styles.sBadge} style={{ background: '#FEE2E2', color: '#DC2626' }}>🚫 {s.damaged_count} rusak</span>}
                            </div>
                        </div>
                    )}

                    {/* ── Daftar Batch ── */}
                    {batches.length > 0 && (
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}>Detail per Batch</span>
                                <span className={styles.cardSubtitle}>{batches.length} batch</span>
                            </div>

                            <div className={styles.batchList}>
                                {batches.map((batch, idx) => {
                                    const cfg = STATUS_CFG[batch.status] ?? { label: batch.status, bg: '#f0f0f0', color: '#666', icon: '•' };
                                    const usedPct = batch.total_qty > 0 ? (Number(batch.used_qty) / Number(batch.total_qty)) * 100 : 0;
                                    const isOpen = openBatch === batch.id;
                                    const isWaste = ['EXPIRED', 'DAMAGED'].includes(batch.status);

                                    return (
                                        <div key={batch.id} className={styles.batchCard}>

                                            {/* ── Batch header ── */}
                                            <div className={styles.batchHeader}>
                                                <div className={styles.batchLeft}>
                                                    <span className={styles.batchNum}>Batch #{idx + 1}</span>
                                                    <span
                                                        className={styles.batchStatus}
                                                        style={{ background: cfg.bg, color: cfg.color }}
                                                    >
                                                        {cfg.icon} {cfg.label}
                                                    </span>
                                                </div>
                                                <div className={styles.batchRight}>
                                                    <span className={styles.batchQtyBig}>
                                                        {Number(batch.remaining_qty).toLocaleString('id-ID')}
                                                        <small> ml sisa</small>
                                                    </span>
                                                    {/* Tombol expand hanya untuk batch yg ada penjualan */}
                                                    {batch.sales?.length > 0 && (
                                                        <button
                                                            className={styles.toggleBtn}
                                                            onClick={() => setOpenBatch(isOpen ? null : batch.id)}
                                                        >
                                                            {isOpen ? 'Sembunyikan' : `${batch.sales.length} transaksi`}
                                                            <ChevronDown open={isOpen} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* ── Meta info grid ── */}
                                            <div className={styles.batchMeta}>
                                                <div className={styles.batchMetaItem}>
                                                    <span className={styles.bml}>Diproduksi</span>
                                                    <span className={styles.bmv}>{fmt(batch.produced_at)}</span>
                                                </div>
                                                <div className={styles.batchMetaItem}>
                                                    <span className={styles.bml}>Kadaluarsa</span>
                                                    <span className={styles.bmv}>
                                                        <ExpiryLabel expiredAt={batch.expired_at} status={batch.status} />
                                                    </span>
                                                </div>
                                                <div className={styles.batchMetaItem}>
                                                    <span className={styles.bml}>Total</span>
                                                    <span className={styles.bmv}>{Number(batch.total_qty).toLocaleString('id-ID')} ml</span>
                                                </div>
                                                <div className={styles.batchMetaItem}>
                                                    <span className={styles.bml}>Terpakai</span>
                                                    <span className={styles.bmv} style={{ color: '#059669', fontWeight: 700 }}>
                                                        {Number(batch.used_qty).toLocaleString('id-ID')} ml
                                                    </span>
                                                </div>
                                                <div className={styles.batchMetaItem}>
                                                    <span className={styles.bml}>Sisa</span>
                                                    <span className={styles.bmv} style={{ color: isWaste ? '#DC2626' : 'var(--brown-900)', fontWeight: 700 }}>
                                                        {Number(batch.remaining_qty).toLocaleString('id-ID')} ml
                                                        {isWaste && Number(batch.remaining_qty) > 0 && (
                                                            <span style={{ color: '#DC2626', fontSize: 10, marginLeft: 4 }}>(terbuang)</span>
                                                        )}
                                                    </span>
                                                </div>

                                                {/* Alasan rusak / catatan — tampil di baris penuh */}
                                                {batch.notes && (
                                                    <div className={styles.batchMetaItem} style={{ gridColumn: '1 / -1' }}>
                                                        <span className={styles.bml}>
                                                            {batch.status === 'DAMAGED' ? 'Alasan Rusak' : 'Catatan'}
                                                        </span>
                                                        <span className={styles.bmv} style={{ color: isWaste ? '#DC2626' : 'var(--brown-500)', fontStyle: 'italic' }}>
                                                            {batch.notes}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* ── Mini progress bar ── */}
                                            <div className={styles.miniBar}>
                                                <div
                                                    className={styles.miniBarFill}
                                                    style={{
                                                        width: `${Math.min(100, usedPct)}%`,
                                                        background: isWaste ? '#EF4444' : '#10B981',
                                                    }}
                                                />
                                            </div>
                                            <div className={styles.miniBarLabel}>
                                                <span>{Math.round(usedPct)}% terpakai</span>
                                                {batch.sales?.length > 0 && (
                                                    <span style={{ color: 'var(--brown-400)' }}>{batch.sales.length} transaksi</span>
                                                )}
                                            </div>

                                            {/* ── Tabel pemakaian per transaksi (expand) ── */}
                                            {isOpen && batch.sales?.length > 0 && (
                                                <div className={styles.salesTableWrap}>
                                                    <div className={styles.salesTableTitle}>
                                                        <IconList />
                                                        Riwayat Pemakaian Adonan
                                                    </div>
                                                    <table className={styles.salesTable}>
                                                        <thead>
                                                            <tr>
                                                                <th>No</th>
                                                                <th>Waktu Transaksi</th>
                                                                <th>Item Terjual</th>
                                                                <th>Pembayaran</th>
                                                                <th>Total Penjualan</th>
                                                                <th>Adonan Terpakai</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {batch.sales.map((sale, si) => (
                                                                <tr key={sale.sale_id}>
                                                                    <td className={styles.noCell}>{si + 1}</td>
                                                                    <td style={{ whiteSpace: 'nowrap' }}>{fmt(sale.sale_at)}</td>
                                                                    <td className={styles.itemsCell}>{sale.items_summary}</td>
                                                                    <td>
                                                                        <span className={styles.payBadge}>
                                                                            {sale.payment_method === 'qris' ? '📱 QRIS' : '💵 Tunai'}
                                                                        </span>
                                                                    </td>
                                                                    <td className={styles.moneyCell}>{fmtRupiah(sale.grand_total)}</td>
                                                                    <td className={styles.mlCell}>
                                                                        <span className={styles.mlBadge}>
                                                                            {Number(sale.ml_used).toLocaleString('id-ID')} ml
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                        <tfoot>
                                                            <tr>
                                                                <td colSpan={4} className={styles.footLabel}>
                                                                    Total dari {batch.sales.length} transaksi
                                                                </td>
                                                                <td className={styles.footMoney}>
                                                                    {fmtRupiah(batch.sales.reduce((acc, x) => acc + Number(x.grand_total), 0))}
                                                                </td>
                                                                <td className={styles.footMl}>
                                                                    {batch.sales.reduce((acc, x) => acc + Number(x.ml_used), 0).toLocaleString('id-ID')} ml
                                                                </td>
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                            )}

                                            {/* Batch punya penjualan tapi collapsed — hint */}
                                            {!isOpen && batch.sales?.length === 0 && (
                                                <div className={styles.noSales}>Belum ada transaksi dari batch ini.</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ══════════════════════════════════════════════════════
                MIXING — informasi hasil masuk stok gudang
            ══════════════════════════════════════════════════════ */}
            {!isAdonan && (
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardTitle}>Hasil Produksi Mixing</span>
                    </div>

                    <div className={styles.mixInfo}>
                        <div className={styles.mixIconWrap}>
                            <IconWarehouse />
                        </div>
                        <div className={styles.mixBody}>
                            <p className={styles.mixDesc}>
                                Produksi tipe <strong>Mixing</strong> tidak menggunakan sistem batch.
                                Output langsung ditambahkan ke stok gudang di lokasi <strong>{detail.location_name}</strong>.
                            </p>
                            <div className={styles.mixStats}>
                                <div className={styles.mixStat}>
                                    <span className={styles.mixStatLabel}>Item Output</span>
                                    <span className={styles.mixStatValue}>
                                        {detail.output_item_name ?? '-'}
                                    </span>
                                </div>
                                <div className={styles.mixStatDivider} />
                                <div className={styles.mixStat}>
                                    <span className={styles.mixStatLabel}>Jumlah Ditambahkan</span>
                                    <span className={styles.mixStatValue} style={{ color: '#059669' }}>
                                        +{totalOutput.toLocaleString('id-ID')} {detail.output_unit ?? ''}
                                    </span>
                                </div>
                                <div className={styles.mixStatDivider} />
                                <div className={styles.mixStat}>
                                    <span className={styles.mixStatLabel}>Lokasi Stok</span>
                                    <span className={styles.mixStatValue}>{detail.location_name ?? '-'}</span>
                                </div>
                                <div className={styles.mixStatDivider} />
                                <div className={styles.mixStat}>
                                    <span className={styles.mixStatLabel}>Waktu Produksi</span>
                                    <span className={styles.mixStatValue}>{fmt(detail.created_at)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}