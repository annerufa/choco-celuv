// src/components/BarangBooth/SetupBarangBoothModal.jsx
import { useState, useEffect, useRef } from 'react';
import styles from './SetupBarangBoothModal.module.css';

export default function SetupBarangBoothModal({
    isOpen,
    onClose,
    onSubmit,
    item,
    boothSettings = [],
}) {
    const [rows, setRows] = useState([]);
    const [errors, setErrors] = useState({});
    const initialRowsRef = useRef([]);

    useEffect(() => {
        if (isOpen && boothSettings.length) {
            const normalized = boothSettings.map(b => ({
                booth_id: b.booth_id,
                booth_name: b.booth_name,
                safety_stock: parseFloat(b.safety_stock ?? 0),
                min: parseFloat(b.min ?? 0),
                max: parseFloat(b.max ?? 0),
                is_active: b.is_active ?? true,
                can_purchase: b.can_purchase ?? false, // ✅ tambah
            }));
            setRows(normalized);
            initialRowsRef.current = normalized;
            setErrors({});
        }
    }, [isOpen, boothSettings]);

    if (!isOpen || !item) return null;

    function updateRow(booth_id, field, value) {
        setRows(prev =>
            prev.map(r => r.booth_id === booth_id ? { ...r, [field]: value } : r)
        );
        setErrors(prev => {
            const next = { ...prev };
            delete next[`${booth_id}_${field}`];
            return next;
        });
    }

    function getDirtyRows() {
        return rows.filter(row => {
            const orig = initialRowsRef.current.find(r => r.booth_id === row.booth_id);
            if (!orig) return true;
            return (
                Number(row.safety_stock) !== Number(orig.safety_stock) ||
                Number(row.min) !== Number(orig.min) ||
                Number(row.max) !== Number(orig.max) ||
                row.is_active !== orig.is_active ||
                row.can_purchase !== orig.can_purchase // ✅ tambah
            );
        });
    }

    function validate() {
        const newErrors = {};
        rows.forEach(r => {
            if (!r.is_active) return;
            const safety_stock = Number(r.safety_stock);
            const min = Number(r.min);
            const max = Number(r.max);
            if (r.safety_stock === '' || isNaN(safety_stock) || safety_stock < 0)
                newErrors[`${r.booth_id}_safety_stock`] = 'Wajib diisi';
            if (r.min === '' || isNaN(min) || min < 0)
                newErrors[`${r.booth_id}_min`] = 'Wajib diisi';
            if (r.max === '' || isNaN(max) || max < 0)
                newErrors[`${r.booth_id}_max`] = 'Wajib diisi';
            if (!newErrors[`${r.booth_id}_min`] && !newErrors[`${r.booth_id}_max`] && min > max)
                newErrors[`${r.booth_id}_min`] = 'Min > maks';
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    function handleSubmit() {
        if (!validate()) return;
        const dirtyRows = getDirtyRows();
        if (dirtyRows.length === 0) { onClose(); return; }

        onSubmit(
            item.id,
            dirtyRows.map(r => ({
                booth_id: r.booth_id,
                safety_stock: Number(r.safety_stock),
                min: Number(r.min),
                max: Number(r.max),
                is_active: r.is_active,
                can_purchase: r.can_purchase, // ✅ tambah
            }))
        );
        onClose();
    }

    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) onClose();
    }

    return (
        <div className={styles.backdrop} onClick={handleBackdropClick}>
            <div className={styles.modal}>

                {/* HEADER */}
                <div className={styles.header}>
                    <div className={styles.headerInfo}>
                        <p className={styles.headerLabel}>Pengaturan Stok per Booth</p>
                        <h2 className={styles.headerTitle}>{item.name}</h2>
                        <p className={styles.headerSub}>{item.category}</p>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Tutup">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* COLUMN LABELS */}
                <div className={styles.colLabels}>
                    <span className={styles.colBooth}>Booth</span>
                    <span className={styles.colSafety}>Stok cadangan</span>
                    <span className={styles.colMin}>Stok min</span>
                    <span className={styles.colMax}>Stok maks</span>
                    <span className={styles.colActive}>Aktif</span>
                    <span className={styles.colCanPurchase}>Bisa Beli</span> {/* ✅ tambah */}

                </div>

                {/* ROWS */}
                <div className={styles.body}>
                    {rows.map((row, idx) => (
                        <div
                            key={row.booth_id}
                            className={`${styles.row} ${!row.is_active ? styles.rowInactive : ''}`}
                        >
                            {/* Booth name */}
                            <div className={styles.boothName}>
                                <span className={styles.boothIdx}>{String(idx + 1).padStart(2, '0')}</span>
                                {row.booth_name}
                            </div>

                            {/* Safety stok */}
                            <div className={styles.fieldWrap}>
                                <div className={styles.inputGroup}>
                                    <input
                                        type="number" min="0"
                                        className={`${styles.numInput} ${errors[`${row.booth_id}_safety_stock`] ? styles.inputError : ''}`}
                                        value={row.safety_stock}
                                        onChange={e => updateRow(row.booth_id, 'safety_stock', e.target.value)}
                                        disabled={!row.is_active}
                                        placeholder="0"
                                    />
                                    <span className={styles.inputUnit}>{item.unit}</span>
                                </div>
                            </div>

                            {/* Min */}
                            <div className={styles.fieldWrap}>
                                <div className={styles.inputGroup}>
                                    <input
                                        type="number" min="0"
                                        className={`${styles.numInput} ${errors[`${row.booth_id}_min`] ? styles.inputError : ''}`}
                                        value={row.min}
                                        onChange={e => updateRow(row.booth_id, 'min', e.target.value)}
                                        disabled={!row.is_active}
                                        placeholder="0"
                                    />
                                    <span className={styles.inputUnit}>{item.unit}</span>
                                </div>
                                {errors[`${row.booth_id}_min`] && (
                                    <span className={styles.errMsg}>{errors[`${row.booth_id}_min`]}</span>
                                )}
                            </div>

                            {/* Max */}
                            <div className={styles.fieldWrap}>
                                <div className={styles.inputGroup}>
                                    <input
                                        type="number" min="0"
                                        className={`${styles.numInput} ${errors[`${row.booth_id}_max`] ? styles.inputError : ''}`}
                                        value={row.max}
                                        onChange={e => updateRow(row.booth_id, 'max', e.target.value)}
                                        disabled={!row.is_active}
                                        placeholder="0"
                                    />
                                    <span className={styles.inputUnit}>{item.unit}</span>
                                </div>
                                {errors[`${row.booth_id}_max`] && (
                                    <span className={styles.errMsg}>{errors[`${row.booth_id}_max`]}</span>
                                )}
                            </div>

                            {/* Toggle is_active */}
                            <div className={styles.toggleWrap}>
                                <button
                                    type="button"
                                    className={`${styles.toggle} ${row.is_active ? styles.toggleOn : ''}`}
                                    onClick={() => updateRow(row.booth_id, 'is_active', !row.is_active)}
                                    aria-label={row.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                >
                                    <span className={styles.toggleThumb} />
                                </button>
                            </div>

                            {/* ✅ Toggle can_purchase */}
                            <div className={styles.toggleWrap}>
                                <button
                                    type="button"
                                    className={`${styles.toggle} ${row.can_purchase ? styles.toggleBuy : ''}`}
                                    onClick={() => updateRow(row.booth_id, 'can_purchase', !row.can_purchase)}
                                    disabled={!row.is_active}   // ✅ disable kalau boothnya nonaktif, bukan kalau can_purchase = false
                                    aria-label={row.can_purchase ? 'Larang beli' : 'Izinkan beli'}
                                    title={!row.is_active ? 'Aktifkan booth dulu' : row.can_purchase ? 'Klik untuk larang beli' : 'Klik untuk izinkan beli'}
                                >
                                    <span className={styles.toggleThumb} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* FOOTER */}
                <div className={styles.footer}>
                    <p className={styles.footerNote}>
                        <strong>Bisa Beli</strong>: izinkan penjaga booth membeli item ini secara mandiri.
                    </p>
                    <div className={styles.footerActions}>
                        <button className={styles.btnGhost} onClick={onClose}>Batal</button>
                        <button className={styles.btnPrimary} onClick={handleSubmit}>Simpan perubahan</button>
                    </div>
                </div>

            </div>
        </div>
    );
}