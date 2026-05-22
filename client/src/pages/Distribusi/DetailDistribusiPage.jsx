import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './DetailDistribusiPage.module.css';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

function getToken() { return localStorage.getItem('token'); }

function formatTgl(val) {
    if (!val) return '-';
    return new Date(val).toLocaleDateString('id-ID', {
        day: '2-digit', month: 'long', year: 'numeric'
    });
}

function formatDateTime(val) {
    if (!val) return '-';
    return new Date(val).toLocaleString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

const STATUS_CFG = {
    draft: { label: 'Draft', cls: 'grey', desc: 'Menunggu pickup kurir' },
    dikirim: { label: 'Dikirim', cls: 'warning', desc: 'Sedang dalam pengiriman' },
    diterima: { label: 'Diterima', cls: 'success', desc: 'Barang sudah diterima booth' },
    dibatalkan: { label: 'Dibatalkan', cls: 'danger', desc: 'Distribusi dibatalkan' },
};

const TYPE_LABEL = {
    warehouse_to_booth: 'Gudang → Booth',
    booth_to_booth: 'Booth → Booth',
};

// ── Timeline step ─────────────────────────────────────────
const STEPS = [
    { key: 'draft', label: 'Dibuat' },
    { key: 'dikirim', label: 'Dikirim' },
    { key: 'diterima', label: 'Diterima' },
];

const STATUS_ORDER = { draft: 0, dikirim: 1, diterima: 2, dibatalkan: -1 };

export default function DetailDistribusiPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [dist, setDist] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null); // 'pickup' | 'cancel' | 'receive'

    useEffect(() => { fetchDetail() }, [id]);

    async function fetchDetail() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${BASE_URL}/distribution/${id}`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.payload?.message ?? 'Distribusi tidak ditemukan');
            const data = json.payload?.data ?? json.data ?? json;
            setDist(data);
            setItems(Array.isArray(data.items) ? data.items : []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleAction(action) {
        setActionLoading(action);
        try {
            const res = await fetch(`${BASE_URL}/distribution/${id}/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.payload?.message ?? `Gagal ${action}`);
            setConfirmAction(null);
            fetchDetail();
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading(null);
        }
    }

    // ── Loading ───────────────────────────────────────────
    if (loading) return (
        <div className={styles.page} >
            <div className={styles.loadingWrap} >
                <div className={styles.spinner} />
                <span >Memuat detail distribusi... </span >
            </div >
        </div >
    );

    if (error) return (
        <div className={styles.page} >
            <div className={styles.errorWrap} >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="40" height="40" >
                    <circle cx="12" cy="12" r="10" /> <line x1="12" y1="8" x2="12" y2="12" /> <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg >
                <p >{error} </p >
                <button className={styles.btnGhost} onClick={() => navigate('/distribusi')} >Kembali </button >
            </div >
        </div >
    );

    const statusCfg = STATUS_CFG[dist.status] ?? { label: dist.status, cls: 'grey', desc: '' };
    const currentStep = STATUS_ORDER[dist.status] ?? 0;
    const isCancelled = dist.status === 'dibatalkan';
    const canPickup = dist.status === 'draft' && dist.kurir_id;
    const canCancel = !['diterima', 'dibatalkan'].includes(dist.status);
    const canReceive = dist.status === 'dikirim';

    return (
        <div className={styles.page} >

            {/* ── Breadcrumb ──────────────────────────────── */}
            <div className={styles.pageHeader} >
                <button className={styles.backBtn} onClick={() => navigate('/distribusi')} >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" >
                        <polyline points="15 18 9 12 15 6" />
                    </svg >
                    Kembali
                </button >
                <div className={styles.breadcrumb} >
                    <span onClick={() => navigate('/distribusi')} className={styles.breadcrumbLink} >Distribusi </span >
                    › Detail #{String(id).padStart(4, '0')}
                </div >
            </div >

            {/* ── Hero ────────────────────────────────────── */}
            <div className={styles.heroCard} >
                <div className={styles.heroLeft} >
                    <div className={styles.heroIcon} >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28" >
                            <rect x="1" y="3" width="15" height="13" rx="1" />
                            <path d="M16 8h4l3 4v4h-7V8z" />
                            <circle cx="5.5" cy="18.5" r="2.5" />
                            <circle cx="18.5" cy="18.5" r="2.5" />
                        </svg >
                    </div >
                    <div >
                        <div className={styles.heroId} >Distribusi #{String(id).padStart(4, '0')} </div >
                        <div className={styles.heroMeta} >
                            <span className={`${styles.pill} ${styles.pillBrown}`} >
                                {TYPE_LABEL[dist.type] ?? dist.type}
                            </span >
                            <span className={styles.metaDot} >· </span >
                            <span className={`${styles.pill} ${styles[statusCfg.cls]}`} >
                                {statusCfg.label}
                            </span >
                            <span className={styles.metaDot} >· </span >
                            <span className={styles.metaDesc} >{statusCfg.desc} </span >
                        </div >
                    </div >
                </div >

                {/* Tombol aksi */}
                <div className={styles.heroActions} >
                    {canPickup && (
                        <button className={styles.btnPickup} onClick={() => setConfirmAction('pickup')} >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" >
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg >
                            Konfirmasi Pickup
                        </button >
                    )}
                    {canReceive && (
                        <button className={styles.btnReceive} onClick={() => setConfirmAction('receive')} >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" >
                                <polyline points="20 6 9 17 4 12" />
                            </svg >
                            Terima Barang
                        </button >
                    )}
                    {canCancel && (
                        <button className={styles.btnCancel} onClick={() => setConfirmAction('cancel')} >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" >
                                <circle cx="12" cy="12" r="10" />
                                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                            </svg >
                            Batalkan
                        </button >
                    )}
                </div >
            </div >

            {/* ── Timeline ────────────────────────────────── */}
            {!isCancelled && (
                <div className={styles.card} >
                    <div className={styles.cardHeader} >
                        <span className={styles.cardTitle} >Status Pengiriman </span >
                    </div >
                    <div className={styles.timeline} >
                        {STEPS.map((step, i) => {
                            const done = currentStep > i;
                            const active = currentStep === i;
                            return (
                                <div key={step.key} className={styles.timelineStep} >
                                    <div className={`${styles.timelineDot} ${done ? styles.dotDone : active ? styles.dotActive : styles.dotPending}`} >
                                        {done ? (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="12" height="12" >
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg >
                                        ) : (
                                            <div className={styles.dotInner} />
                                        )}
                                    </div >
                                    {i < STEPS.length - 1 ?? (
                                        <div className={`${styles.timelineLine} ${done ? styles.lineDone : styles.linePending}`} />
                                    )}
                                    <div className={styles.timelineLabel} >{step.label} </div >
                                </div >
                            );
                        })}
                    </div >
                </div >
            )}

            {/* ── Grid Info ───────────────────────────────── */}
            <div className={styles.grid} >

                {/* Info Distribusi */}
                <div className={styles.card} >
                    <div className={styles.cardHeader} >
                        <span className={styles.cardTitle} >Informasi Distribusi </span >
                    </div >
                    <div className={styles.infoList} >
                        {[
                            { label: 'ID', value: `#${String(dist.id).padStart(4, '0')}` },
                            { label: 'Tipe', value: TYPE_LABEL[dist.type] ?? dist.type },
                            { label: 'Asal', value: dist.from_location_name ?? '-' },
                            { label: 'Tujuan', value: dist.to_location_name ?? '-' },
                            { label: 'Tanggal Rencana', value: formatTgl(dist.planned_date) },
                            { label: 'Dibuat oleh', value: dist.created_by_name ?? '-' },
                            { label: 'Kurir', value: dist.kurir_name ?? 'Tanpa kurir' },
                            { label: 'Catatan', value: dist.notes ?? '-' },
                        ].map(row => (
                            <div key={row.label} className={styles.infoRow} >
                                <span className={styles.infoLabel} >{row.label} </span >
                                <span className={styles.infoValue} >{row.value} </span >
                            </div >
                        ))}
                    </div >
                </div >

                {/* Riwayat Konfirmasi */}
                <div className={styles.card} >
                    <div className={styles.cardHeader} >
                        <span className={styles.cardTitle} >Riwayat Konfirmasi </span >
                    </div >
                    <div className={styles.infoList} >
                        {[
                            { label: 'Pickup oleh', value: dist.confirmed_by_kurir_name ?? '-' },
                            { label: 'Waktu pickup', value: formatDateTime(dist.confirmed_at_kurir) },
                            { label: 'Diterima oleh', value: dist.confirmed_by_booth_name ?? '-' },
                            { label: 'Waktu terima', value: formatDateTime(dist.confirmed_at_booth) },
                        ].map(row => (
                            <div key={row.label} className={styles.infoRow} >
                                <span className={styles.infoLabel} >{row.label} </span >
                                <span className={styles.infoValue} >{row.value} </span >
                            </div >
                        ))}
                    </div >

                    {/* Badge dibatalkan */}
                    {isCancelled && (
                        <div className={styles.cancelledBanner} >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" >
                                <circle cx="12" cy="12" r="10" /> <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                            </svg >
                            Distribusi ini telah dibatalkan
                        </div >
                    )}
                </div >

                {/* Tabel item — full width */}
                <div className={`${styles.card} ${styles.fullWidth}`} >
                    <div className={styles.cardHeader} >
                        <span className={styles.cardTitle} >Daftar Barang </span >
                        <span className={styles.cardSubtitle} >{items.length} item </span >
                    </div >
                    {items.length === 0 ? (
                        <div className={styles.emptyState} >Tidak ada item </div >
                    ) : (
                        <div className={styles.tableWrap} >
                            <table className={styles.table} >
                                <thead >
                                    <tr >
                                        <th >Barang </th >
                                        <th >Qty </th >
                                        <th >Catatan </th >
                                    </tr >
                                </thead >
                                <tbody >
                                    {items.map((item, i) => (
                                        <tr key={i} >
                                            <td className={styles.namaCell} >{item.item_name ?? `Item #${item.item_id}`} </td >
                                            <td className={styles.monoCell} >
                                                <strong >{Number(item.qty).toLocaleString('id')} </strong >
                                                <span style={{ color: 'var(--brown-400)', marginLeft: 4 }} >{item.unit ?? ''} </span >
                                            </td >
                                            <td style={{ color: 'var(--brown-400)', fontSize: 12 }} >
                                                {item.notes ?? '-'}
                                            </td >
                                        </tr >
                                    ))}
                                </tbody >
                            </table >
                        </div >
                    )}
                </div >
            </div >

            {/* ── Confirm Dialog ───────────────────────────── */}
            {confirmAction && (
                <div className={styles.confirmBackdrop} onClick={() => setConfirmAction(null)} >
                    <div className={styles.confirmBox} onClick={e => e.stopPropagation()} >
                        {confirmAction === 'pickup' && < >
                            <div className={styles.confirmIcon} style={{ background: '#FEE8D8', color: 'var(--accent)' }} >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24" >
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg >
                            </div >
                            <div className={styles.confirmTitle} >Konfirmasi Pickup? </div >
                            <div className={styles.confirmDesc} >Stok gudang akan berkurang dan status berubah menjadi  <strong >Dikirim </strong >. </div >
                        </ >}
                        {confirmAction === 'receive' && < >
                            <div className={styles.confirmIcon} style={{ background: '#D1FAE5', color: 'var(--success)' }} >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24" >
                                    <polyline points="20 6 9 17 4 12" />
                                </svg >
                            </div >
                            <div className={styles.confirmTitle} >Terima Barang? </div >
                            <div className={styles.confirmDesc} >Stok booth akan bertambah dan status berubah menjadi  <strong >Diterima </strong >. </div >
                        </ >}
                        {confirmAction === 'cancel' && < >
                            <div className={styles.confirmIcon} style={{ background: '#FEE2E2', color: 'var(--danger)' }} >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24" >
                                    <circle cx="12" cy="12" r="10" /> <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                </svg >
                            </div >
                            <div className={styles.confirmTitle} >Batalkan Distribusi? </div >
                            <div className={styles.confirmDesc} >
                                {dist.status === 'dikirim'
                                    ? 'Stok gudang akan dikembalikan. Tindakan ini tidak dapat diurungkan.'
                                    : 'Distribusi akan dibatalkan. Tindakan ini tidak dapat diurungkan.'}
                            </div >
                        </ >}
                        <div className={styles.confirmActions} >
                            <button className={styles.btnGhost} onClick={() => setConfirmAction(null)} disabled={!!actionLoading} >
                                Batal
                            </button >
                            <button
                                className={confirmAction === 'cancel' ? styles.btnDanger : styles.btnPrimary}
                                onClick={() => handleAction(confirmAction)}
                                disabled={!!actionLoading}
                            >
                                {actionLoading === confirmAction ? 'Memproses...' : (
                                    confirmAction === 'pickup' ? 'Ya, Pickup' :
                                        confirmAction === 'receive' ? 'Ya, Terima' : 'Ya, Batalkan'
                                )}
                            </button >
                        </div >
                    </div >
                </div >
            )}
        </div >
    );
}