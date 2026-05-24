// src/components/Produksi/TambahProduksiModal.jsx
import { useState, useEffect } from 'react';
import styles from './ProduksiModal.module.css';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';
function getToken() { return localStorage.getItem('token'); }
export default function TambahProduksiModal({ isOpen, onClose, onSuccess }) {
    const [recipes, setRecipes] = useState([]);
    const [recipeId, setRecipeId] = useState('');
    const [qty, setQty] = useState(1);
    const [loading, setLoading] = useState(false);
    const [loadingRecipes, setLoadingRecipes] = useState(false);
    const [error, setError] = useState(null);
    const [stockWarning, setStockWarning] = useState([]); // item kurang

    const selectedRecipe = recipes.find(r => r.id === Number(recipeId));

    // Fetch resep aktif saat modal dibuka
    useEffect(() => {
        if (!isOpen) return;
        setRecipeId('');
        setQty(1);
        setError(null);
        setStockWarning([]);
        setLoadingRecipes(true);
        axios.get(`${BASE_URL}/productions/recipes`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        })

            // axios.get(`${BASE_URL}/productions/recipes`)
            .then(res => setRecipes(res.data?.payload?.data ?? []))
            .catch(() => setRecipes([]))
            .finally(() => setLoadingRecipes(false));
    }, [isOpen]);

    async function handleSubmit() {
        if (!recipeId) return setError('Pilih resep terlebih dahulu');
        if (!qty || qty < 1) return setError('Qty minimal 1');
        setLoading(true);
        setError(null);
        setStockWarning([]);
        try {
            // await axios.post(`${BASE_URL}/productions`, { recipe_id: Number(recipeId), qty: Number(qty) });
            await axios.post(`${BASE_URL}/productions`,
                { recipe_id: Number(recipeId), qty: Number(qty) },
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );
            onSuccess();
            onClose();
        } catch (err) {
            const msg = err.response?.data?.payload?.message ?? 'Gagal membuat produksi';
            const kurang = err.response?.data?.payload?.data?.kurang ?? [];
            setError(msg);
            setStockWarning(kurang);
        } finally {
            setLoading(false);
        }
    }

    if (!isOpen) return null;

    // Hitung kebutuhan bahan berdasarkan qty batch
    const ingredients = selectedRecipe?.ingredients ?? [];
    const totalOutput = selectedRecipe
        ? Number(selectedRecipe.output_qty) * qty
        : 0;

    return (
        <div className={styles.backdrop} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.modalHeader}>
                    <div>
                        <div className={styles.modalTitle}>Tambah Produksi</div>
                        <div className={styles.modalSub}>Pilih resep dan jumlah batch</div>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {/* Pilih Resep */}
                    <div className={styles.field}>
                        <label className={styles.label}>Resep</label>
                        {loadingRecipes ? (
                            <div className={styles.loadingText}>Memuat resep...</div>
                        ) : (
                            <select
                                className={styles.select}
                                value={recipeId}
                                onChange={e => { setRecipeId(e.target.value); setStockWarning([]); setError(null); }}
                            >
                                <option value="">— Pilih resep —</option>
                                <optgroup label="Mixing">
                                    {recipes.filter(r => r.type === 'mix').map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Adonan">
                                    {recipes.filter(r => r.type === 'adonan').map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </optgroup>
                            </select>
                        )}
                    </div>

                    {/* Qty batch */}
                    <div className={styles.field}>
                        <label className={styles.label}>Jumlah Batch</label>
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

                    {/* Preview resep */}
                    {selectedRecipe && (
                        <div className={styles.previewBox}>
                            {/* Info resep */}
                            <div className={styles.previewHeader}>
                                <span className={`${styles.pill} ${selectedRecipe.type === 'mix' ? styles.accent : styles.warning}`}>
                                    {selectedRecipe.type === 'mix' ? 'Mixing' : 'Adonan'}
                                </span>
                                {selectedRecipe.expiry_hours && (
                                    <span className={styles.expiry}>
                                        ⏱ Kadaluarsa {selectedRecipe.expiry_hours} jam
                                    </span>
                                )}
                            </div>

                            {/* Output */}
                            <div className={styles.outputRow}>
                                <span className={styles.outputLabel}>
                                    {selectedRecipe.type === 'mix' ? '📦 Output' : '🥣 Hasil per batch'}
                                </span>
                                <span className={styles.outputVal}>
                                    {totalOutput} {selectedRecipe.output_unit}
                                    {selectedRecipe.type === 'mix' && selectedRecipe.output_item_name && (
                                        <span style={{ color: 'var(--brown-500)', marginLeft: 4 }}>
                                            ({selectedRecipe.output_item_name})
                                        </span>
                                    )}
                                </span>
                            </div>

                            {/* Bahan-bahan */}
                            {ingredients.length > 0 && (
                                <>
                                    <div className={styles.ingTitle}>Bahan yang dibutuhkan:</div>
                                    <div className={styles.ingList}>
                                        {ingredients.map(ing => {
                                            const kurang = stockWarning.find(k => k.item_id === ing.item_id);
                                            const needed = Number(ing.qty) * qty;
                                            return (
                                                <div key={ing.item_id} className={`${styles.ingRow} ${kurang ? styles.ingRowDanger : ''}`}>
                                                    <span className={styles.ingName}>{ing.item_name}</span>
                                                    <span className={styles.ingQty}>
                                                        {needed} {ing.unit}
                                                        {kurang && (
                                                            <span className={styles.ingWarn}>
                                                                · tersedia {kurang.available}, kurang {kurang.selisih}
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
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
                    <button className={styles.btnPrimary} onClick={handleSubmit} disabled={loading || !recipeId}>
                        {loading ? 'Menyimpan...' : 'Buat Produksi'}
                    </button>
                </div>
            </div>
        </div>
    );
}
