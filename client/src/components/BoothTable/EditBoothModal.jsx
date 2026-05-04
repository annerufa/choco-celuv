// src/components/BoothTable/EditBoothModal.jsx
import { useState, useEffect } from 'react';
import styles from './BoothModal.module.css';

export default function EditBoothModal({ isOpen, onClose, onSubmit, booth }) {
    const [form, setForm] = useState({ name: '', code: '', address: '', phone: '', active: true });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (booth) setForm({ name: booth.name, code: booth.code, address: booth.address, phone: booth.phone || '', active: booth.active });
    }, [booth]);

    if (!isOpen) return null;

    function validate() {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Nama booth wajib diisi';
        if (!form.address.trim()) errs.address = 'Alamat wajib diisi';
        return errs;
    }

    async function handleSubmit() {
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setLoading(true);
        await new Promise(r => setTimeout(r, 800));
        onSubmit(booth.id, { ...form, code: form.code.toUpperCase() });
        setLoading(false);
        setErrors({});
    }

    return (
        <div className={`${styles.backdrop} ${styles.show}`} onClick={e => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal}>
                <div className={styles.modalHead}>
                    <span className={styles.modalTitle}>Edit Booth</span>
                    <button className={styles.modalClose} onClick={onClose}>✕</button>
                </div>
                <div className={styles.modalBody}>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Nama Booth<span>*</span></label>
                            <input
                                className={`${styles.formInput} ${errors.name ? styles.error : ''}`}
                                type="text"
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            />
                            {errors.name && <div className={styles.formError}>{errors.name}</div>}
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Kode Booth</label>
                            <input
                                className={styles.formInput}
                                type="text"
                                value={form.code}
                                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                            />
                        </div>
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Alamat Lengkap<span>*</span></label>
                        <textarea
                            className={`${styles.formInput} ${errors.address ? styles.error : ''}`}
                            rows={2}
                            value={form.address}
                            onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                            style={{ resize: 'vertical' }}
                        />
                        {errors.address && <div className={styles.formError}>{errors.address}</div>}
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>No. Telepon Booth</label>
                        <input
                            className={styles.formInput}
                            type="text"
                            value={form.phone}
                            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <div className={styles.formSwitch} onClick={() => setForm(f => ({ ...f, active: !f.active }))}>
                            <div className={`${styles.switchTrack} ${form.active ? styles.on : ''}`}>
                                <div className={styles.switchThumb} />
                            </div>
                            <span className={styles.switchLbl}>
                                Status Booth — <span style={{ fontWeight: 700, color: form.active ? '#15803d' : 'var(--brown-500)' }}>
                                    {form.active ? 'Aktif' : 'Nonaktif'}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
                <div className={styles.modalFoot}>
                    <button className={styles.btnGhost} onClick={onClose}>Batal</button>
                    <button className={styles.btnPrimary} onClick={handleSubmit} disabled={loading}>
                        <span>{loading ? '⏳' : '💾'}</span>
                        <span>{loading ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
