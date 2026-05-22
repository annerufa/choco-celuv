// src/pages/DataBarang/SatuanBeliSection.jsx
// Taruh komponen ini di DetailBarangPage setelah card "Informasi"
//
// CARA PAKAI:
//   import SatuanBeliSection from './SatuanBeliSection';
//   <SatuanBeliSection itemId={item.id} baseUnit={item.unit} />
//
// ENDPOINT yang dibutuhkan (tambah di backend):
//   GET    /api/items/:id/unit-conversions       → list konversi
//   POST   /api/items/:id/unit-conversions       → tambah konversi
//   DELETE /api/items/:id/unit-conversions/:ucId → hapus konversi

import { useState, useEffect, useCallback } from 'react';
import styles from './DetailBarangPage.module.css';
import sStyles from './SatuanBeliSection.module.css';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

function getToken() {
    return localStorage.getItem('token');
}

const EMPTY_FORM = { label: '', buy_unit: '', buy_qty: '', base_qty: '' };

export default function SatuanBeliSection({ itemId, baseUnit }) {
    const [conversions, setConversions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [fetchError, setFetchError] = useState(null);
    const [saveError, setSaveError] = useState(null);

    // ── Fetch ────────────────────────────────────────
    const fetchConversions = useCallback(async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const res = await fetch(`${BASE_URL}/items/${itemId}/unit-conversions`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.payload?.message ?? 'Gagal memuat konversi');
            const data = json.payload?.data ?? json.data ?? json;
            setConversions(Array.isArray(data) ? data : []);
        } catch (err) {
            setFetchError(err.message);
        } finally {
            setLoading(false);
        }
    }, [itemId]);

    useEffect(() => { fetchConversions(); }, [fetchConversions]);

    // ── Form handlers ─────────────────────────────────
    function handleChange(e) {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        setSaveError(null);
    }

    function validate() {
        const err = {};
        if (!form.label.trim()) err.label = 'Wajib diisi';
        if (!form.buy_unit.trim()) err.buy_unit = 'Wajib diisi';
        if (!form.buy_qty || isNaN(form.buy_qty) || Number(form.buy_qty) <= 0)
            err.buy_qty = 'Harus angka > 0';
        if (!form.base_qty || isNaN(form.base_qty) || Number(form.base_qty) <= 0)
            err.base_qty = 'Harus angka > 0';
        return err;
    }

    async function handleSave() {
        const err = validate();
        if (Object.keys(err).length) { setErrors(err); return; }

        setSaving(true);
        setSaveError(null);
        try {
            const res = await fetch(`${BASE_URL}/items/${itemId}/unit-conversions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({
                    label: form.label.trim(),
                    buy_unit: form.buy_unit.trim(),
                    buy_qty: Number(form.buy_qty),
                    base_unit: baseUnit,
                    base_qty: Number(form.base_qty),
                }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.payload?.message ?? 'Gagal menyimpan');
            setForm(EMPTY_FORM);
            setErrors({});
            setShowForm(false);
            fetchConversions();
        } catch (err) {
            setSaveError(err.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(ucId) {
        if (!window.confirm('Hapus satuan beli ini?')) return;
        setDeletingId(ucId);
        try {
            const res = await fetch(`${BASE_URL}/items/${itemId}/unit-conversions/${ucId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.payload?.message ?? 'Gagal menghapus');
            }
            fetchConversions();
        } catch (err) {
            alert(err.message);
        } finally {
            setDeletingId(null);
        }
    }

    function cancelForm() {
        setShowForm(false);
        setForm(EMPTY_FORM);
        setErrors({});
        setSaveError(null);
    }

    // ── Render ────────────────────────────────────────
    return (
        <div className={`${styles.card} ${styles.fullWidth}`}>
            {/* Header */}
            <div className={styles.cardHeader}>
                <div>
                    <span className={styles.cardTitle}>Satuan Pembelian</span>
                    <span className={sStyles.baseUnitBadge}>
                        Satuan dasar: <strong>{baseUnit}</strong>
                    </span>
                </div>
                {!showForm && (
                    <button className={sStyles.btnAdd} onClick={() => setShowForm(true)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Tambah Satuan Beli
                    </button>
                )}
            </div>

            {/* Form Tambah */}
            {showForm && (
                <div className={sStyles.formWrap}>
                    <p className={sStyles.formHint}>
                        Contoh: <em>1 karung = 25.000 gram</em> → Label: "Karung 25kg", Satuan beli: "karung", Isi: 25000
                    </p>

                    {saveError && (
                        <div className={sStyles.saveError}>{saveError}</div>
                    )}

                    <div className={sStyles.formRow}>
                        {/* Label */}
                        <div className={sStyles.formField}>
                            <label className={sStyles.fieldLabel}>Label <span className={sStyles.req}>*</span></label>
                            <input
                                name="label"
                                className={`${sStyles.input} ${errors.label ? sStyles.inputErr : ''}`}
                                placeholder="cth: Karung 25kg"
                                value={form.label}
                                onChange={handleChange}
                            />
                            {errors.label && <span className={sStyles.errMsg}>{errors.label}</span>}
                        </div>

                        {/* Satuan beli */}
                        <div className={sStyles.formField}>
                            <label className={sStyles.fieldLabel}>Satuan Beli <span className={sStyles.req}>*</span></label>
                            <input
                                name="buy_unit"
                                className={`${sStyles.input} ${errors.buy_unit ? sStyles.inputErr : ''}`}
                                placeholder="cth: karung"
                                value={form.buy_unit}
                                onChange={handleChange}
                            />
                            {errors.buy_unit && <span className={sStyles.errMsg}>{errors.buy_unit}</span>}
                        </div>

                        {/* Qty beli */}
                        <div className={sStyles.formField} style={{ maxWidth: 100 }}>
                            <label className={sStyles.fieldLabel}>Jumlah Beli <span className={sStyles.req}>*</span></label>
                            <input
                                name="buy_qty"
                                type="number"
                                min="0.001"
                                step="any"
                                className={`${sStyles.input} ${errors.buy_qty ? sStyles.inputErr : ''}`}
                                placeholder="1"
                                value={form.buy_qty}
                                onChange={handleChange}
                            />
                            {errors.buy_qty && <span className={sStyles.errMsg}>{errors.buy_qty}</span>}
                        </div>

                        {/* Arrow */}
                        <div className={sStyles.arrowWrap}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </div>

                        {/* Base qty */}
                        <div className={sStyles.formField} style={{ maxWidth: 130 }}>
                            <label className={sStyles.fieldLabel}>Setara ({baseUnit}) <span className={sStyles.req}>*</span></label>
                            <div className={sStyles.inputSuffix}>
                                <input
                                    name="base_qty"
                                    type="number"
                                    min="0.001"
                                    step="any"
                                    className={`${sStyles.input} ${errors.base_qty ? sStyles.inputErr : ''}`}
                                    placeholder="25000"
                                    value={form.base_qty}
                                    onChange={handleChange}
                                />
                                <span className={sStyles.suffix}>{baseUnit}</span>
                            </div>
                            {errors.base_qty && <span className={sStyles.errMsg}>{errors.base_qty}</span>}
                        </div>
                    </div>

                    {/* Preview konversi */}
                    {form.buy_qty && form.base_qty && form.buy_unit && Number(form.buy_qty) > 0 && Number(form.base_qty) > 0 && (
                        <div className={sStyles.preview}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                                <polyline points="9 11 12 14 22 4" />
                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                            </svg>
                            {Number(form.buy_qty)} {form.buy_unit || '...'} = {Number(form.base_qty).toLocaleString('id')} {baseUnit}
                            {Number(form.buy_qty) > 1 &&
                                <span className={sStyles.previewSub}>
                                    &nbsp;· 1 {form.buy_unit} = {(Number(form.base_qty) / Number(form.buy_qty)).toLocaleString('id', { maximumFractionDigits: 3 })} {baseUnit}
                                </span>
                            }
                        </div>
                    )}

                    <div className={sStyles.formActions}>
                        <button className={styles.btnGhost} onClick={cancelForm} disabled={saving}>Batal</button>
                        <button className={sStyles.btnSave} onClick={handleSave} disabled={saving}>
                            {saving ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </div>
            )}

            {/* List */}
            {loading ? (
                <div className={styles.emptyState}>
                    <div className={styles.spinner} style={{ width: 20, height: 20, margin: '0 auto' }} />
                </div>
            ) : fetchError ? (
                <div className={styles.emptyState} style={{ color: 'var(--danger)' }}>{fetchError}</div>
            ) : conversions.length === 0 ? (
                <div className={styles.emptyState}>
                    Belum ada satuan beli — klik <strong>Tambah Satuan Beli</strong> untuk mulai
                </div>
            ) : (
                <div className={sStyles.tableWrap}>
                    <table className={sStyles.table}>
                        <thead>
                            <tr>
                                <th>Label</th>
                                <th>Satuan Beli</th>
                                <th>Konversi</th>
                                <th>Per 1 satuan</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {conversions.map(uc => (
                                <tr key={uc.id}>
                                    <td>
                                        <span className={sStyles.ucLabel}>{uc.label}</span>
                                    </td>
                                    <td>
                                        <span className={sStyles.ucUnit}>{uc.buy_unit}</span>
                                    </td>
                                    <td className={sStyles.monoCell}>
                                        {Number(uc.buy_qty)} {uc.buy_unit}
                                        <span className={sStyles.arrow}> → </span>
                                        {Number(uc.base_qty).toLocaleString('id')} {uc.base_unit ?? baseUnit}
                                    </td>
                                    <td className={sStyles.monoCell} style={{ color: 'var(--brown-500)', fontSize: 12 }}>
                                        1 {uc.buy_unit} = {(Number(uc.base_qty) / Number(uc.buy_qty)).toLocaleString('id', { maximumFractionDigits: 3 })} {uc.base_unit ?? baseUnit}
                                    </td>
                                    <td>
                                        <button
                                            className={sStyles.btnDelete}
                                            onClick={() => handleDelete(uc.id)}
                                            disabled={deletingId === uc.id}
                                            title="Hapus konversi ini"
                                        >
                                            {deletingId === uc.id ? '...' : (
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                                    <path d="M10 11v6M14 11v6" />
                                                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                                </svg>
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
