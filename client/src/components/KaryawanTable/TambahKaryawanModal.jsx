// src/components/BoothTable/TambahBoothModal.jsx
import { useState } from 'react';
import styles from './BoothModal.module.css';

export default function TambahBoothModal({ isOpen, onClose, onSubmit }) {
    const [form, setForm] = useState({ name: '', code: '', address: '', phone: '', active: true });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

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
        // Simulasi delay (ganti dengan API call nyata)
        await new Promise(r => setTimeout(r, 800));
        onSubmit({ ...form, id: Date.now(), code: form.code.toUpperCase() });
        setLoading(false);
        setForm({ name: '', code: '', address: '', phone: '', active: true });
        setErrors({});
        onClose();
    }

    return (
        <div className={`${styles.backdrop} ${styles.show}`} onClick={e => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal}>
                <div className={styles.modalHead}>
                    <span className={styles.modalTitle}>Tambah Booth Baru</span>
                    <button className={styles.modalClose} onClick={onClose}>✕</button>
                </div>
                <div className={styles.modalBody}>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Nama Booth<span>*</span></label>
                            <input
                                className={`${styles.formInput} ${errors.name ? styles.error : ''}`}
                                type="text"
                                placeholder="Kebonrojo"
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            />
                            {errors.name && <div className={styles.formError}>{errors.name}</div>}
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Penyewa</label>
                            <input
                                className={styles.formInput}
                                type="text"
                                placeholder="Bapak Joko"
                                value={form.penyewa}
                                onChange={e => setForm(f => ({ ...f, penyewa: e.target.value.toUpperCase() }))}
                            />
                            {/* <div className={styles.formHint}>Opsional, untuk identifikasi cepat</div> */}
                        </div>
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Harga Sewa<span>*</span></label>
                            <input
                                className={`${styles.formInput} ${errors.harga ? styles.error : ''}`}
                                type="text"
                                placeholder="3.000.000"
                                value={form.harga}
                                onChange={e => setForm(f => ({ ...f, harga: e.target.value }))}
                            />
                            <div className={styles.formHint}>Isi angka saja tanpa titik</div>
                            {errors.harga && <div className={styles.formError}>{errors.harga}</div>}
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Contact Penyewa</label>
                            <input
                                className={styles.formInput}
                                type="text"
                                placeholder="0892-xxxx-xxxx"
                                value={form.cp_penyewa}
                                onChange={e => setForm(f => ({ ...f, cp_penyewa: e.target.value }))}
                            />
                            {/* <div className={styles.formHint}>Opsional, untuk identifikasi cepat</div> */}
                        </div>
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Alamat Lengkap<span>*</span></label>
                        <textarea
                            className={`${styles.formInput} ${errors.address ? styles.error : ''}`}
                            rows={2}
                            placeholder="Jl. Besar Ijen No. 12, Kediri, Jawa Timur"
                            value={form.address}
                            onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                            style={{ resize: 'vertical' }}
                        />
                        {errors.address && <div className={styles.formError}>{errors.address}</div>}
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Latitude<span>*</span></label>
                            <input
                                className={`${styles.formInput} ${errors.latitude ? styles.error : ''}`}
                                type="number"
                                placeholder=" -8.100000"
                                value={form.latitude}
                                onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))}
                            />
                            {/* <div className={styles.formHint}>Isi angka saja tanpa titik</div> */}
                            {errors.latitude && <div className={styles.formError}>{errors.latitude}</div>}
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Longitude</label>
                            <input
                                className={`${styles.formInput} ${errors.longitude ? styles.error : ''}`}
                                type="number"
                                placeholder="112.150002"
                                value={form.longitude}
                                onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))}
                            />
                            {/* <div className={styles.formHint}>Opsional, untuk identifikasi cepat</div> */}
                        </div>
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>No. Telepon Booth</label>
                        <input
                            className={styles.formInput}
                            type="text"
                            placeholder="0812-xxxx-xxxx"
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
                        <span>{loading ? 'Menyimpan...' : 'Simpan Booth'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
