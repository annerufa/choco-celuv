// src/components/KaryawanTable/TambahKaryawanModal.jsx
import { useState } from 'react';
import styles from './KaryawanModal.module.css';

const INITIAL_FORM = {
    name: '',
    no_hp: '',
    nik: '',
    alamat: '',
    role: '',
    entry_date: new Date().toISOString().split('T')[0],
    is_active: 1
};

export default function TambahKaryawanModal({ isOpen, onClose, onSubmit, karyawanList = [] }) {
    const [form, setForm] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;
    function validate() {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Nama booth wajib diisi';
        if (!form.alamat.trim()) errs.alamat = 'Alamat wajib diisi';
        if (!form.nik) errs.nik = 'NIK wajib diisi';
        if (!form.no_hp) {
            errs.nik = 'No HP wajib diisi';
        } else if (form.no_hp.replace(/\D/g, '').length < 10) {
            errs.no_hp = 'No HP minimal 10 digit';
        }
        if (!form.role) errs.role = 'Jabatan wajib diisi';
        if (!form.entry_date) errs.entry_date = 'Tanggal masuk wajib diisi';

        // ── Cek duplikat ──────────────────────────────────────
        const nikRaw = form.nik.replace(/-/g, '');
        const hpRaw = form.no_hp.replace(/\D/g, '');

        if (nikRaw && karyawanList.some(k => k.nik.replace(/-/g, '') === nikRaw)) {
            errs.nik = 'NIK sudah terdaftar';
        }
        if (hpRaw && karyawanList.some(k => k.no_hp.replace(/\D/g, '') === hpRaw)) {
            errs.no_hp = 'No HP sudah terdaftar';
        }
        return errs;
    }

    async function handleSubmit() {
        const errs = validate(); // ✅ fix: deklarasi sebelum dipakai
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setLoading(true);
        try {
            await onSubmit({
                ...form,
                no_hp: form.no_hp.replace(/\D/g, ''),
            });
            console.log('onSubmit selesai'); // ← sampai sini?
            setForm(INITIAL_FORM);
            setErrors({});
            console.log('mau onClose'); // ← sampai sini?
            onClose();
            console.log('onClose dipanggil'); // ← sampai sini?
        } catch (err) {
            // Biarkan parent (handleTambahBooth) yang handle toast error
        } finally {
            setLoading(false);
        }
    }



    return (
        <div className={`${styles.backdrop} ${styles.show}`} onClick={e => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal}>
                <div className={styles.modalHead}>
                    <span className={styles.modalTitle}>Tambah Karyawan Baru</span>
                    <button className={styles.modalClose} onClick={onClose}>✕</button>
                </div>
                <div className={styles.modalBody}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Nama Karyawan<span>*</span></label>
                        <input
                            className={`${styles.formInput} ${errors.name ? styles.error : ''}`}
                            type="text"
                            placeholder="Masukkan nama lengkap"
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        />
                        {errors.name && <div className={styles.formError}>{errors.name}</div>}
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>NIK<span>*</span></label>
                            <input
                                className={`${styles.formInput} ${errors.nik ? styles.error : ''}`}
                                type="text"
                                placeholder="Masukkan nik"
                                value={form.nik}
                                onChange={e => {
                                    const digits = e.target.value.replace(/\D/g, '').slice(0, 16); // angka saja, max 13 digit
                                    const formatted = digits
                                        .replace(/^(\d{4})(\d{0,4})(\d{0,4})(\d{0,4})(\d{0,1})$/, (_, a, b, c, d) =>
                                            [a, b, c, d].filter(Boolean).join('-')
                                        );
                                    setForm(f => ({ ...f, nik: formatted }));
                                }}
                            />
                            {errors.nik && <div className={styles.formError}>{errors.nik}</div>}
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>No Hp<span>*</span></label>
                            <input
                                className={styles.formInput}
                                type="text"
                                placeholder="0812-xxxx-xxxx"
                                value={form.no_hp}
                                onChange={e => {
                                    const digits = e.target.value.replace(/\D/g, '').slice(0, 13); // angka saja, max 13 digit
                                    const formatted = digits
                                        .replace(/^(\d{4})(\d{0,4})(\d{0,4})(\d{0,1})$/, (_, a, b, c, d) =>
                                            [a, b, c, d].filter(Boolean).join('-')
                                        );
                                    setForm(f => ({ ...f, no_hp: formatted }));
                                }}
                            />
                            {errors.no_hp && <div className={styles.formError}>{errors.no_hp}</div>}
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Alamat Lengkap<span>*</span></label>
                        <textarea
                            className={`${styles.formInput} ${errors.alamat ? styles.error : ''}`}
                            rows={2}
                            placeholder="Jl. Besar Ijen No. 12, Blitar, Jawa Timur"
                            value={form.alamat}
                            onChange={e => setForm(f => ({ ...f, alamat: e.target.value }))}
                            style={{ resize: 'vertical' }}
                        />
                        {errors.alamat && <div className={styles.formError}>{errors.alamat}</div>}
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Jabatan<span>*</span></label>
                            <select className={`${styles.formInput} ${errors.role ? styles.error : ''}`}
                                value={form.role}
                                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}> // ✅ update state
                                <option value="" disabled hidden>  Pilih salah satu  </option>
                                <option value="kurir">Kurir</option>
                                <option value="penjaga_booth">Penjaga Booth</option>
                            </select>
                            {errors.latitude && <div className={styles.formError}>{errors.latitude}</div>}
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Tanggal Masuk<span>*</span></label>
                            <input
                                className={`${styles.formInput} ${errors.entry_date ? styles.error : ''}`}
                                type="date"
                                value={form.entry_date}
                                onChange={e => setForm(f => ({ ...f, entry_date: e.target.value }))}
                            />
                            {/* <div className={styles.formHint}>Opsional, untuk identifikasi cepat</div> */}
                        </div>
                    </div>
                    <div className={styles.formGroup}>
                        <div className={styles.formSwitch} onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}>
                            <div className={`${styles.switchTrack} ${form.is_active ? styles.on : ''}`}>
                                <div className={styles.switchThumb} />
                            </div>
                            <span className={styles.switchLbl}>
                                Status Karyawan — <span style={{ fontWeight: 700, color: form.is_active ? '#15803d' : 'var(--brown-500)' }}>
                                    {form.is_active ? 'Aktif' : 'Nonaktif'}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
                <div className={styles.modalFoot}>
                    <button className={styles.btnGhost} onClick={onClose}>Batal</button>
                    <button className={styles.btnPrimary} onClick={handleSubmit} disabled={loading}>
                        <span>{loading ? '⏳' : '💾'}</span>
                        <span>{loading ? 'Menyimpan...' : 'Simpan Karyawan'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
