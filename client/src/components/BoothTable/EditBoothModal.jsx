// src/components/BoothTable/EditBoothModal.jsx
import { useState, useEffect, Suspense } from 'react';
import styles from './BoothModal.module.css';
import MapPicker from './MapPicker';

export default function EditBoothModal({ isOpen, onClose, onSubmit, booth }) {
    const [form, setForm] = useState(null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Pre-fill form setiap kali booth berubah
    useEffect(() => {
        if (booth) {
            setForm({
                name: booth.name || '',
                penyewa: booth.penyewa || '',
                address: booth.address || '',
                cp_penyewa: booth.cp_penyewa || '',
                harga: booth.harga ? String(booth.harga) : '',
                latitude: booth.latitude ? String(booth.latitude) : '',
                longitude: booth.longitude ? String(booth.longitude) : '',
                is_active: booth.is_active ?? 1,
                is_open: booth.is_open ?? 0,
            });
            setErrors({});
        }
    }, [booth]);

    if (!isOpen || !booth || !form) return null;

    function validate() {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Nama booth wajib diisi';
        if (!form.address.trim()) errs.address = 'Alamat wajib diisi';
        if (!form.latitude || !form.longitude) errs.location = 'Lokasi booth wajib dipilih di peta';
        if (!form.penyewa.trim()) errs.penyewa = 'Penyewa booth wajib diisi';
        if (!form.cp_penyewa.trim()) errs.cp_penyewa = 'Kontak penyewa booth wajib diisi';
        if (!form.harga) errs.harga = 'Harga sewa wajib diisi';
        return errs;
    }

    async function handleSubmit() {
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setLoading(true);
        try {
            await onSubmit(booth.id, {
                ...form,
                latitude: parseFloat(form.latitude),
                longitude: parseFloat(form.longitude),
                harga: parseInt(form.harga, 10),
            });
            setErrors({});
            onClose();
        } catch (err) {
            // Biarkan parent yang handle toast error
        } finally {
            setLoading(false);
        }
    }

    function handleMapChange({ latitude, longitude }) {
        setForm(f => ({ ...f, latitude, longitude }));
        if (latitude) setErrors(prev => ({ ...prev, location: undefined }));
    }

    return (
        <div
            className={`${styles.backdrop} ${styles.show}`}
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <div className={styles.modal}>
                <div className={styles.modalHead}>
                    <span className={styles.modalTitle}>Edit Booth — {booth.name}</span>
                    <button className={styles.modalClose} onClick={onClose}>✕</button>
                </div>

                <div className={styles.modalBody}>
                    {/* Row 1: Nama & Penyewa */}
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
                                className={`${styles.formInput} ${errors.penyewa ? styles.error : ''}`}
                                type="text"
                                placeholder="Bapak Joko"
                                value={form.penyewa}
                                onChange={e => setForm(f => ({ ...f, penyewa: e.target.value }))}
                            />
                            {errors.penyewa && <div className={styles.formError}>{errors.penyewa}</div>}
                        </div>
                    </div>

                    {/* Row 2: Harga & Contact */}
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Harga Sewa<span>*</span></label>
                            <div className={styles.inputWrapper}>
                                <span className={styles.inputPrefix}>Rp.</span>
                                <input
                                    className={`${styles.formInput} ${styles.inputWithPrefix} ${errors.harga ? styles.error : ''}`}
                                    type="text"
                                    placeholder="300.000"
                                    value={form.harga ? Number(form.harga).toLocaleString('id-ID') : ''}
                                    onChange={e => {
                                        const raw = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
                                        setForm(f => ({ ...f, harga: raw }));
                                    }}
                                />
                            </div>
                            {errors.harga && <div className={styles.formError}>{errors.harga}</div>}
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Contact Penyewa</label>
                            <input
                                className={`${styles.formInput} ${errors.cp_penyewa ? styles.error : ''}`}
                                type="text"
                                placeholder="0892-xxxx-xxxx"
                                value={form.cp_penyewa}
                                onChange={e => setForm(f => ({ ...f, cp_penyewa: e.target.value }))}
                            />
                            {errors.cp_penyewa && <div className={styles.formError}>{errors.cp_penyewa}</div>}
                        </div>
                    </div>

                    {/* Alamat */}
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

                    {/* Map Picker */}
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>
                            Lokasi Booth<span>*</span>
                            <span style={{ fontWeight: 400, fontSize: '11px', color: '#999', marginLeft: '6px' }}>
                                (klik peta untuk pindah pin)
                            </span>
                        </label>
                        <Suspense fallback={
                            <div style={{ height: '260px', borderRadius: '8px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#999' }}>
                                Memuat peta...
                            </div>
                        }>
                            <MapPicker
                                latitude={form.latitude}
                                longitude={form.longitude}
                                onChange={handleMapChange}
                            />
                        </Suspense>
                        {errors.location && <div className={styles.formError}>{errors.location}</div>}
                    </div>

                    {/* Status Toggle */}
                    <div className={styles.formGroup}>
                        <div
                            className={styles.formSwitch}
                            onClick={() => setForm(f => ({ ...f, is_active: f.is_active ? 0 : 1 }))}
                        >
                            <div className={`${styles.switchTrack} ${form.is_active ? styles.on : ''}`}>
                                <div className={styles.switchThumb} />
                            </div>
                            <span className={styles.switchLbl}>
                                Status Booth —{' '}
                                <span style={{ fontWeight: 700, color: form.is_active ? '#15803d' : 'var(--brown-500)' }}>
                                    {form.is_active ? 'Aktif' : 'Nonaktif'}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>

                <div className={styles.modalFoot}>
                    <button className={styles.btnGhost} onClick={onClose}>Batal</button>
                    <button
                        className={styles.btnPrimary}
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        <span>{loading ? '⏳' : '💾'}</span>
                        <span>{loading ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}