// src/components/Produksi/EditProduksiModal.jsx
import { useState } from 'react';
import styles from './ProduksiModal.module.css';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';
function getToken() { return localStorage.getItem('token'); }

export default function EditProduksiModal({ produksi, onClose, onSuccess }) {
    const [qty, setQty] = useState(produksi.qty);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [stockWarning, setStockWarning] = useState([]);

    const diff = qty - produksi.qty;
    const isDiff = diff !== 0;
    const isAdding = diff > 0;

    async function handleSubmit() {
        if (!isDiff) return setError('Qty sama, tidak ada perubahan');
        setLoading(true);
        setError(null);
        setStockWarning([]);
        try {
            // await axios.put(`${BASE_URL}/productions/${produksi.id}`, { qty: Number(qty) });
            await axios.put(`${BASE_URL}/productions/${produksi.id}`,
                { qty: Number(qty) },
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );
            onSuccess();
        } catch (err) {
            const msg = err.response?.data?.payload?.message ?? 'Gagal memperbarui';
            const kurang = err.response?.data?.payload?.data?.kurang ?? [];
            setError(msg);
            setStockWarning(kurang);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.backdrop} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.modalHeader}>
                    <div>
                        <div className={styles.modalTitle}>Edit Produksi</div>
                        <div className={styles.modalSub}>{produksi.recipe_name}</div>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {/* Info produksi */}
                    <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Tipe</span>
                            <span className={`${styles.pill} ${produksi.recipe_type === 'mix' ? styles.accent : styles.warning}`}>
                                {produksi.recipe_type === 'mix' ? 'Mixing' : 'Adonan'}
                            </span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Lokasi</span>
                            <span className={styles.infoVal}>{produksi.location_name}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Batch saat ini</span>
                            <span className={styles.infoVal}>{produksi.qty}x</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Output per batch</span>
                            <span className={styles.infoVal}>{produksi.output_qty} {produksi.output_unit}</span>
                        </div>
                    </div>

                    {/* Qty baru */}
                    <div className={styles.field}>
                        <label className={styles.label}>Jumlah Batch Baru</label>
                        <div className={styles.qtyRow}>
                            <button className={styles.qtyBtn} onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                            <input
                                type="number" min="1"
                                className={styles.qtyInput}
                                value={qty}
                                onChange={e => setQty(Math.max(1, Number(e.target.value)))}
                            />
                            <button className={styles.qtyBtn} onClick={() => setQty(q => q + 1)}>+</button>
                        </div>
                    </div>

                    {/* Preview selisih */}
                    {isDiff && (
                        <div className={`${styles.diffBox} ${isAdding ? styles.diffAdd : styles.diffSub}`}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                {isAdding
                                    ? <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>
                                    : <><line x1="5" y1="12" x2="19" y2="12" /></>
                                }
                            </svg>
                            {isAdding
                                ? `Tambah ${diff} batch — stok bahan akan berkurang lagi`
                                : `Kurangi ${Math.abs(diff)} batch — stok bahan akan dikembalikan`}
                            {produksi.recipe_type === 'mix' && (
                                <span style={{ opacity: 0.8 }}>
                                    {isAdding
                                        ? `, stok ${produksi.output_item_name ?? 'output'} bertambah ${Number(produksi.output_qty) * Math.abs(diff)} ${produksi.output_unit}`
                                        : `, stok ${produksi.output_item_name ?? 'output'} berkurang ${Number(produksi.output_qty) * Math.abs(diff)} ${produksi.output_unit}`}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Warning stok kurang */}
                    {stockWarning.length > 0 && (
                        <div className={styles.previewBox} style={{ marginTop: 0 }}>
                            <div className={styles.ingTitle} style={{ color: 'var(--danger)' }}>
                                ⚠ Stok tidak mencukupi:
                            </div>
                            <div className={styles.ingList}>
                                {stockWarning.map(k => (
                                    <div key={k.item_id} className={`${styles.ingRow} ${styles.ingRowDanger}`}>
                                        <span className={styles.ingName}>{k.item_name}</span>
                                        <span className={styles.ingQty}>
                                            butuh {k.needed} · ada {k.available}
                                            <span className={styles.ingWarn}> · kurang {k.selisih}</span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className={styles.errorBox}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={styles.modalFooter}>
                    <button className={styles.btnGhost} onClick={onClose} disabled={loading}>Batal</button>
                    <button className={styles.btnPrimary} onClick={handleSubmit} disabled={loading || !isDiff}>
                        {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </div>
            </div>
        </div>
    );
}
