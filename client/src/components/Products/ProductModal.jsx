// src/components/Products/ProductModal.jsx
import { useState, useEffect } from 'react';
import styles from './ProductModal.module.css';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';
function getToken() { return localStorage.getItem('token'); }
const headers = () => ({ Authorization: `Bearer ${getToken()}` });

const SIZES = ['kecil', 'sedang', 'jumbo'];

export default function ProductModal({ mode, produk, onClose, onSuccess }) {
    const isEdit = mode === 'edit';

    const [form, setForm] = useState({
        recipe_id: '',
        name:      '',
        size:      'kecil',
        price:     '',
        adonan_ml: '',
    });
    const [recipes, setRecipes]   = useState([]);
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState(null);

    useEffect(() => {
        // Fetch resep aktif untuk dropdown
        axios.get(`${BASE_URL}/productions/recipes`, { headers: headers() })
            .then(res => setRecipes(res.data?.payload?.data ?? []))
            .catch(() => {});

        if (isEdit && produk) {
            setForm({
                recipe_id: produk.recipe_id ?? '',
                name:      produk.name ?? '',
                size:      produk.size ?? 'kecil',
                price:     produk.price ?? '',
                adonan_ml: produk.adonan_ml ?? '',
            });
        }
    }, []);

    function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

    async function handleSubmit() {
        if (!form.recipe_id || !form.name || !form.size || !form.price || !form.adonan_ml) {
            return setError('Semua field wajib diisi');
        }
        setLoading(true);
        setError(null);
        try {
            if (isEdit) {
                await axios.put(`${BASE_URL}/products/${produk.id}`, form, { headers: headers() });
            } else {
                await axios.post(`${BASE_URL}/products`, form, { headers: headers() });
            }
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.payload?.message ?? 'Gagal menyimpan');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.backdrop} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <div>
                        <div className={styles.modalTitle}>{isEdit ? 'Edit Produk' : 'Tambah Produk'}</div>
                        <div className={styles.modalSub}>{isEdit ? produk?.name : 'Isi detail produk baru'}</div>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {/* Resep */}
                    <div className={styles.field}>
                        <label className={styles.label}>Resep</label>
                        <select className={styles.select} value={form.recipe_id} onChange={e => set('recipe_id', e.target.value)}>
                            <option value="">— Pilih resep —</option>
                            <optgroup label="Adonan">
                                {recipes.filter(r => r.type === 'adonan').map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </optgroup>
                            <optgroup label="Mixing">
                                {recipes.filter(r => r.type === 'mix').map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </optgroup>
                        </select>
                    </div>

                    {/* Nama */}
                    <div className={styles.field}>
                        <label className={styles.label}>Nama Produk</label>
                        <input className={styles.input} placeholder="Misal: Coklat Premium" value={form.name} onChange={e => set('name', e.target.value)} />
                    </div>

                    {/* Size */}
                    <div className={styles.field}>
                        <label className={styles.label}>Ukuran</label>
                        <div className={styles.sizeRow}>
                            {SIZES.map(s => (
                                <button
                                    key={s}
                                    type="button"
                                    className={`${styles.sizeBtn} ${form.size === s ? styles.sizeBtnActive : ''}`}
                                    onClick={() => set('size', s)}
                                >
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Price + Adonan */}
                    <div className={styles.row2}>
                        <div className={styles.field}>
                            <label className={styles.label}>Harga (Rp)</label>
                            <input
                                className={styles.input} type="number" min="0"
                                placeholder="15000"
                                value={form.price}
                                onChange={e => set('price', e.target.value)}
                            />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Adonan (ml)</label>
                            <input
                                className={styles.input} type="number" min="0"
                                placeholder="250"
                                value={form.adonan_ml}
                                onChange={e => set('adonan_ml', e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className={styles.errorBox}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            {error}
                        </div>
                    )}
                </div>

                <div className={styles.modalFooter}>
                    <button className={styles.btnGhost} onClick={onClose} disabled={loading}>Batal</button>
                    <button className={styles.btnPrimary} onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Produk'}
                    </button>
                </div>
            </div>
        </div>
    );
}
