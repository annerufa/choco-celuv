// components/AbsensiTable/StatusModal.jsx
import { useState, useEffect } from 'react';
import styles from './AbsensiTable.module.css';

const STATUS_OPTIONS = [
    { value: 'izin',  label: 'Izin',  emoji: '📋', desc: 'Karyawan izin dengan keterangan' },
    { value: 'sakit', label: 'Sakit', emoji: '🤒', desc: 'Karyawan tidak masuk karena sakit' },
    { value: 'libur', label: 'Libur', emoji: '🏖️', desc: 'Hari libur / tidak dijadwalkan' },
];

export default function StatusModal({ isOpen, item, onClose, onSubmit, loading }) {
    const [selected, setSelected] = useState('izin');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (isOpen) {
            setSelected('izin');
            setNotes('');
        }
    }, [isOpen]);

    if (!isOpen || !item) return null;

    const handleSubmit = async () => {
        await onSubmit(selected, notes.trim() || null);
    };

    return (
        <div className={styles.modalBackdrop} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHead}>
                    <div>
                        <div className={styles.modalTitle}>Ubah Status Absensi</div>
                        <div style={{ fontSize: 12, color: 'var(--brown-400)', marginTop: 2 }}>
                            {item.employee_name} · {item.booth_name}
                        </div>
                    </div>
                    <button className={styles.drawerClose} onClick={onClose}>✕</button>
                </div>

                <div className={styles.modalBody}>
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--brown-600)', marginBottom: 10 }}>
                            Pilih Status
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {STATUS_OPTIONS.map(opt => (
                                <label
                                    key={opt.value}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        padding: '10px 14px',
                                        border: `1.5px solid ${selected === opt.value ? 'var(--accent)' : 'var(--brown-100)'}`,
                                        borderRadius: 10,
                                        cursor: 'pointer',
                                        background: selected === opt.value ? 'rgba(212,80,10,0.04)' : '#fff',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    <input
                                        type="radio"
                                        name="status"
                                        value={opt.value}
                                        checked={selected === opt.value}
                                        onChange={() => setSelected(opt.value)}
                                        style={{ accentColor: 'var(--accent)' }}
                                    />
                                    <span style={{ fontSize: 18 }}>{opt.emoji}</span>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--brown-900)' }}>{opt.label}</div>
                                        <div style={{ fontSize: 11, color: 'var(--brown-400)' }}>{opt.desc}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--brown-600)', marginBottom: 6 }}>
                            Catatan <span style={{ color: 'var(--brown-300)', fontWeight: 400 }}>(opsional)</span>
                        </div>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Contoh: Izin acara keluarga, surat dokter terlampir..."
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '9px 12px',
                                borderRadius: 8,
                                border: '1px solid var(--brown-200)',
                                background: 'var(--brown-50)',
                                fontSize: 13,
                                fontFamily: 'var(--font)',
                                color: 'var(--brown-900)',
                                outline: 'none',
                                resize: 'vertical',
                            }}
                        />
                    </div>
                </div>

                <div className={styles.modalFoot}>
                    <button className={styles.btnGhost} onClick={onClose} disabled={loading}>Batal</button>
                    <button className={styles.btnPrimary} onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Menyimpan...' : 'Simpan Status'}
                    </button>
                </div>
            </div>
        </div>
    );
}
