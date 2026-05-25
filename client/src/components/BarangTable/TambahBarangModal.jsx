// src/components/BarangTable/TambahBarangModal.jsx
import { useState, useEffect } from 'react';
import styles from './TambahBarangModal.module.css';
// import { BASE_URL } from '../../config';

// const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';
const KATEGORI = ['Bahan Baku', 'Mixing', 'Packaging', 'Lainnya'];
const SATUAN = ['gram', 'ml', 'pcs', 'liter', 'kg', 'pak'];

const initialForm = {
    nama: '',
    kategori: '',
    satuan: '',
    safety_stock: '',
    min: '',
    max: '',
};

export default function TambahBarangModal({ isOpen, onClose, onSubmit, loading, submutError }) {
    const [formData, setFormData] = useState(initialForm);
    const [errors, setErrors] = useState({});

    // Reset form setiap kali modal dibuka
    useEffect(() => {
        if (isOpen) {
            setFormData(initialForm);
            setErrors({});
        }
    }, [isOpen]);

    // Tutup modal kalau tekan Escape
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
        if (!formData.nama.trim()) newErrors.nama = 'Nama barang wajib diisi';
        if (!formData.kategori) newErrors.kategori = 'Pilih kategori';
        if (!formData.satuan) newErrors.satuan = 'Pilih satuan';
        // if (!formData.min) newErrors.min = 'Stok minimum wajib diisi';
        // if (!formData.max) newErrors.max = 'Stok maksimum wajib diisi';
        if (formData.min && formData.max && Number(formData.min) >= Number(formData.max)) {
            newErrors.max = 'Maksimum harus lebih besar dari minimum';
        }
        return newErrors;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

        onSubmit({
            name: formData.nama,
            category: formData.kategori,
            unit: formData.satuan,
            safety_stock: formData.safety_stock ? Number(formData.safety_stock) : null,
            min_qty: Number(formData.min) || 0,
            max_qty: Number(formData.max) || 0,
            is_active: 1,
        })
    }

    if (!isOpen) return null;


    return (
        // Backdrop — klik di luar modal = tutup
        <div className={styles.backdrop} onClick={onClose}>
            {/* Hentikan klik supaya tidak tembus ke backdrop */}
            <div className={styles.modal} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Tambah Barang</h2>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Tutup modal">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <div className={styles.modalBody}>
                    <div className={styles.formGrid}>

                        {/* Nama Barang — full width */}
                        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                            <label className={styles.label} htmlFor="nama">Nama Barang</label>
                            <input
                                id="nama"
                                name="nama"
                                type="text"
                                className={`${styles.input} ${errors.nama ? styles.inputError : ''}`}
                                placeholder="cth. Coklat Bubuk Premium"
                                value={formData.nama}
                                onChange={handleChange}
                            />
                            {errors.nama && <span className={styles.errorMsg}>{errors.nama}</span>}
                        </div>

                        {/* Kategori */}
                        <div className={`${styles.formGroup}  ${styles.halfWidth}`}>
                            <label className={styles.label} htmlFor="kategori">Kategori</label>
                            <select
                                id="kategori"
                                name="kategori"
                                className={`${styles.input} ${errors.kategori ? styles.inputError : ''}`}
                                value={formData.kategori}
                                onChange={handleChange}
                            >
                                <option value="">Pilih kategori...</option>
                                {KATEGORI.map(k => <option key={k} value={k}>{k}</option>)}
                            </select>
                            {errors.kategori && <span className={styles.errorMsg}>{errors.kategori}</span>}
                        </div>

                        {/* Satuan */}
                        <div className={`${styles.formGroup}  ${styles.halfWidth}`}>
                            <label className={styles.label} htmlFor="satuan">Satuan</label>
                            <select
                                id="satuan"
                                name="satuan"
                                className={`${styles.input} ${errors.satuan ? styles.inputError : ''}`}
                                value={formData.satuan}
                                onChange={handleChange}
                            >
                                <option value="">Pilih satuan...</option>
                                {SATUAN.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            {errors.satuan && <span className={styles.errorMsg}>{errors.satuan}</span>}
                        </div>

                        {/* safety stock */}
                        <div className={`${styles.formGroup} ${styles.miniWidth}`}>
                            <label className={styles.label} htmlFor="safety_stock">Stok Cadangan</label>
                            <div className={styles.inputWithSuffix}>
                                <input
                                    id="safety_stock"
                                    name="safety_stock"
                                    type="text"
                                    className={`${styles.input} ${errors.safety_stock ? styles.inputError : ''}`}
                                    placeholder="5000"
                                    value={formData.safety_stock ? Number(formData.safety_stock).toLocaleString('id') : ''}
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/\D/g, '');
                                        handleChange({ target: { name: 'safety_stock', value: raw } });
                                    }}
                                />
                                <span className={styles.suffix}>{formData.satuan}</span>
                            </div>
                            {errors.safety_stock && <span className={styles.errorMsg}>{errors.safety_stock}</span>}
                        </div>

                        {/* Min & Max */}
                        <div className={`${styles.formGroup} ${styles.miniWidth}`}>
                            <label className={styles.label} htmlFor="min">Stok Minimum</label>
                            <div className={styles.inputWithSuffix}>
                                <input
                                    id="min"
                                    name="min"
                                    type="text"
                                    className={`${styles.input} ${errors.min ? styles.inputError : ''}`}
                                    placeholder="5000"
                                    value={formData.min ? Number(formData.min).toLocaleString('id') : ''}
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/\D/g, '');
                                        handleChange({ target: { name: 'min', value: raw } });
                                    }}
                                />
                                <span className={styles.suffix}>{formData.satuan}</span>
                            </div>
                            <div className={styles.formHint}>Stok minimum untuk segera pesan ke suplier</div>
                            {errors.min && <span className={styles.errorMsg}>{errors.min}</span>}
                        </div>

                        <div className={`${styles.formGroup} ${styles.miniWidth}`}>
                            <label className={styles.label} htmlFor="max">Stok Maksimum</label>
                            <div className={styles.inputWithSuffix}>
                                <input
                                    id="max"
                                    name="max"
                                    type="text"
                                    className={`${styles.input} ${errors.max ? styles.inputError : ''}`}
                                    placeholder="3000"
                                    value={formData.max ? Number(formData.max).toLocaleString('id') : ''}
                                    onChange={(e) => {
                                        // Strip semua non-digit dulu, baru simpan ke state
                                        const raw = e.target.value.replace(/\D/g, '');
                                        handleChange({ target: { name: 'max', value: raw } });
                                    }}
                                />
                                <span className={styles.suffix}>{formData.satuan}</span>
                            </div>

                            <div className={styles.formHint}>Total maks/distribusi + cadangan</div>
                            {errors.max && <span className={styles.errorMsg}>{errors.max}</span>}
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className={styles.modalFooter}>
                    <button className={styles.btnGhost} onClick={onClose}>Batal</button>
                    <button className={styles.btnPrimary} onClick={handleSubmit}>
                        Simpan Barang
                    </button>
                </div>

            </div>
        </div >
    );
}