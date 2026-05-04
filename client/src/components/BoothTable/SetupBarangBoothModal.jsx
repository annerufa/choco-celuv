// src/components/BarangBooth/SetupBarangBoothModal.jsx
import { useState, useEffect } from 'react';
import styles from './SetupBarangBoothModal.module.css';

/**
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - onSubmit: (itemId, booths: { booth_id, min, max, is_active }[]) => void
 *  - item: { id, name, category } | null   — barang yang sedang diedit
 *  - boothSettings: {                       — data stok barang ini di tiap booth
 *      booth_id, booth_name,
 *      min, max, is_active
 *    }[]
 */
export default function SetupBarangBoothModal({
    isOpen,
    onClose,
    onSubmit,
    item,
    boothSettings = [],
}) {
    const [rows, setRows] = useState([]);
    const [errors, setErrors] = useState({});

    // Sync state saat modal dibuka / data berubah
    useEffect(() => {
        if (isOpen && boothSettings.length) {
            setRows(
                boothSettings.map(b => ({
                    booth_id: b.booth_id,
                    booth_name: b.booth_name,
                    min: parseFloat(b.min ?? 0),
                    max: parseFloat(b.max ?? 0),
                    is_active: b.is_active ?? true,
                }))
            );
            setErrors({});
        }
    }, [isOpen, boothSettings]);

    if (!isOpen || !item) return null;

    // ── Helpers ──────────────────────────────────────────────
    function updateRow(booth_id, field, value) {
        setRows(prev =>
            prev.map(r => r.booth_id === booth_id ? { ...r, [field]: value } : r)
        );
        // Hapus error field ini kalau sudah diisi
        setErrors(prev => {
            const next = { ...prev };
            delete next[`${booth_id}_${field}`];
            return next;
        });
    }

    function validate() {
        const newErrors = {};
        rows.forEach(r => {
            const min = Number(r.min);
            const max = Number(r.max);
            if (r.min === '' || isNaN(min) || min < 0) {
                newErrors[`${r.booth_id}_min`] = 'Wajib diisi';
            }
            if (r.max === '' || isNaN(max) || max < 0) {
                newErrors[`${r.booth_id}_max`] = 'Wajib diisi';
            }
            if (!newErrors[`${r.booth_id}_min`] && !newErrors[`${r.booth_id}_max`] && min > max) {
                newErrors[`${r.booth_id}_min`] = 'Min > maks';
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    function handleSubmit() {
        if (!validate()) return;
        onSubmit(
            item.id,
            rows.map(r => ({
                booth_id: r.booth_id,
                min: Number(r.min),
                max: Number(r.max),
                is_active: r.is_active,
            }))
        );
        onClose();
    }

    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) onClose();
    }

    // ── Render ────────────────────────────────────────────────
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
                    <span className={styles.colMin}>Stok min</span>
                    <span className={styles.colMax}>Stok maks</span>
                    <span className={styles.colActive}>Aktif</span>
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

                            {/* Min */}
                            <div className={styles.fieldWrap}>
                                <input
                                    type="number"
                                    min="0"
                                    className={`${styles.numInput} ${errors[`${row.booth_id}_min`] ? styles.inputError : ''}`}
                                    value={row.min}
                                    onChange={e => updateRow(row.booth_id, 'min', e.target.value)}
                                    disabled={!row.is_active}
                                    placeholder="0"
                                />
                                {errors[`${row.booth_id}_min`] && (
                                    <span className={styles.errMsg}>{errors[`${row.booth_id}_min`]}</span>
                                )}
                            </div>

                            {/* Max */}
                            <div className={styles.fieldWrap}>
                                <input
                                    type="number"
                                    min="0"
                                    className={`${styles.numInput} ${errors[`${row.booth_id}_max`] ? styles.inputError : ''}`}
                                    value={row.max}
                                    onChange={e => updateRow(row.booth_id, 'max', e.target.value)}
                                    disabled={!row.is_active}
                                    placeholder="0"
                                />
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
                        </div>
                    ))}
                </div>

                {/* FOOTER */}
                <div className={styles.footer}>
                    <p className={styles.footerNote}>
                        Pengaturan ini hanya berlaku untuk stok barang di masing-masing booth, bukan gudang pusat.
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
