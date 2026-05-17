// src/components/ResepList/ResepList.jsx
import { useState, useMemo, useEffect } from 'react';
import styles from './ResepList.module.css';
import toast from 'react-hot-toast'; // ← tambah ini
import ConfirmModal from '../../components/Shared/ConfirmModal';

// ── Icon map ──────────────────────────────────────────────────
const RESEP_ICON = { mix: '🫙', adonan: '🥤' };

// ── Helpers ───────────────────────────────────────────────────
function relativeDate(isoString) {
    if (!isoString) return '—';
    const now = new Date();
    const then = new Date(isoString);
    const diffH = Math.round((now - then) / 36e5);
    if (diffH < 1) return 'Baru saja';
    if (diffH < 24) return 'Hari ini';
    if (diffH < 48) return 'Kemarin';
    return `${Math.floor(diffH / 24)} hari lalu`;
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ── Empty form state ──────────────────────────────────────────
const emptyForm = {
    name: '',
    type: 'mix',
    output_qty: '',
    output_unit: 'gram',
    expiry_hours: '',
    notes: '',
    bahan: [], // [{ item_id, item_name, qty, unit }]
};

// ─────────────────────────────────────────────────────────────
// Modal: Tambah / Edit Resep
// ─────────────────────────────────────────────────────────────
function ResepFormModal({ resep, itemList, onSave, onClose }) {
    const isEdit = !!resep;
    const [form, setForm] = useState(() => {
        if (!resep) return emptyForm;
        return {
            name: resep.name ?? '',
            type: resep.type ?? 'mix',
            output_qty: resep.output_qty ?? '',
            output_unit: resep.output_unit ?? 'gram',
            expiry_hours: resep.expiry_hours ?? '',
            notes: resep.notes ?? '',
            bahan: (resep.bahan ?? []).map(b => ({
                item_id: b.item_id,
                item_name: b.item_name,
                qty: b.qty_per_unit,
                unit: b.unit,
            })),
        };
    });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    // ── Set item_id yang sudah dipakai (untuk filter dropdown) ─
    const usedItemIds = useMemo(
        () => new Set(form.bahan.map(b => Number(b.item_id)).filter(Boolean)),
        [form.bahan],
    );
    // ── Bahan handlers ────────────────────────────────────────
    const addBahan = () => {
        setForm(f => ({
            ...f,
            bahan: [...f.bahan, { item_id: '', item_name: '', qty: '', unit: 'gram' }],
        }));
    };

    const removeBahan = (idx) => {
        setForm(f => ({ ...f, bahan: f.bahan.filter((_, i) => i !== idx) }));
    };

    const setBahan = (idx, key, val) => {
        setForm(f => {
            const bahan = [...f.bahan];
            bahan[idx] = { ...bahan[idx], [key]: val };
            // Auto-fill unit dari item yang dipilih
            if (key === 'item_id') {
                const item = itemList.find(i => i.id === Number(val));
                if (item) {
                    bahan[idx].item_name = item.name;
                    bahan[idx].unit = item.unit ?? 'gram';
                }
            }
            return { ...f, bahan };
        });
    };

    // ── Validasi ──────────────────────────────────────────────
    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Nama resep wajib diisi';
        if (!form.output_qty || Number(form.output_qty) <= 0) e.output_qty = 'Output qty wajib diisi';
        if (!form.output_unit.trim()) e.output_unit = 'Unit output wajib diisi';
        if (form.bahan.length === 0) e.bahan = 'Minimal 1 bahan';
        form.bahan.forEach((b, i) => {
            if (!b.item_id) e[`bahan_item_${i}`] = 'Pilih item';
            if (!b.qty || Number(b.qty) <= 0) e[`bahan_qty_${i}`] = 'Qty wajib diisi';
        });
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            const payload = {
                name: form.name.trim(),
                type: form.type,
                output_qty: Number(form.output_qty),
                output_unit: form.output_unit.trim(),
                expiry_hours: form.expiry_hours ? Number(form.expiry_hours) : null,
                notes: form.notes.trim() || null,
                // recipe_items dikirim sebagai array ke backend
                items: form.bahan.map(b => ({
                    item_id: Number(b.item_id),
                    qty: Number(b.qty),
                    unit: b.unit,
                })),
            };
            await onSave(payload);
            onClose();
        } catch (err) {
            console.error('Gagal simpan resep:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHead}>
                    <h2 className={styles.modalTitle}>
                        {isEdit ? 'Edit Resep' : 'Tambah Resep'}
                    </h2>
                    <button className={styles.modalClose} onClick={onClose}>✕</button>
                </div>

                <div className={styles.modalBody}>
                    {/* Info dasar */}
                    <div className={styles.formSection}>
                        <div className={styles.formSectionTitle}>Informasi Dasar</div>

                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Nama Resep *</label>
                                <input
                                    className={`${styles.formInput} ${errors.name ? styles.inputError : ''}`}
                                    value={form.name}
                                    onChange={e => set('name', e.target.value)}
                                    placeholder="Contoh: Choco Celuv Original"
                                />
                                {errors.name && <span className={styles.errorMsg}>{errors.name}</span>}
                            </div>

                            <div className={styles.formGroup} style={{ maxWidth: 140 }}>
                                <label className={styles.formLabel}>Tipe *</label>
                                <select
                                    className={styles.formSelect}
                                    value={form.type}
                                    onChange={e => set('type', e.target.value)}
                                >
                                    <option value="mix">Mix</option>
                                    <option value="adonan">Adonan</option>
                                </select>
                            </div>
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Output Qty *</label>
                                <input
                                    className={`${styles.formInput} ${errors.output_qty ? styles.inputError : ''}`}
                                    type="number"
                                    min="0"
                                    value={form.output_qty}
                                    onChange={e => set('output_qty', e.target.value)}
                                    placeholder="Contoh: 3000"
                                />
                                {errors.output_qty && <span className={styles.errorMsg}>{errors.output_qty}</span>}
                            </div>

                            <div className={styles.formGroup} style={{ maxWidth: 140 }}>
                                <label className={styles.formLabel}>Unit Output *</label>
                                <input
                                    className={`${styles.formInput} ${errors.output_unit ? styles.inputError : ''}`}
                                    value={form.output_unit}
                                    onChange={e => set('output_unit', e.target.value)}
                                    placeholder="gram / ml / porsi"
                                />
                                {errors.output_unit && <span className={styles.errorMsg}>{errors.output_unit}</span>}
                            </div>

                            <div className={styles.formGroup} style={{ maxWidth: 140 }}>
                                <label className={styles.formLabel}>Expiry (jam)</label>
                                <input
                                    className={styles.formInput}
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={form.expiry_hours}
                                    onChange={e => set('expiry_hours', e.target.value)}
                                    placeholder="Opsional"
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Catatan</label>
                            <textarea
                                className={styles.formTextarea}
                                value={form.notes}
                                onChange={e => set('notes', e.target.value)}
                                placeholder="Deskripsi singkat resep..."
                                rows={2}
                            />
                        </div>
                    </div>

                    {/* Bahan-bahan */}
                    <div className={styles.formSection}>
                        <div className={styles.formSectionTitleRow}>
                            <span className={styles.formSectionTitle}>Bahan-bahan</span>
                            <button className={styles.btnGhost} onClick={addBahan}>
                                + Tambah Bahan
                            </button>
                        </div>

                        {errors.bahan && (
                            <span className={styles.errorMsg}>{errors.bahan}</span>
                        )}

                        {form.bahan.length === 0 && (
                            <div className={styles.bahanEmpty}>
                                Belum ada bahan. Klik "+ Tambah Bahan" untuk mulai.
                            </div>
                        )}

                        {form.bahan.map((b, idx) => (
                            <div key={idx} className={styles.bahanFormRow}>
                                <div className={styles.formGroup} style={{ flex: 2 }}>
                                    {idx === 0 && <label className={styles.formLabel}>Item</label>}
                                    <select
                                        className={`${styles.formSelect} ${errors[`bahan_item_${idx}`] ? styles.inputError : ''}`}
                                        value={b.item_id}
                                        onChange={e => setBahan(idx, 'item_id', e.target.value)}
                                    >
                                        <option value="">-- Pilih item --</option>
                                        // SESUDAH:
                                        {itemList
                                            .filter(i => !usedItemIds.has(i.id) || i.id === Number(b.item_id))
                                            .map(i => (
                                                <option key={i.id} value={i.id}>{i.name}</option>
                                            ))
                                        }
                                    </select>
                                    {errors[`bahan_item_${idx}`] && (
                                        <span className={styles.errorMsg}>{errors[`bahan_item_${idx}`]}</span>
                                    )}
                                </div>

                                <div className={styles.formGroup} style={{ flex: 1 }}>
                                    {idx === 0 && <label className={styles.formLabel}>Qty</label>}
                                    <input
                                        className={`${styles.formInput} ${errors[`bahan_qty_${idx}`] ? styles.inputError : ''}`}
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={b.qty}
                                        onChange={e => setBahan(idx, 'qty', e.target.value)}
                                        placeholder="0"
                                    />
                                    {errors[`bahan_qty_${idx}`] && (
                                        <span className={styles.errorMsg}>{errors[`bahan_qty_${idx}`]}</span>
                                    )}
                                </div>

                                <div className={styles.formGroup} style={{ flex: 1 }}>
                                    {idx === 0 && <label className={styles.formLabel}>Unit</label>}
                                    <input
                                        className={styles.formInput}
                                        value={b.unit}
                                        onChange={e => setBahan(idx, 'unit', e.target.value)}
                                        placeholder="gram"
                                    />
                                </div>

                                <button
                                    className={styles.btnDanger}
                                    onClick={() => removeBahan(idx)}
                                    style={{ alignSelf: idx === 0 ? 'flex-end' : 'center' }}
                                    title="Hapus bahan"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.modalFoot}>
                    <button className={styles.btnGhost} onClick={onClose} disabled={saving}>
                        Batal
                    </button>
                    <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
                        {saving ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Tambah Resep'}
                    </button>
                </div>
            </div>
        </div>
    );
}



// ─────────────────────────────────────────────────────────────
// Sub-komponen: ResepCard
// ─────────────────────────────────────────────────────────────
function ResepCard({ resep, selected, onClick }) {
    const isNonaktif = resep.is_active === 0;
    return (
        <div
            className={`${styles.resepCard} ${selected ? styles.selected : ''} ${isNonaktif ? styles.resepNonaktif : ''}`}
            onClick={onClick}
        >
            <div className={styles.rcHead}>
                <div className={styles.rcHeadLeft}>
                    <div
                        className={styles.rcIcon}
                        style={{ background: resep.type === 'mix' ? '#FEE8D8' : '#DBEAFE' }}
                    >
                        {RESEP_ICON[resep.type] ?? '📋'}
                    </div>
                    <div>
                        <div className={styles.rcTitle}>{resep.name}</div>
                        {resep.notes && <div className={styles.rcSub}>{resep.notes}</div>}
                    </div>
                </div>
                <div className={styles.rcBadges}>
                    {isNonaktif && (
                        <span className={`${styles.badge} ${styles.badgeNonaktif}`}>
                            Nonaktif
                        </span>
                    )}
                    <span className={`${styles.badge} ${styles[`badge${capitalize(resep.type)}`]}`}>
                        {capitalize(resep.type)}
                    </span>
                </div>
            </div>
            {/* ...sisa card sama... */}

            <div className={styles.bahanList}>
                {(resep.bahan ?? []).slice(0, 4).map(b => (
                    <div key={b.item_id} className={styles.bahanRow}>
                        <span className={styles.bahanName}>
                            {b.item_name ?? `Item #${b.item_id}`}
                        </span>
                        <span className={styles.bahanQty}>
                            {b.qty_per_unit} {b.unit}
                        </span>
                    </div>
                ))}
                {(resep.bahan ?? []).length > 4 && (
                    <div className={styles.bahanMore}>
                        +{resep.bahan.length - 4} bahan lainnya
                    </div>
                )}
            </div>

            <div className={styles.rcFoot}>
                <div>
                    <div className={styles.rcFootLbl}>Output</div>
                    <div className={styles.rcFootVal}>{resep.output_qty} {resep.output_unit}</div>
                </div>
                <div>
                    <div className={styles.rcFootLbl}>Terakhir dibuat</div>
                    <div className={styles.rcFootVal}>{relativeDate(resep.last_made)}</div>
                </div>
                <div>
                    <div className={styles.rcFootLbl}>Total bahan</div>
                    <div className={styles.rcFootVal}>{(resep.bahan ?? []).length} item</div>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Sub-komponen: DetailPanel
// ─────────────────────────────────────────────────────────────
function DetailPanel({ resep, onEdit, onToggleStatus, actionLoading }) {
    if (!resep) {
        return (
            <div className={styles.detailPanel}>
                <div className={styles.detailEmpty}>
                    <span>Pilih resep untuk melihat detail</span>
                </div>
            </div>
        );
    }
    const isNonaktif = resep.is_active === 0;

    return (
        <div className={styles.detailPanel}>
            <div className={styles.dpHead}>
                <div
                    className={styles.dpIcon}
                    style={{ background: resep.type === 'mix' ? '#FEE8D8' : '#DBEAFE' }}
                >
                    {RESEP_ICON[resep.type] ?? '📋'}
                </div>
                <div className={styles.dpMeta}>
                    <div className={styles.dpTitleRow}>
                        <span className={styles.dpTitle}>{resep.name}</span>
                        <span className={`${styles.badge} ${styles[`badge${capitalize(resep.type)}`]}`}>
                            {capitalize(resep.type)}
                        </span>
                    </div>
                    <div className={styles.dpSubMeta}>
                        <span>{(resep.bahan ?? []).length} bahan</span>
                        <span>·</span>
                        <span>Output: {resep.output_qty} {resep.output_unit}</span>
                        {resep.expiry_hours && (
                            <>
                                <span>·</span>
                                <span>Kadaluarsa: {resep.expiry_hours} jam</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className={styles.dpBody}>
                {resep.notes && (
                    <div className={styles.dpNotes}>{resep.notes}</div>
                )}

                <div className={styles.dpSectionTitle}>Bahan-bahan</div>
                {(resep.bahan ?? []).map(b => (
                    <div key={b.item_id} className={styles.bahanDetailRow}>
                        <div className={styles.bahanDot} />
                        <div className={styles.bahanDetailName}>
                            {b.item_name ?? `Item #${b.item_id}`}
                        </div>
                        <div className={styles.bahanDetailQty}>
                            {b.qty_per_unit} {b.unit}
                        </div>
                    </div>
                ))}

                <div className={styles.dpActions}>
                    <button
                        className={isNonaktif ? styles.btnPrimary : styles.btnDanger}
                        onClick={() => onToggleStatus(resep)}
                        disabled={actionLoading === resep.id}
                    >
                        {actionLoading === resep.id
                            ? 'Menyimpan…'
                            : isNonaktif ? 'Aktifkan' : 'Nonaktifkan'}
                    </button>
                    <button className={styles.btnGhost} onClick={() => onEdit(resep)}>
                        Edit Resep
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Komponen utama: ResepList
// ─────────────────────────────────────────────────────────────
export default function ResepList({
    resepList,
    itemList = [],      // untuk dropdown bahan di form — dari useApi('/items')
    loading,
    error,
    onCreate,
    onUpdate,
    onDelete,
    onToggleStatus,
}) {
    const [activeTab, setActiveTab] = useState('semua');
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState(null);

    // Modal state
    const [showForm, setShowForm] = useState(false);
    const [editResep, setEditResep] = useState(null);
    const [showProduksi, setShowProduksi] = useState(false);
    const [produksiResep, setProduksiResep] = useState(null);

    const [actionLoading, setActionLoading] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, resep: null });

    // Auto-select resep pertama saat data loaded
    useEffect(() => {
        if (resepList.length > 0 && selectedId === null) {
            setSelectedId(resepList[0].id);
        }
    }, [resepList]);

    // ── Filter ────────────────────────────────────────────────
    const filtered = useMemo(() => {
        return resepList.filter(r => {
            const isArsip = r.is_active === 0;
            const matchTab =
                activeTab === 'arsip'
                    ? isArsip
                    : !isArsip && (activeTab === 'semua' || r.type === activeTab);
            const matchSearch =
                (r.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
                (r.notes ?? '').toLowerCase().includes(search.toLowerCase());
            return matchTab && matchSearch;
        });
    }, [resepList, activeTab, search]);

    const selectedResep = resepList.find(r => r.id === selectedId) ?? null;

    const counts = {
        semua: resepList.length,
        mix: resepList.filter(r => r.type === 'mix').length,
        adonan: resepList.filter(r => r.type === 'adonan').length,
        arsip: resepList.filter(r => r.is_active === 0).length,
    };

    const tabs = [
        { key: 'semua', label: 'Semua Resep' },
        { key: 'mix', label: 'Mixing' },
        { key: 'adonan', label: 'Adonan' },
        { key: 'arsip', label: 'Arsip' },
    ];

    // ── Handlers ──────────────────────────────────────────────

    const handleTambah = () => {
        setEditResep(null);
        setShowForm(true);
    };

    const handleEdit = (resep) => {
        setEditResep(resep);
        setShowForm(true);
    };

    const handleProduksi = (resep) => {
        setProduksiResep(resep);
        setShowProduksi(true);
    };

    const handleSaveForm = async (payload) => {
        if (editResep) {
            await onUpdate(editResep.id, payload);
        } else {
            await onCreate(payload);
        }
    };

    // Nonaktifkan — hit API DELETE (soft delete)
    const handleToggleStatus = async (resep) => {
        // console.log('toggle clicked', resep);
        setConfirmModal({ isOpen: true, resep });
    };

    const handleConfirmToggle = async () => {
        const resep = confirmModal.resep;
        setActionLoading(resep.id);
        try {
            await onToggleStatus(resep.id, resep.is_active === 0 ? 1 : 0);
            toast.success(
                `${resep.name} berhasil ${resep.is_active === 0 ? 'diaktifkan' : 'dinonaktifkan'}!`
            );
            setConfirmModal({ isOpen: false, resep: null });
        } catch {
            toast.error('Gagal mengubah status resep.');
        } finally {
            setActionLoading(null);
        }
    };

    // if (loading) return <div className={styles.stateBox}>Memuat resep…</div>;
    // if (error) return <div className={styles.stateBox}>Gagal memuat resep.</div>;

    return (
        <>
            <div className={styles.container}>
                {/* Tab bar + toolbar */}
                <div className={styles.topBar}>
                    <div className={styles.tabBar}>
                        {tabs.map(t => (
                            <button
                                key={t.key}
                                className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ''}`}
                                onClick={() => setActiveTab(t.key)}
                            >
                                {t.label}
                                <span className={`${styles.tabBadge} ${activeTab === t.key ? styles.tabBadgeActive : ''}`}>
                                    {counts[t.key]}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className={styles.toolbar}>
                        <div className={styles.searchBox}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Cari resep..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <button className={styles.btnPrimary} onClick={handleTambah}>
                            + Tambah Resep
                        </button>
                    </div>
                </div>

                {/* Ganti early return dengan kondisi inline di sini */}
                {loading && resepList.length === 0 ? (
                    <div className={styles.stateBox}>Memuat resep…</div>
                ) : error ? (
                    <div className={styles.stateBox}>Gagal memuat resep.</div>
                ) : (
                    <div className={`${styles.layoutSplit} ${selectedResep ? styles.layoutWithDetail : ''}`}>
                        <div className={styles.cardList}>
                            {filtered.length === 0 ? (
                                <div className={styles.stateBox}>Tidak ada resep ditemukan.</div>
                            ) : (
                                filtered.map(r => (
                                    <ResepCard
                                        key={r.id}
                                        resep={r}
                                        selected={selectedId === r.id}
                                        onClick={() => setSelectedId(prev => prev === r.id ? null : r.id)}
                                    />
                                ))
                            )}
                        </div>

                        {selectedResep && (
                            <DetailPanel
                                resep={selectedResep}
                                onEdit={handleEdit}
                                onToggleStatus={handleToggleStatus}
                                actionLoading={actionLoading}
                            />
                        )}
                    </div>
                )}
            </div>

            {/* Modal Tambah / Edit */}
            {
                showForm && (
                    <ResepFormModal
                        resep={editResep}
                        itemList={itemList}
                        onSave={handleSaveForm}
                        onClose={() => setShowForm(false)}
                    />
                )
            }

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.resep?.is_active === 0 ? 'Aktifkan Resep?' : 'Nonaktifkan Resep?'}
                message={
                    confirmModal.resep?.is_active === 0
                        ? `Resep "${confirmModal.resep?.name}" akan diaktifkan kembali.`
                        : `Resep "${confirmModal.resep?.name}" akan dinonaktifkan dan tidak muncul di daftar aktif.`
                }
                onConfirm={handleConfirmToggle}
                onClose={() => {
                    console.log('cancel clicked');
                    setConfirmModal({ isOpen: false, resep: null });
                }}
            />
        </>
    );
}