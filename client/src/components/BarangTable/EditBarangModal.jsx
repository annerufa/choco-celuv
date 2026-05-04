// src/components/BarangTable/EditBarangModal.jsx
import { useState, useEffect } from 'react';
import styles from './TambahBarangModal.module.css'; // pakai CSS yang sama

const KATEGORI = ['Bahan Baku', 'Hasil Mixing', 'Packaging', 'Lainnya'];
const SATUAN = ['gram', 'ml', 'pcs', 'liter', 'kg'];

export default function EditBarangModal({ isOpen, onClose, onSubmit, item }) {
    const [formData, setFormData] = useState({ name: '', category: '', unit: '', max: '', min: '', is_active: 1 });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Isi form dengan data item yang dipilih
    useEffect(() => {
        if (isOpen && item) {
            setFormData({
                name: item.name ?? '',
                category: item.category ?? '',
                unit: item.unit ?? '',
                min: parseFloat(item.min ?? ''),
                max: parseFloat(item.max ?? ''),
                is_active: item.is_active ?? 1,
            });
            setErrors({});
        }
    }, [isOpen, item]);

    // Tutup dengan Escape
    useEffect(() => {
        function handleKeyDown(e) { if (e.key === 'Escape') onClose(); }
        if (isOpen) document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    function handleChange(e) {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    }

    function validate() {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Nama barang wajib diisi';
        if (!formData.category) newErrors.category = 'Pilih kategori';
        if (!formData.unit) newErrors.unit = 'Pilih satuan';
        return newErrors;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

        setLoading(true);
        try {
            await onSubmit(item.id, formData);
            onClose();
        } catch (err) {
            setErrors({ submit: err.message || 'Gagal menyimpan perubahan' });
        } finally {
            setLoading(false);
        }
    }

    if (!isOpen) return null;

    return (
        <div className={styles.backdrop} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Edit Barang</h2>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Tutup modal">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className={styles.modalBody}>
                    {errors.submit && (
                        <div style={{ background: '#FEE2E2', color: 'var(--danger)', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
                            {errors.submit}
                        </div>
                    )}
                    <div className={styles.formGrid}>

                        {/* Nama */}
                        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                            <label className={styles.label} htmlFor="edit-name">Nama Barang</label>
                            <input
                                id="edit-name"
                                name="name"
                                type="text"
                                className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                                value={formData.name}
                                onChange={handleChange}
                            />
                            {errors.name && <span className={styles.errorMsg}>{errors.name}</span>}
                        </div>

                        {/* Kategori */}
                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="edit-category">Kategori</label>
                            <select
                                id="edit-category"
                                name="category"
                                className={`${styles.input} ${errors.category ? styles.inputError : ''}`}
                                value={formData.category}
                                onChange={handleChange}
                            >
                                <option value="">Pilih kategori...</option>
                                {KATEGORI.map(k => <option key={k} value={k}>{k}</option>)}
                            </select>
                            {errors.category && <span className={styles.errorMsg}>{errors.category}</span>}
                        </div>

                        {/* Satuan */}
                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="edit-unit">Satuan</label>
                            <select
                                id="edit-unit"
                                name="unit"
                                className={`${styles.input} ${errors.unit ? styles.inputError : ''}`}
                                value={formData.unit}
                                onChange={handleChange}
                            >
                                <option value="">Pilih satuan...</option>
                                {SATUAN.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            {errors.unit && <span className={styles.errorMsg}>{errors.unit}</span>}
                        </div>

                        {/* Min */}
                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="edit-min">Stok Minimun Gudang Pusat</label>
                            <input
                                id="edit-min"
                                name="min"
                                type="number"
                                className={`${styles.input} ${errors.min ? styles.inputError : ''}`}
                                placeholder="0"
                                value={formData.min}
                                onChange={handleChange}
                            />
                            {errors.min && <span className={styles.errorMsg}>{errors.min}</span>}
                        </div>

                        {/* Satuan */}
                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="edit-max">Stok Minimun Gudang Pusat</label>
                            <input
                                id="edit-max"
                                name="max"
                                type="number"
                                className={`${styles.input} ${errors.max ? styles.inputError : ''}`}
                                placeholder="0"
                                value={formData.max}
                                onChange={handleChange}
                            />
                            {errors.max && <span className={styles.errorMsg}>{errors.max}</span>}
                        </div>

                        {/* Status */}
                        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                            <label className={styles.label}>Status</label>
                            <div style={{ display: 'flex', gap: 12 }}>
                                {[{ val: 1, label: 'Aktif' }, { val: 0, label: 'Nonaktif' }].map(opt => (
                                    <label key={opt.val} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                                        <input
                                            type="radio"
                                            name="is_active"
                                            value={opt.val}
                                            checked={Number(formData.is_active) === opt.val}
                                            onChange={() => setFormData(prev => ({ ...prev, is_active: opt.val }))}
                                        />
                                        {opt.label}
                                    </label>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className={styles.modalFooter}>
                    <button className={styles.btnGhost} onClick={onClose} disabled={loading}>Batal</button>
                    <button className={styles.btnPrimary} onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </div>

            </div>
        </div>
    );
}
