// src/components/Products/ComponentsModal.jsx
import { useState, useEffect } from 'react';
import styles from './ProductModal.module.css';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';
function getToken() { return localStorage.getItem('token'); }
const headers = () => ({ Authorization: `Bearer ${getToken()}` });

const APPLIES_TO_LABEL = { all: 'Semua', regular: 'Regular', less_ice: 'Less Ice' };
const APPLIES_TO_COLOR = {
    all: { bg: '#EDE9FE', color: '#7C3AED' },
    regular: { bg: '#D1FAE5', color: '#065F46' },
    less_ice: { bg: '#DBEAFE', color: '#1E40AF' },
};

export default function ComponentsModal({ produk, onClose }) {
    const [components, setComponents] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Form tambah komponen
    const [form, setForm] = useState({ item_id: '', qty: '', applies_to: 'all' });
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        fetchComponents();
        // Fetch items untuk dropdown
        axios.get(`${BASE_URL}/items`, { headers: headers() })
            .then(res => setItems(res.data?.payload?.data ?? []))
            .catch(() => { });
    }, []);

    async function fetchComponents() {
        setLoading(true);
        try {
            const res = await axios.get(`${BASE_URL}/products/${produk.id}/components`, { headers: headers() });
            setComponents(res.data?.payload?.data ?? []);
        } catch { setError('Gagal memuat komponen'); }
        finally { setLoading(false); }
    }

    async function handleAdd() {
        if (!form.item_id || !form.qty) return setError('item dan qty wajib diisi');
        setSaving(true);
        setError(null);
        try {
            await axios.post(`${BASE_URL}/products/${produk.id}/components`, form, { headers: headers() });
            setForm({ item_id: '', qty: '', applies_to: 'all' });
            setShowForm(false);
            fetchComponents();
        } catch (err) {
            setError(err.response?.data?.payload?.message ?? 'Gagal menambah komponen');
        } finally { setSaving(false); }
    }

    async function handleUpdateQty(comp, newQty) {
        try {
            await axios.put(
                `${BASE_URL}/products/${produk.id}/components/${comp.item_id}/${comp.applies_to}`,
                { qty: newQty },
                { headers: headers() }
            );
            setComponents(prev => prev.map(c =>
                c.item_id === comp.item_id && c.applies_to === comp.applies_to
                    ? { ...c, qty: newQty } : c
            ));
        } catch (err) {
            setError(err.response?.data?.payload?.message ?? 'Gagal update');
        }
    }

    async function handleDelete(comp) {
        try {
            await axios.delete(
                `${BASE_URL}/products/${produk.id}/components/${comp.item_id}/${comp.applies_to}`,
                { headers: headers() }
            );
            setComponents(prev => prev.filter(c =>
                !(c.item_id === comp.item_id && c.applies_to === comp.applies_to)
            ));
        } catch (err) {
            setError(err.response?.data?.payload?.message ?? 'Gagal hapus');
        }
    }

    // Group per applies_to
    const grouped = ['all', 'regular', 'less_ice'].reduce((acc, key) => {
        const items_ = components.filter(c => c.applies_to === key);
        if (items_.length > 0) acc[key] = items_;
        return acc;
    }, {});

    return (
        <div className={styles.backdrop} onClick={onClose}>
            <div className={styles.modal} style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <div>
                        <div className={styles.modalTitle}>Komponen Produk</div>
                        <div className={styles.modalSub}>{produk.name} · {produk.size}</div>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {loading ? (
                        <div className={styles.loadingText}>Memuat komponen...</div>
                    ) : (
                        <>
                            {/* List komponen grouped */}
                            {Object.keys(grouped).length === 0 ? (
                                <div className={styles.emptyComp}>Belum ada komponen. Tambah di bawah.</div>
                            ) : (
                                Object.entries(grouped).map(([applies_to, comps]) => (
                                    <div key={applies_to} className={styles.compGroup}>
                                        <div className={styles.compGroupLabel}>
                                            <span style={{
                                                background: APPLIES_TO_COLOR[applies_to]?.bg,
                                                color: APPLIES_TO_COLOR[applies_to]?.color,
                                                padding: '2px 10px', borderRadius: 20,
                                                fontSize: 11, fontWeight: 700,
                                            }}>
                                                {APPLIES_TO_LABEL[applies_to]}
                                            </span>
                                        </div>
                                        {comps.map(comp => (
                                            <CompRow
                                                key={`${comp.item_id}-${comp.applies_to}`}
                                                comp={comp}
                                                onUpdateQty={handleUpdateQty}
                                                onDelete={handleDelete}
                                            />
                                        ))}
                                    </div>
                                ))
                            )}

                            {/* Form tambah */}
                            {showForm ? (
                                <div className={styles.addForm}>
                                    <div className={styles.addFormTitle}>Tambah Komponen</div>
                                    <div className={styles.row2}>
                                        <div className={styles.field}>
                                            <label className={styles.label}>Item / Bahan</label>
                                            <select
                                                className={styles.select}
                                                value={form.item_id}
                                                onChange={e => setForm(f => ({ ...f, item_id: e.target.value }))}
                                            >
                                                <option value="">— Pilih item —</option>
                                                {items.map(it => (
                                                    <option key={it.id} value={it.id}>{it.name} ({it.unit})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className={styles.field}>
                                            <label className={styles.label}>Qty</label>
                                            <input
                                                className={styles.input} type="number" min="0" step="0.01"
                                                placeholder="0"
                                                value={parseFloat(form.qty)}
                                                onChange={e => setForm(f => ({ ...f, qty: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.field}>
                                        <label className={styles.label}>Berlaku untuk</label>
                                        <div className={styles.sizeRow}>
                                            {['all', 'regular', 'less_ice'].map(a => (
                                                <button
                                                    key={a} type="button"
                                                    className={`${styles.sizeBtn} ${form.applies_to === a ? styles.sizeBtnActive : ''}`}
                                                    onClick={() => setForm(f => ({ ...f, applies_to: a }))}
                                                >
                                                    {APPLIES_TO_LABEL[a]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {error && <div className={styles.errorBox}>{error}</div>}
                                    <div className={styles.addFormActions}>
                                        <button className={styles.btnGhost} onClick={() => { setShowForm(false); setError(null); }}>Batal</button>
                                        <button className={styles.btnPrimary} onClick={handleAdd} disabled={saving}>
                                            {saving ? 'Menyimpan...' : 'Tambah'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button className={styles.addCompBtn} onClick={() => setShowForm(true)}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                    Tambah Komponen
                                </button>
                            )}
                        </>
                    )}
                </div>

                <div className={styles.modalFooter}>
                    <button className={styles.btnPrimary} onClick={onClose}>Selesai</button>
                </div>
            </div>
        </div>
    );
}

// ── Comp Row ─────────────────────────────────────────────────
function CompRow({ comp, onUpdateQty, onDelete }) {
    const [editing, setEditing] = useState(false);
    const [qty, setQty] = useState(comp.qty);

    function handleSave() {
        onUpdateQty(comp, qty);
        setEditing(false);
    }

    return (
        <div className={styles.compRow}>
            <div className={styles.compInfo}>
                <span className={styles.compName}>{comp.item_name}</span>
                <span className={styles.compUnit}>{comp.unit}</span>
            </div>
            <div className={styles.compRight}>
                {editing ? (
                    <div className={styles.compEdit}>
                        <input
                            type="number" min="0" step="0.01"
                            className={styles.compQtyInput}
                            value={parseFloat(qty)}
                            onChange={e => setQty(e.target.value)}
                            autoFocus
                        />
                        <button className={styles.compSaveBtn} onClick={handleSave}>✓</button>
                        <button className={styles.compCancelBtn} onClick={() => { setQty(comp.qty); setEditing(false); }}>✕</button>
                    </div>
                ) : (
                    <>
                        <span className={styles.compQty} onClick={() => setEditing(true)} title="Klik untuk edit">
                            {parseFloat(comp.qty)}
                        </span>
                        <button className={styles.compDeleteBtn} onClick={() => onDelete(comp)} title="Hapus">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
