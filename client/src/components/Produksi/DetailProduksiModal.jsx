// src/components/Produksi/DetailProduksiModal.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './DetailProduksiModal.module.css';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';
function getToken() { return localStorage.getItem('token'); }

const STATUS_CONFIG = {
    ACTIVE: { label: 'Di Freezer', cls: 'active', icon: '❄️' },
    USED: { label: 'Habis Terpakai', cls: 'used', icon: '✅' },
    EXPIRED: { label: 'Kadaluarsa', cls: 'expired', icon: '⚠️' },
    DAMAGED: { label: 'Rusak', cls: 'damaged', icon: '🚫' },
};

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
        day: '2-digit', month: 'short', year: 'numeric',
    });
}

function isExpiredSoon(expiredAt) {
    if (!expiredAt) return false;
    const diff = new Date(expiredAt) - new Date();
    return diff > 0 && diff < 3 * 3600 * 1000; // < 3 jam
}

function isAlreadyExpired(expiredAt) {
    if (!expiredAt) return false;
    return new Date(expiredAt) < new Date();
}

export default function DetailProduksiModal({ produksi, onClose }) {
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!produksi) return;
        setLoading(true);
        setError(null);
        axios.get(`${BASE_URL}/productions/${produksi.id}/detail`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        })
            .then(r => setDetail(r.data.payload))
            .catch(e => setError(e.response?.data?.payload?.message ?? 'Gagal memuat detail'))
            .finally(() => setLoading(false));
    }, [produksi?.id]);

    if (!produksi) return null;

    const isAdonan = produksi.recipe_type === 'adonan';
    const summary = detail?.batch_summary;
    const batches = detail?.batches ?? [];

    return (
        <div className={styles.backdrop} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                {/* ── Header ── */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div className={styles.headerIcon}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M9 11l3 3L22 4" />
                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                            </svg>
                        </div>
                        <div>
                            <div className={styles.headerTitle}>Detail Produksi</div>
                            <div className={styles.headerSub}>#{produksi.id} · {fmtDate(produksi.created_at)}</div>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* ── Content ── */}
                <div className={styles.body}>
                    {loading ? (
                        <div className={styles.stateWrap}>
                            <div className={styles.spinner} />
                            <span>Memuat detail...</span>
                        </div>
                    ) : error ? (
                        <div className={styles.stateWrap} style={{ color: 'var(--danger)' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><circle cx="12" cy="16" r="1" fill="currentColor" />
                            </svg>
                            {error}
                        </div>
                    ) : (
                        <>
                            {/* ── Info Umum ── */}
                            <div className={styles.section}>
                                <div className={styles.sectionTitle}>Informasi Produksi</div>
                                <div className={styles.infoGrid}>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Resep</span>
                                        <span className={styles.infoValue}>{detail.recipe_name}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Tipe</span>
                                        <span className={`${styles.pill} ${styles[isAdonan ? 'warning' : 'accent']}`}>
                                            {isAdonan ? 'Adonan' : 'Mixing'}
                                        </span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Jumlah Batch</span>
                                        <span className={styles.infoValue}>{detail.qty}x</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Total Output</span>
                                        <span className={styles.infoValue}>
                                            {Number(detail.output_qty) * detail.qty} {detail.output_unit}
                                            {!isAdonan && detail.output_item_name && (
                                                <span style={{ color: 'var(--brown-400)', fontSize: 11, marginLeft: 4 }}>
                                                    ({detail.output_item_name})
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Lokasi</span>
                                        <span className={styles.infoValue}>{detail.location_name ?? '-'}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Dibuat oleh</span>
                                        <span className={styles.infoValue}>{detail.created_by_name ?? '-'}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Waktu Produksi</span>
                                        <span className={styles.infoValue}>{fmt(detail.created_at)}</span>
                                    </div>
                                    {isAdonan && detail.expiry_hours > 0 && (
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>Masa Simpan</span>
                                            <span className={styles.infoValue}>{detail.expiry_hours} jam</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── Ringkasan Batch (adonan only) ── */}
                            {isAdonan && summary && (
                                <div className={styles.section}>
                                    <div className={styles.sectionTitle}>Ringkasan Adonan</div>
                                    <div className={styles.summaryGrid}>
                                        <div className={styles.summaryCard}>
                                            <div className={styles.summaryIcon} style={{ background: '#DBEAFE', color: '#1D4ED8' }}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="18" height="18">
                                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" /><path d="M12 6v6l4 2" />
                                                </svg>
                                            </div>
                                            <span className={styles.summaryVal}>{Number(summary.total_qty).toLocaleString('id-ID')} ml</span>
                                            <span className={styles.summaryLbl}>Total Diproduksi</span>
                                        </div>
                                        <div className={styles.summaryCard}>
                                            <div className={styles.summaryIcon} style={{ background: '#D1FAE5', color: 'var(--success)' }}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="18" height="18">
                                                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                                </svg>
                                            </div>
                                            <span className={styles.summaryVal} style={{ color: 'var(--success)' }}>{Number(summary.used_qty).toLocaleString('id-ID')} ml</span>
                                            <span className={styles.summaryLbl}>Terpakai untuk Penjualan</span>
                                        </div>
                                        <div className={styles.summaryCard}>
                                            <div className={styles.summaryIcon} style={{ background: '#EDE9FE', color: '#7C3AED' }}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="18" height="18">
                                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                </svg>
                                            </div>
                                            <span className={styles.summaryVal} style={{ color: '#7C3AED' }}>{Number(summary.remaining_qty).toLocaleString('id-ID')} ml</span>
                                            <span className={styles.summaryLbl}>Sisa (aktif di freezer)</span>
                                        </div>
                                        <div className={styles.summaryCard}>
                                            <div className={styles.summaryIcon} style={{ background: '#FEE2E2', color: 'var(--danger)' }}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="18" height="18">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                                </svg>
                                            </div>
                                            <span className={styles.summaryVal} style={{ color: 'var(--danger)' }}>{Number(summary.wasted_qty).toLocaleString('id-ID')} ml</span>
                                            <span className={styles.summaryLbl}>Terbuang (kadaluarsa/rusak)</span>
                                        </div>
                                    </div>

                                    {/* Progress bar pemakaian */}
                                    {summary.total_qty > 0 && (
                                        <div className={styles.usageBar}>
                                            <div className={styles.usageBarLabel}>
                                                <span>Pemakaian Adonan</span>
                                                <span>{Math.round((summary.used_qty / summary.total_qty) * 100)}%</span>
                                            </div>
                                            <div className={styles.usageBarTrack}>
                                                <div
                                                    className={styles.usageBarFill}
                                                    style={{ width: `${Math.min(100, (summary.used_qty / summary.total_qty) * 100)}%` }}
                                                />
                                                {summary.wasted_qty > 0 && (
                                                    <div
                                                        className={styles.usageBarWaste}
                                                        style={{ width: `${Math.min(100, (summary.wasted_qty / summary.total_qty) * 100)}%` }}
                                                    />
                                                )}
                                            </div>
                                            <div className={styles.usageBarLegend}>
                                                <span><span className={styles.legendDot} style={{ background: 'var(--success)' }} />Terpakai</span>
                                                {summary.wasted_qty > 0 && <span><span className={styles.legendDot} style={{ background: 'var(--danger)' }} />Terbuang</span>}
                                                <span><span className={styles.legendDot} style={{ background: '#7C3AED' }} />Sisa aktif</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Status count */}
                                    <div className={styles.statusCount}>
                                        {summary.active_count > 0 && (
                                            <span className={`${styles.statusBadge} ${styles.badgeActive}`}>
                                                ❄️ {summary.active_count} aktif di freezer
                                            </span>
                                        )}
                                        {summary.used_count > 0 && (
                                            <span className={`${styles.statusBadge} ${styles.badgeUsed}`}>
                                                ✅ {summary.used_count} habis terpakai
                                            </span>
                                        )}
                                        {summary.expired_count > 0 && (
                                            <span className={`${styles.statusBadge} ${styles.badgeExpired}`}>
                                                ⚠️ {summary.expired_count} kadaluarsa
                                            </span>
                                        )}
                                        {summary.damaged_count > 0 && (
                                            <span className={`${styles.statusBadge} ${styles.badgeDamaged}`}>
                                                🚫 {summary.damaged_count} rusak
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ── Daftar Batch (adonan only) ── */}
                            {isAdonan && batches.length > 0 && (
                                <div className={styles.section}>
                                    <div className={styles.sectionTitle}>Detail per Batch</div>
                                    <div className={styles.batchList}>
                                        {batches.map((b, i) => {
                                            const cfg = STATUS_CONFIG[b.status] ?? { label: b.status, cls: 'grey', icon: '•' };
                                            const expiredSoon = b.status === 'ACTIVE' && isExpiredSoon(b.expired_at);
                                            const alreadyExpired = b.status === 'ACTIVE' && isAlreadyExpired(b.expired_at);
                                            const usedPct = b.total_qty > 0 ? Math.round((Number(b.used_qty) / Number(b.total_qty)) * 100) : 0;

                                            return (
                                                <div key={b.id} className={`${styles.batchCard} ${alreadyExpired ? styles.batchExpiredWarn : ''}`}>
                                                    <div className={styles.batchTop}>
                                                        <div className={styles.batchNum}>Batch #{i + 1}</div>
                                                        <span className={`${styles.batchStatus} ${styles[cfg.cls]}`}>
                                                            {cfg.icon} {cfg.label}
                                                            {expiredSoon && ' · Segera kadaluarsa!'}
                                                        </span>
                                                    </div>

                                                    <div className={styles.batchMeta}>
                                                        <div className={styles.batchMetaItem}>
                                                            <span className={styles.batchMetaLabel}>Diproduksi</span>
                                                            <span className={styles.batchMetaVal}>{fmt(b.produced_at)}</span>
                                                        </div>
                                                        <div className={styles.batchMetaItem}>
                                                            <span className={styles.batchMetaLabel}>Kadaluarsa</span>
                                                            <span className={`${styles.batchMetaVal} ${alreadyExpired || b.status === 'EXPIRED' ? styles.textDanger : expiredSoon ? styles.textWarning : ''}`}>
                                                                {fmt(b.expired_at)}
                                                            </span>
                                                        </div>
                                                        <div className={styles.batchMetaItem}>
                                                            <span className={styles.batchMetaLabel}>Total</span>
                                                            <span className={styles.batchMetaVal}>{Number(b.total_qty).toLocaleString('id-ID')} ml</span>
                                                        </div>
                                                        <div className={styles.batchMetaItem}>
                                                            <span className={styles.batchMetaLabel}>Terpakai</span>
                                                            <span className={`${styles.batchMetaVal} ${styles.textSuccess}`}>
                                                                {Number(b.used_qty).toLocaleString('id-ID')} ml
                                                            </span>
                                                        </div>
                                                        <div className={styles.batchMetaItem}>
                                                            <span className={styles.batchMetaLabel}>
                                                                {['EXPIRED', 'DAMAGED'].includes(b.status) ? 'Sisa (terbuang)' : 'Sisa'}
                                                            </span>
                                                            <span className={`${styles.batchMetaVal} ${['EXPIRED', 'DAMAGED'].includes(b.status) ? styles.textDanger : ''}`}>
                                                                {Number(b.remaining_qty).toLocaleString('id-ID')} ml
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Mini progress bar per batch */}
                                                    <div className={styles.batchProgress}>
                                                        <div className={styles.batchProgressFill} style={{
                                                            width: `${usedPct}%`,
                                                            background: ['EXPIRED', 'DAMAGED'].includes(b.status) ? 'var(--danger)' : 'var(--success)'
                                                        }} />
                                                    </div>
                                                    <div className={styles.batchProgressLabel}>
                                                        <span style={{ color: 'var(--brown-400)', fontSize: 10 }}>Terpakai {usedPct}%</span>
                                                        {b.notes && <span style={{ color: 'var(--brown-400)', fontSize: 10 }}>{b.notes}</span>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Pesan kalau mixing (tidak ada batch) */}
                            {!isAdonan && (
                                <div className={styles.mixNote}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="20" height="20">
                                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><circle cx="12" cy="16" r="1" fill="currentColor" />
                                    </svg>
                                    Produksi tipe <strong>Mixing</strong> tidak menggunakan sistem batch.
                                    Output langsung ditambahkan ke stok item{detail.output_item_name ? ` "${detail.output_item_name}"` : ''}.
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className={styles.footer}>
                    <button className={styles.btnClose} onClick={onClose}>Tutup</button>
                </div>
            </div>
        </div>
    );
}
