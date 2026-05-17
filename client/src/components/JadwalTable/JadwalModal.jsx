// components/JadwalTable/JadwalModal.jsx
import { useState, useEffect } from 'react';
import styles from './JadwalModal.module.css';

const emptyForm = {
    employee_id: '',
    booth_id: '',
    shift: 'pagi',
    expected_clock_in: '',
    expected_clock_out: '',
};

export default function JadwalModal({
    isOpen,
    onClose,
    onSubmit,
    editTarget = null,       // ← null = mode tambah, objek = mode edit
    employeeList = [],
    boothList = [],
    jadwalAktif = [],
    loading = false,
    submitError = null,
}) {
    const isEdit = Boolean(editTarget);

    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [jadwalLama, setJadwalLama] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);

    // Reset / isi form setiap modal dibuka
    useEffect(() => {
        if (!isOpen) return;
        setErrors({});
        setJadwalLama(null);
        setShowConfirm(false);

        if (isEdit) {
            // Isi form dengan data jadwal yang akan diedit
            setForm({
                employee_id: String(editTarget.employee_id ?? ''),
                booth_id: String(editTarget.booth_id ?? ''),
                shift: editTarget.shift ?? 'pagi',
                expected_clock_in: editTarget.expected_clock_in?.slice(0, 5) ?? '',
                expected_clock_out: editTarget.expected_clock_out?.slice(0, 5) ?? '',
            });
        } else {
            setForm(emptyForm);
        }
    }, [isOpen, editTarget]);

    // Cek jadwal aktif karyawan yang dipilih
    // Pada mode edit, abaikan jadwal milik dirinya sendiri
    useEffect(() => {
        if (!form.employee_id) { setJadwalLama(null); return; }

        const aktif = jadwalAktif.find(
            j =>
                String(j.employee_id) === String(form.employee_id) &&
                // Saat edit, jangan anggap jadwal dirinya sendiri sebagai "jadwal lama"
                (!isEdit || j.id !== editTarget?.id)
        );
        setJadwalLama(aktif ?? null);
    }, [form.employee_id, jadwalAktif, isEdit, editTarget]);

    const set = (key, val) => {
        setForm(f => ({ ...f, [key]: val }));
        setErrors(e => ({ ...e, [key]: undefined }));
    };

    const validate = () => {
        const e = {};
        if (!form.employee_id) e.employee_id = 'Pilih karyawan';
        if (!form.booth_id) e.booth_id = 'Pilih booth';
        if (!form.expected_clock_in) e.expected_clock_in = 'Jam masuk wajib diisi';
        if (!form.expected_clock_out) e.expected_clock_out = 'Jam keluar wajib diisi';
        if (
            form.expected_clock_in &&
            form.expected_clock_out &&
            form.expected_clock_in >= form.expected_clock_out
        ) {
            e.expected_clock_out = 'Jam keluar harus setelah jam masuk';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmitClick = () => {
        if (!validate()) return;
        // Konfirmasi ganti jadwal hanya berlaku di mode tambah
        if (jadwalLama) {
            setShowConfirm(true);
        } else {
            submitForm();
        }
    };

    const submitForm = async () => {
        await onSubmit({
            employee_id: Number(form.employee_id),
            booth_id: Number(form.booth_id),
            shift: form.shift,
            expected_clock_in: form.expected_clock_in,
            expected_clock_out: form.expected_clock_out,
        });
        setShowConfirm(false);
    };

    if (!isOpen) return null;

    // ── Konfirmasi ganti jadwal (hanya mode tambah) ──────────
    if (showConfirm && jadwalLama) {
        const employeeName = employeeList.find(e => String(e.id) === String(form.employee_id))?.name ?? '—';
        const boothLama = jadwalLama.booth_name ?? `Booth #${jadwalLama.booth_id}`;
        const boothBaru = boothList.find(b => String(b.id) === String(form.booth_id))?.name ?? `Booth #${form.booth_id}`;

        return (
            <div className={`${styles.backdrop} ${styles.show}`} onClick={() => setShowConfirm(false)}>
                <div className={styles.modal} style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
                    <div className={styles.modalHead}>
                        <h2 className={styles.modalTitle}>Ganti Jadwal?</h2>
                        <button className={styles.modalClose} onClick={() => setShowConfirm(false)}>✕</button>
                    </div>
                    <div className={styles.modalBody}>
                        <p style={{ fontSize: 14, textAlign: 'center' }}>
                            <strong>{employeeName}</strong> sudah punya jadwal aktif:
                        </p><br />
                        <div className={styles.jadwalCompare}>
                            <div className={styles.jadwalCompareItem} style={{ color: 'var(--text2)', opacity: 0.9 }}>
                                <span className={styles.jadwalCompareLabel}>Jadwal Lama </span>
                                <span className={styles.jadwalCompareBooth}>{boothLama} </span>
                                <span className={styles.jadwalCompareShift}>{jadwalLama.shift} </span>
                                <span className={styles.jadwalCompareJam}>
                                    {jadwalLama.expected_clock_in?.slice(0, 5)} – {jadwalLama.expected_clock_out?.slice(0, 5)}
                                </span>
                                <span className={styles.jadwalCompareTag} style={{ background: '#fee2e2', color: '#dc2626' }}>
                                    Akan digantikan
                                </span>
                            </div>
                            <div className={styles.jadwalArrow}>→</div>
                            <div className={styles.jadwalCompareItem}>
                                <span className={styles.jadwalCompareLabel}>Jadwal Baru</span>
                                <span className={styles.jadwalCompareBooth}>{boothBaru}</span>
                                <span className={styles.jadwalCompareShift}>{form.shift}</span>
                                <span className={styles.jadwalCompareJam}>
                                    {form.expected_clock_in} – {form.expected_clock_out}
                                </span>
                                <span className={styles.jadwalCompareTag} style={{ background: '#dcfce7', color: '#16a34a' }}>
                                    Jadwal aktif
                                </span>
                            </div>
                        </div>
                        <p style={{ marginTop: 16, fontSize: 13, color: 'var(--brown-400, #9ca3af)', textAlign: 'center' }}>
                            Jadwal lama akan otomatis dinonaktifkan.
                        </p>
                    </div>
                    <div className={styles.modalFoot}>
                        <button className={styles.btnGhost} onClick={() => setShowConfirm(false)} disabled={loading}>Batal</button>
                        <button className={styles.btnPrimary} onClick={submitForm} disabled={loading}>
                            {loading ? 'Menyimpan…' : 'Ya, Ganti Jadwal'}
                        </button>
                    </div>
                </div>
            </div >
        );
    }

    // ── Form utama ───────────────────────────────────────────
    return (
        <div className={`${styles.backdrop} ${styles.show}`} onClick={e => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal}>
                <div className={styles.modalHead}>
                    {/* Title beda sesuai mode */}
                    <span className={styles.modalTitle}>
                        {isEdit ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}
                    </span>
                    <button className={styles.modalClose} onClick={onClose}>✕</button>
                </div>

                <div className={styles.modalBody}>
                    {submitError && <div className={styles.alertError}>{submitError}</div>}

                    <div className={styles.formRow}>
                        <div className={`${styles.formGroup} ${styles.halfWidth}`}>
                            <label className={styles.formLabel}>Karyawan *</label>
                            <select
                                className={`${styles.formSelect} ${errors.employee_id ? styles.inputError : ''}`}
                                value={form.employee_id}
                                onChange={e => set('employee_id', e.target.value)}
                            >
                                <option value="">-- Pilih Karyawan --</option>
                                {employeeList.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))}
                            </select>
                            {errors.employee_id && <span className={styles.errorMsg}>{errors.employee_id}</span>}
                            {jadwalLama && (
                                <div className={styles.textWarning}>
                                    ⚠️ Sudah punya jadwal aktif: <strong>{jadwalLama.booth_name}</strong>,{' '}
                                    {jadwalLama.shift} ({jadwalLama.expected_clock_in?.slice(0, 5)}–{jadwalLama.expected_clock_out?.slice(0, 5)})
                                </div>
                            )}
                        </div>

                        <div className={`${styles.formGroup} ${styles.halfWidth}`}>
                            <label className={styles.formLabel}>Booth *</label>
                            <select
                                className={`${styles.formSelect} ${errors.booth_id ? styles.inputError : ''}`}
                                value={form.booth_id}
                                onChange={e => set('booth_id', e.target.value)}
                            >
                                <option value="">-- Pilih Booth --</option>
                                {boothList.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                            {errors.booth_id && <span className={styles.errorMsg}>{errors.booth_id}</span>}
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={`${styles.formGroup} ${styles.miniWidth}`}>
                            <label className={styles.formLabel}>Shift *</label>
                            <select
                                className={styles.formSelect}
                                value={form.shift}
                                onChange={e => set('shift', e.target.value)}
                            >
                                <option value="pagi">Pagi</option>
                                <option value="malam">Malam</option>
                            </select>
                        </div>

                        <div className={`${styles.formGroup} ${styles.miniWidth}`}>
                            <label className={styles.formLabel}>Jam Masuk *</label>
                            <input
                                type="time"
                                className={`${styles.formInput} ${errors.expected_clock_in ? styles.inputError : ''}`}
                                value={form.expected_clock_in}
                                onChange={e => set('expected_clock_in', e.target.value)}
                            />
                            {errors.expected_clock_in && <span className={styles.errorMsg}>{errors.expected_clock_in}</span>}
                        </div>

                        <div className={`${styles.formGroup} ${styles.miniWidth}`}>
                            <label className={styles.formLabel}>Jam Keluar *</label>
                            <input
                                type="time"
                                className={`${styles.formInput} ${errors.expected_clock_out ? styles.inputError : ''}`}
                                value={form.expected_clock_out}
                                onChange={e => set('expected_clock_out', e.target.value)}
                            />
                            {errors.expected_clock_out && <span className={styles.errorMsg}>{errors.expected_clock_out}</span>}
                        </div>
                    </div>
                </div>

                <div className={styles.modalFoot}>
                    <button className={styles.btnGhost} onClick={onClose} disabled={loading}>Batal</button>
                    <button className={styles.btnPrimary} onClick={handleSubmitClick} disabled={loading}>
                        {loading ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Simpan Jadwal'}
                    </button>
                </div>
            </div>
        </div>
    );
}