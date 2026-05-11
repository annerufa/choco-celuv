// src/components/Distribusi/TambahDistribusiModal.jsx
import { useState, useEffect } from 'react';
import styles from './TambahDistribusiModal.module.css';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

const initialForm = {
    type: 'warehouse_to_booth',
    to_location_id: '',
    kurir_id: '',
    planned_date: new Date().toISOString().split('T')[0],
    notes: '',
    items: [{ item_id: '', qty: '' }],
};

function getToken() { return localStorage.getItem('token'); }
function authHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
    };
}

export default function TambahDistribusiModal({ isOpen, onClose, onSuccess, userLocationId }) {
    const [formData, setFormData] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const [boothList, setBoothList] = useState([]);
    const [kurirList, setKurirList] = useState([]);
    const [itemList, setItemList] = useState([]);
    const [loadingBooth, setLoadingBooth] = useState(false);
    const [loadingKurir, setLoadingKurir] = useState(false);
    const [loadingItems, setLoadingItems] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData(initialForm);
            setErrors({});
            fetchBooth();
            fetchKurir();
            fetchItems();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    async function fetchBooth() {
        setLoadingBooth(true);
        try {
            const res = await fetch(`${BASE_URL}/booth`, { headers: authHeaders() });
            const json = await res.json();
            const data = json.payload?.data ?? json.data ?? json ?? [];
            setBoothList(Array.isArray(data) ? data : []);
        } catch { setBoothList([]); }
        finally { setLoadingBooth(false); }
    }

    async function fetchKurir() {
        setLoadingKurir(true);
        try {
            const res = await fetch(`${BASE_URL}/karyawan/kurir`, { headers: authHeaders() });
            const json = await res.json();
            const data = json.payload?.data ?? json.data ?? json ?? [];
            setKurirList(Array.isArray(data) ? data : []);
        } catch { setKurirList([]); }
        finally { setLoadingKurir(false); }
    }

    async function fetchItems() {
        setLoadingItems(true);
        try {
            const res = await fetch(`${BASE_URL}/items?location_id=${userLocationId}`, { headers: authHeaders() });
            const json = await res.json();
            const data = json.payload?.data ?? json.data ?? json ?? [];
            setItemList(Array.isArray(data) ? data : []);
        } catch { setItemList([]); }
        finally { setLoadingItems(false); }
    }

    function handleChange(e) {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    }

    function handleItemChange(index, field, value) {
        setFormData(prev => {
            const items = [...prev.items];
            items[index] = { ...items[index], [field]: value };
            return { ...prev, items };
        });
        if (errors[`item_${index}`] || errors[`qty_${index}`]) {
            setErrors(prev => ({ ...prev, [`item_${index}`]: '', [`qty_${index}`]: '' }));
        }
    }

    function addItem() {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { item_id: '', qty: '' }],
        }));
    }

    function removeItem(index) {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index),
        }));
    }

    function getStokItem(item_id) {
        const found = itemList.find(it => String(it.id) === String(item_id));
        return found ? Number(found.current_stock ?? 0) : null;
    }

    function validate() {
        const errs = {};
        if (!formData.to_location_id) errs.to_location_id = 'Pilih booth tujuan';
        if (!formData.planned_date) errs.planned_date = 'Tanggal wajib diisi';

        formData.items.forEach((item, i) => {
            if (!item.item_id) errs[`item_${i}`] = 'Pilih barang';
            else if (!item.qty || Number(item.qty) <= 0) {
                errs[`qty_${i}`] = 'Qty tidak valid';
            } else {
                const stok = getStokItem(item.item_id);
                if (stok !== null && Number(item.qty) > stok) {
                    errs[`qty_${i}`] = `Melebihi stok (${stok})`;
                }
            }
        });

        const ids = formData.items.map(i => i.item_id).filter(Boolean);
        if (ids.length !== new Set(ids).size) errs.duplikat = 'Ada barang yang dipilih lebih dari sekali';

        return errs;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }

        setLoading(true);
        try {
            const payload = {
                type: 'warehouse_to_booth',
                to_location_id: Number(formData.to_location_id),
                kurir_id: formData.kurir_id ? Number(formData.kurir_id) : null,
                planned_date: formData.planned_date,
                notes: formData.notes || null,
                items: formData.items.map(i => ({
                    item_id: Number(i.item_id),
                    qty: Number(i.qty),
                })),
            };

            const res = await fetch(`${BASE_URL}/distribution`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify(payload),
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.message ?? json.payload?.message ?? 'Gagal membuat distribusi');

            onSuccess?.();
            onClose();
        } catch (err) {
            setErrors(prev => ({ ...prev, submit: err.message }));
        } finally {
            setLoading(false);
        }
    }

    // const boothTujuan = boothList.filter(b => String(b.id) !== String(userLocationId));
    const boothTujuan = boothList;
    const isWarehouseToBooth = formData.type === 'warehouse_to_booth';

    if (!isOpen) return null;

    return (
        <div className={styles.backdrop} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Tambah Distribusi</h2>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Tutup">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className={styles.modalBody}>

                        {errors.submit && <div className={styles.alertError}>{errors.submit}</div>}

                        {/* Tipe Distribusi */}
                        {/* <div className={styles.formGroup}>
                            <label className={styles.label}>Tipe Distribusi</label>
                            <div className={styles.radioGroup}>
                                {[
                                    { val: 'warehouse_to_booth', label: '🏭 Gudang → Booth', desc: 'Pengiriman via kurir' },
                                    { val: 'booth_to_booth', label: '🏪 Booth → Booth', desc: 'Pertukaran antar booth' },
                                ].map(opt => (
                                    <label
                                        key={opt.val}
                                        className={`${styles.radioCard} ${formData.type === opt.val ? styles.radioCardActive : ''}`}
                                    >
                                        <input
                                            type="radio"
                                            name="type"
                                            value={opt.val}
                                            checked={formData.type === opt.val}
                                            onChange={handleChange}
                                            style={{ display: 'none' }}
                                        />
                                        <span className={styles.radioLabel}>{opt.label}</span>
                                        <span className={styles.radioDesc}>{opt.desc}</span>
                                    </label>
                                ))}
                            </div>
                        </div> */}

                        <div className={styles.formGrid}>

                            {/* Tujuan */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Booth Tujuan</label>
                                <select
                                    name="to_location_id"
                                    className={`${styles.input} ${errors.to_location_id ? styles.inputError : ''}`}
                                    value={formData.to_location_id}
                                    onChange={handleChange}
                                    disabled={loadingBooth}
                                >
                                    <option value="">{loadingBooth ? 'Memuat...' : 'Pilih booth tujuan...'}</option>
                                    {boothTujuan.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                                {errors.to_location_id && <span className={styles.errorMsg}>{errors.to_location_id}</span>}
                            </div>

                            {/* Tanggal */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Tanggal Rencana</label>
                                <input
                                    type="date"
                                    name="planned_date"
                                    className={`${styles.input} ${errors.planned_date ? styles.inputError : ''}`}
                                    value={formData.planned_date}
                                    onChange={handleChange}
                                />
                                {errors.planned_date && <span className={styles.errorMsg}>{errors.planned_date}</span>}
                            </div>

                            {/* Kurir — hanya warehouse_to_booth */}
                            {isWarehouseToBooth && (
                                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                    <label className={styles.label}>
                                        Kurir <span className={styles.optional}>(opsional)</span>
                                    </label>
                                    <select
                                        name="kurir_id"
                                        className={styles.input}
                                        value={formData.kurir_id}
                                        onChange={handleChange}
                                        disabled={loadingKurir}
                                    >
                                        <option value="">{loadingKurir ? 'Memuat...' : 'Tanpa kurir / jasa pengiriman lain'}</option>
                                        {kurirList.map(k => (
                                            <option key={k.id} value={k.id}>{k.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Catatan */}
                            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                <label className={styles.label}>
                                    Catatan <span className={styles.optional}>(opsional)</span>
                                </label>
                                <textarea
                                    name="notes"
                                    className={styles.input}
                                    rows={2}
                                    placeholder="Catatan tambahan untuk kurir atau booth..."
                                    value={formData.notes}
                                    onChange={handleChange}
                                    style={{ resize: 'vertical', minHeight: 60 }}
                                />
                            </div>
                        </div>

                        {/* Item */}
                        <div className={styles.sectionTitle}>Item yang Didistribusikan</div>

                        {errors.duplikat && (
                            <div className={styles.alertError} style={{ marginBottom: 8 }}>{errors.duplikat}</div>
                        )}

                        <div className={styles.tableWrapper}>
                            <table className={styles.itemTable}>
                                <thead>
                                    <tr>
                                        <th>Barang</th>
                                        <th>Stok Tersedia</th>
                                        <th>Qty Kirim</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.items.map((item, i) => {
                                        const stok = getStokItem(item.item_id);
                                        const selectedItem = itemList.find(it => String(it.id) === String(item.item_id));
                                        return (
                                            <tr key={i}>
                                                <td>
                                                    <select
                                                        className={`${styles.input} ${errors[`item_${i}`] ? styles.inputError : ''}`}
                                                        value={item.item_id}
                                                        onChange={e => handleItemChange(i, 'item_id', e.target.value)}
                                                        disabled={loadingItems}
                                                    >
                                                        <option value="">{loadingItems ? 'Memuat...' : 'Pilih barang...'}</option>
                                                        {itemList.map(it => (
                                                            <option key={it.id} value={it.id}>{it.name} ({it.unit})</option>
                                                        ))}
                                                    </select>
                                                    {errors[`item_${i}`] && <span className={styles.errorMsg}>{errors[`item_${i}`]}</span>}
                                                </td>
                                                <td className={styles.stokCell}>
                                                    {item.item_id && stok !== null ? (
                                                        <span className={stok <= 0 ? styles.stokHabis : styles.stokAda}>
                                                            {stok} {selectedItem?.unit ?? ''}
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        className={`${styles.input} ${errors[`qty_${i}`] ? styles.inputError : ''}`}
                                                        placeholder="0"
                                                        min="1"
                                                        max={stok ?? undefined}
                                                        value={item.qty}
                                                        onChange={e => handleItemChange(i, 'qty', e.target.value)}
                                                    />
                                                    {errors[`qty_${i}`] && <span className={styles.errorMsg}>{errors[`qty_${i}`]}</span>}
                                                </td>
                                                <td>
                                                    {formData.items.length > 1 && (
                                                        <button type="button" className={styles.removeBtn} onClick={() => removeItem(i)}>
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                                <line x1="6" y1="6" x2="18" y2="18" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <button type="button" className={styles.addItemBtn} onClick={addItem}>
                            + Tambah Barang
                        </button>

                    </div>

                    {/* Footer */}
                    <div className={styles.modalFooter}>
                        <button type="button" className={styles.btnGhost} onClick={onClose} disabled={loading}>Batal</button>
                        <button type="submit" className={styles.btnPrimary} disabled={loading}>
                            {loading ? 'Menyimpan...' : 'Buat Distribusi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
