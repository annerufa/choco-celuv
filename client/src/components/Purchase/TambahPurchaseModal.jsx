import { useState, useEffect } from 'react';
import { usePurchase } from '../../hooks/usePurchase';
import styles from './TambahPurchaseModal.module.css';

const initialItem = { item_id: '', buy_qty: '', buy_unit: '', unit_price: '' };
const initialForm = {
    supplier: '',
    date: new Date().toISOString().split('T')[0],
    items: [{ ...initialItem }],
};
// const SATUAN = ['gram', 'ml', 'pcs', 'liter', 'kg', 'pak'];


export default function TambahPurchaseModal({ isOpen, onClose, onSuccess, itemList }) {
    const [formData, setFormData] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [conversions, setConversions] = useState({}); // { item_id: [...unit_conversions] }
    const { createPurchase, getUnitConversions, loading, error } = usePurchase();


    // Reset form saat modal dibuka
    useEffect(() => {
        if (isOpen) {
            setFormData(initialForm);
            setErrors({});
            setConversions({});
        }
    }, [isOpen]);

    // Tutup dengan Escape
    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    // Load unit conversions saat item dipilih
    async function handleItemChange(index, field, value) {
        setFormData(prev => {
            const items = [...prev.items];
            items[index] = { ...items[index], [field]: value };
            // Reset buy_unit kalau item berubah
            if (field === 'item_id') items[index].buy_unit = '';
            return { ...prev, items };
        });

        if (field === 'item_id' && value) {
            if (!conversions[value]) {
                const data = await getUnitConversions(value);
                setConversions(prev => ({ ...prev, [value]: data }));
            }
        }
    }


    function addItem() {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { ...initialItem }],
        }));
    }

    function removeItem(index) {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index),
        }));
    }

    function validate() {
        const errs = {};
        if (!formData.supplier.trim()) errs.supplier = 'Supplier wajib diisi';
        if (!formData.date) errs.date = 'Tanggal wajib diisi';
        formData.items.forEach((item, i) => {
            if (!item.item_id) errs[`item_${i}`] = 'Pilih barang';
            if (!item.buy_qty || item.buy_qty <= 0) errs[`qty_${i}`] = 'Qty tidak valid';
            if (!item.unit_price || item.unit_price <= 0) errs[`unit_price_${i}`] = 'Harga tidak valid';
        });
        return errs;
    }

    const total = formData.items.reduce((sum, item) =>
        sum + (Number(item.buy_qty) * Number(item.unit_price) || 0), 0
    );

    async function handleSubmit(e) {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }
        try {
            await createPurchase(formData);
            onSuccess?.();
            onClose();
        } catch {
            // error ditampilkan dari hook
        }
    }


    if (!isOpen) return null;

    return (
        <div className={styles.backdrop} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Tambah Purchase</h2>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Tutup">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className={styles.modalBody}>

                        {/* Supplier & Tanggal */}
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Supplier</label>
                                <input
                                    type="text"
                                    className={`${styles.input} ${errors.supplier ? styles.inputError : ''}`}
                                    placeholder="Nama supplier..."
                                    value={formData.supplier}
                                    onChange={e => setFormData(p => ({ ...p, supplier: e.target.value }))}
                                />
                                {errors.supplier && <span className={styles.errorMsg}>{errors.supplier}</span>}
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Tanggal</label>
                                <input
                                    type="date"
                                    className={`${styles.input} ${errors.date ? styles.inputError : ''}`}
                                    value={formData.date}
                                    onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                                />
                                {errors.date && <span className={styles.errorMsg}>{errors.date}</span>}
                            </div>
                        </div>

                        {/* Tabel items */}
                        <div className={styles.tableWrapper}>
                            <table className={styles.itemTable}>
                                <thead>
                                    <tr>
                                        <th>Barang</th>
                                        <th>Qty</th>
                                        <th>Satuan</th>
                                        <th>Harga Satuan</th>
                                        <th>Subtotal</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.items.map((item, i) => {
                                        const itemConversions = conversions[item.item_id] ?? [];
                                        const selectedItem = itemList?.find(it => String(it.id) === String(item.item_id));

                                        return (
                                            <tr key={i}>
                                                {/* Barang */}
                                                <td style={{ width: '300px' }}>
                                                    <select
                                                        className={`${styles.input} ${errors[`item_${i}`] ? styles.inputError : ''}`}
                                                        value={item.item_id}
                                                        onChange={e => handleItemChange(i, 'item_id', e.target.value)}
                                                    >
                                                        <option value="">Pilih barang...</option>
                                                        {itemList?.map(it => (
                                                            <option key={it.id} value={it.id}>{it.name} ({it.unit})</option>
                                                        ))}
                                                    </select>
                                                    {errors[`item_${i}`] && <span className={styles.errorMsg}>{errors[`item_${i}`]}</span>}
                                                </td>

                                                {/* Qty */}
                                                <td style={{ width: '120px' }}>
                                                    <input
                                                        type="number"
                                                        className={`${styles.input} ${errors[`qty_${i}`] ? styles.inputError : ''}`}
                                                        placeholder="0"
                                                        min="1"
                                                        value={item.buy_qty}
                                                        onChange={e => handleItemChange(i, 'buy_qty', e.target.value)}
                                                    />
                                                    {errors[`qty_${i}`] && <span className={styles.errorMsg}>{errors[`qty_${i}`]}</span>}
                                                </td>

                                                {/* Satuan Beli */}
                                                <td style={{ width: '130px' }}>
                                                    <select
                                                        className={styles.input}
                                                        value={item.buy_unit}
                                                        onChange={e => handleItemChange(i, 'buy_unit', e.target.value)}
                                                        disabled={!item.item_id}
                                                    >
                                                        {/* option default = satuan dasar item (fallback kalau tidak ada konversi) */}
                                                        <option value="">
                                                            {selectedItem ? selectedItem.unit : '-'}
                                                        </option>
                                                        {itemConversions.map(uc => (
                                                            <option key={uc.id} value={uc.buy_unit}>
                                                                {uc.label ?? uc.buy_unit} (1 {uc.buy_unit} = {uc.base_qty} {uc.base_unit})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>

                                                {/* Harga Satuan */}
                                                <td style={{ width: '150px' }}>
                                                    <div className={styles.inputPrefix}>
                                                        <span>Rp</span>
                                                        <input
                                                            type="number"
                                                            className={`${styles.input} ${errors[`unit_price_${i}`] ? styles.inputError : ''}`}
                                                            placeholder="0"
                                                            min="0"
                                                            value={item.unit_price}
                                                            onChange={e => handleItemChange(i, 'unit_price', e.target.value)}
                                                        />
                                                    </div>
                                                    {errors[`unit_price_${i}`] && <span className={styles.errorMsg}>{errors[`unit_price_${i}`]}</span>}
                                                </td>

                                                {/* Subtotal */}
                                                <td className={styles.subtotal}>
                                                    Rp {(Number(item.buy_qty) * Number(item.unit_price) || 0).toLocaleString('id')}
                                                </td>

                                                {/* Hapus */}
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

                        {/* Total */}
                        <div className={styles.totalRow}>
                            <span>Total</span>
                            <span className={styles.totalValue}>
                                Rp {total.toLocaleString('id')}
                            </span>
                        </div>

                        {/* Error dari API */}
                        {error && <div className={styles.alertError}>{error}</div>}

                    </div>

                    {/* Footer */}
                    <div className={styles.modalFooter}>
                        <button type="button" className={styles.btnGhost} onClick={onClose}>
                            Batal
                        </button>
                        <button type="submit" className={styles.btnPrimary} disabled={loading}>
                            {loading ? 'Menyimpan...' : 'Simpan Purchase'}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}