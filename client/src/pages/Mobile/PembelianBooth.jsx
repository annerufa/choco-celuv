// src/pages/Mobile/PembelianBooth.jsx
//
// CARA PAKAI di MobilePenjaga.jsx PageRenderer:
//   import PembelianBooth from "./PembelianBooth";
//   if (page === "pembelian") return <PembelianBooth setPage={setPage} />;
//
// ENDPOINT yang dibutuhkan:
//   GET  /api/items/my                          → item di booth ini
//   GET  /api/items/:id/unit-conversions        → satuan beli per item
//   POST /api/purchases                         → submit purchase

import { useState, useEffect, useCallback } from "react";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

function getToken() { return localStorage.getItem("token"); }
function authHeaders() {
    return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

const initialItem = { item_id: "", buy_qty: "", buy_unit: "", unit_price: "" };
const initialForm = {
    date: new Date().toISOString().split("T")[0],
    items: [{ ...initialItem }],
};

// ── Icons ─────────────────────────────────────────────────
function IconBack() {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ width: 18, height: 18 }}>
        <polyline points="15 18 9 12 15 6" />
    </svg>;
}
function IconPlus() {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ width: 14, height: 14 }}>
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>;
}
function IconX() {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ width: 13, height: 13 }}>
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>;
}

// ── Item Row ──────────────────────────────────────────────
function ItemRow({ item, index, itemList, conversions, errors, onChange, onRemove, canRemove }) {
    const itemConversions = conversions[item.item_id] ?? [];
    const selectedItem = itemList.find(it => String(it.id) === String(item.item_id));
    const subtotal = (Number(item.buy_qty) * Number(item.unit_price)) || 0;

    // Cari konversi yang dipilih untuk tampilkan info
    const selectedConversion = itemConversions.find(uc => uc.buy_unit === item.buy_unit);

    return (
        <div style={{
            background: "var(--bg0)", borderRadius: 14,
            border: errors[`item_${index}`] || errors[`qty_${index}`] || errors[`buy_unit_${index}`] || errors[`unit_price_${index}`]
                ? "1.5px solid var(--red)" : "1px solid var(--border)",
            padding: "14px", marginBottom: 10,
            boxShadow: "0 1px 4px rgba(100,70,20,0.05)",
        }}>
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Barang {index + 1}
                </span>
                {canRemove && (
                    <button onClick={() => onRemove(index)} style={{
                        width: 24, height: 24, borderRadius: 7, border: "1px solid var(--border2)",
                        background: "var(--bg2)", display: "flex", alignItems: "center",
                        justifyContent: "center", cursor: "pointer", color: "var(--text3)",
                    }}>
                        <IconX />
                    </button>
                )}
            </div>

            {/* Pilih barang */}
            <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", display: "block", marginBottom: 4 }}>Barang</label>
                <select
                    value={item.item_id}
                    onChange={e => onChange(index, "item_id", e.target.value)}
                    style={{
                        width: "100%", padding: "10px 12px", borderRadius: 10,
                        border: errors[`item_${index}`] ? "1.5px solid var(--red)" : "1px solid var(--border2)",
                        background: "var(--bg1)", fontFamily: "inherit", fontSize: 13,
                        color: item.item_id ? "var(--text1)" : "var(--text3)", outline: "none",
                    }}
                >
                    <option value="">Pilih barang...</option>
                    {itemList.map(it => (
                        <option key={it.id} value={it.id}>{it.name} ({it.unit})</option>
                    ))}
                </select>
                {errors[`item_${index}`] && <span style={{ fontSize: 11, color: "var(--red)", marginTop: 3, display: "block" }}>{errors[`item_${index}`]}</span>}
            </div>

            {/* Satuan beli */}
            <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", display: "block", marginBottom: 4 }}>Satuan Beli</label>
                <select
                    value={item.buy_unit}
                    onChange={e => onChange(index, "buy_unit", e.target.value)}
                    disabled={!item.item_id}
                    style={{
                        width: "100%", padding: "10px 12px", borderRadius: 10,
                        border: errors[`buy_unit_${index}`] ? "1.5px solid var(--red)" : "1px solid var(--border2)",
                        background: !item.item_id ? "var(--bg2)" : "var(--bg1)",
                        fontFamily: "inherit", fontSize: 13,
                        color: item.buy_unit ? "var(--text1)" : "var(--text3)", outline: "none",
                    }}
                >
                    <option value="">
                        {!item.item_id ? "Pilih barang dulu" : itemConversions.length === 0 ? `${selectedItem?.unit ?? "-"} (satuan dasar)` : "Pilih satuan beli..."}
                    </option>
                    {itemConversions.map(uc => (
                        <option key={uc.id} value={uc.buy_unit}>
                            {uc.label ?? uc.buy_unit} — 1 {uc.buy_unit} = {Number(uc.base_qty).toLocaleString("id")} {uc.base_unit}
                        </option>
                    ))}
                </select>
                {errors[`buy_unit_${index}`] && <span style={{ fontSize: 11, color: "var(--red)", marginTop: 3, display: "block" }}>{errors[`buy_unit_${index}`]}</span>}

                {/* Info konversi yang dipilih */}
                {selectedConversion && (
                    <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 4, fontWeight: 600 }}>
                        Stok bertambah: {item.buy_qty ? `${(Number(item.buy_qty) * Number(selectedConversion.base_qty)).toLocaleString("id")} ${selectedConversion.base_unit}` : `... ${selectedConversion.base_unit}`}
                    </div>
                )}
            </div>

            {/* Qty & Harga dalam satu row */}
            <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", display: "block", marginBottom: 4 }}>Qty</label>
                    <input
                        type="number"
                        min="1"
                        placeholder="0"
                        value={item.buy_qty}
                        onChange={e => onChange(index, "buy_qty", e.target.value)}
                        style={{
                            width: "100%", padding: "10px 12px", borderRadius: 10,
                            border: errors[`qty_${index}`] ? "1.5px solid var(--red)" : "1px solid var(--border2)",
                            background: "var(--bg1)", fontFamily: "inherit", fontSize: 13,
                            color: "var(--text1)", outline: "none", boxSizing: "border-box",
                        }}
                    />
                    {errors[`qty_${index}`] && <span style={{ fontSize: 11, color: "var(--red)", marginTop: 3, display: "block" }}>{errors[`qty_${index}`]}</span>}
                </div>

                <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", display: "block", marginBottom: 4 }}>Harga / satuan</label>
                    <div style={{ position: "relative" }}>
                        <span style={{
                            position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                            fontSize: 12, fontWeight: 700, color: "var(--text3)", pointerEvents: "none",
                        }}>Rp</span>
                        <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={item.unit_price}
                            onChange={e => onChange(index, "unit_price", e.target.value)}
                            style={{
                                width: "100%", padding: "10px 12px 10px 30px", borderRadius: 10,
                                border: errors[`unit_price_${index}`] ? "1.5px solid var(--red)" : "1px solid var(--border2)",
                                background: "var(--bg1)", fontFamily: "inherit", fontSize: 13,
                                color: "var(--text1)", outline: "none", boxSizing: "border-box",
                            }}
                        />
                    </div>
                    {errors[`unit_price_${index}`] && <span style={{ fontSize: 11, color: "var(--red)", marginTop: 3, display: "block" }}>{errors[`unit_price_${index}`]}</span>}
                </div>
            </div>

            {/* Subtotal */}
            {subtotal > 0 && (
                <div style={{
                    marginTop: 10, padding: "8px 12px", borderRadius: 8,
                    background: "var(--accentsoft)", display: "flex",
                    justifyContent: "space-between", alignItems: "center",
                }}>
                    <span style={{ fontSize: 11, color: "var(--text2)", fontWeight: 600 }}>Subtotal</span>
                    <span style={{ fontSize: 13, fontWeight: 900, color: "var(--accent)" }}>
                        Rp {subtotal.toLocaleString("id")}
                    </span>
                </div>
            )}
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────
export default function PembelianBooth({ setPage }) {
    const [formData, setFormData] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [itemList, setItemList] = useState([]);
    const [conversions, setConversions] = useState({});
    const [loadingItems, setLoadingItems] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Fetch item di booth ini
    useEffect(() => {
        async function fetchItems() {
            setLoadingItems(true);
            try {
                const res = await fetch(`${BASE_URL}/items/my`, {
                    headers: { Authorization: `Bearer ${getToken()}` },
                });
                const json = await res.json();
                const data = json.payload?.data ?? json.data ?? json;
                setItemList(Array.isArray(data) ? data.filter(it => it.can_purchase == 1) : []);
                console.log("item lis:", itemList);

            } catch { setItemList([]); }
            finally { setLoadingItems(false); }
        }
        fetchItems();
    }, []);

    // Load unit conversions saat item dipilih
    async function handleItemChange(index, field, value) {
        setFormData(prev => {
            const items = [...prev.items];
            items[index] = { ...items[index], [field]: value };
            if (field === "item_id") {
                items[index].buy_unit = "";
                items[index].buy_qty = "";
                items[index].unit_price = "";
            }
            return { ...prev, items };
        });

        if (field === "item_id" && value && !conversions[value]) {
            try {
                const res = await fetch(`${BASE_URL}/items/${value}/unit-conversions`, {
                    headers: { Authorization: `Bearer ${getToken()}` },
                });
                const json = await res.json();
                const data = json.payload?.data ?? json.data ?? json;
                setConversions(prev => ({ ...prev, [value]: Array.isArray(data) ? data : [] }));
            } catch {
                setConversions(prev => ({ ...prev, [value]: [] }));
            }
        }

        // Clear error field ini
        setErrors(prev => {
            const next = { ...prev };
            delete next[`${field === "item_id" ? "item" : field}_${index}`];
            return next;
        });
    }

    function addItem() {
        setFormData(prev => ({ ...prev, items: [...prev.items, { ...initialItem }] }));
    }

    function removeItem(index) {
        setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
    }

    function validate() {
        const errs = {};
        if (!formData.date) errs.date = "Tanggal wajib diisi";
        const ids = formData.items.map(i => i.item_id).filter(Boolean);
        if (ids.length !== new Set(ids).size) errs.duplikat = "Ada barang yang dipilih lebih dari sekali";
        formData.items.forEach((item, i) => {
            if (!item.item_id) errs[`item_${i}`] = "Pilih barang";
            if (!item.buy_unit) errs[`buy_unit_${i}`] = "Pilih satuan";
            if (!item.buy_qty || Number(item.buy_qty) <= 0) errs[`qty_${i}`] = "Qty tidak valid";
            if (!item.unit_price || Number(item.unit_price) <= 0) errs[`unit_price_${i}`] = "Harga tidak valid";
        });
        return errs;
    }

    const total = formData.items.reduce((sum, item) =>
        sum + (Number(item.buy_qty) * Number(item.unit_price) || 0), 0
    );

    async function handleSubmit() {
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }

        setSubmitting(true);
        setSubmitError(null);
        try {
            const payload = {
                supplier: "Booth Purchase", // default, tidak perlu input dari booth
                date: formData.date,
                items: formData.items.map(item => {
                    const uc = (conversions[item.item_id] ?? []).find(c => c.buy_unit === item.buy_unit);
                    return {
                        item_id: Number(item.item_id),
                        buy_qty: Number(item.buy_qty),
                        buy_unit: item.buy_unit,
                        unit_price: Number(item.unit_price),
                        // kirim juga konversi ke base unit buat backend update stok
                        base_qty: uc ? Number(item.buy_qty) * Number(uc.base_qty) : Number(item.buy_qty),
                        base_unit: uc ? uc.base_unit : item.buy_unit,
                    };
                }),
            };

            const res = await fetch(`${BASE_URL}/purchase`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.payload?.message ?? json.message ?? "Gagal menyimpan");

            setSuccess(true);
        } catch (err) {
            setSubmitError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    // ── Success screen ────────────────────────────────────
    if (success) return (
        <div className="page">
            <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", minHeight: "70dvh", padding: "20px", gap: 16,
            }}>
                <div style={{
                    width: 72, height: 72, borderRadius: "50%",
                    background: "var(--greensoft)", display: "flex",
                    alignItems: "center", justifyContent: "center",
                }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" width="32" height="32">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "var(--text1)", textAlign: "center" }}>
                    Pembelian Berhasil!
                </div>
                <div style={{ fontSize: 13, color: "var(--text2)", textAlign: "center", lineHeight: 1.6 }}>
                    Stok booth sudah diperbarui.<br />Total: <strong>Rp {total.toLocaleString("id")}</strong>
                </div>
                <button
                    onClick={() => { setSuccess(false); setFormData(initialForm); setErrors({}); }}
                    style={{
                        padding: "12px 28px", borderRadius: 12, border: "none",
                        background: "var(--accent)", color: "#fff",
                        fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
                    }}
                >
                    Beli Lagi
                </button>
                <button
                    onClick={() => setPage("home")}
                    style={{
                        padding: "10px 28px", borderRadius: 12,
                        border: "1px solid var(--border2)", background: "transparent",
                        color: "var(--text2)", fontSize: 13, fontWeight: 600,
                        cursor: "pointer", fontFamily: "inherit",
                    }}
                >
                    Kembali ke Beranda
                </button>
            </div>
        </div>
    );

    return (
        <div className="page">
            {/* Header */}
            <div className="phead">
                <div className="phead-row">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <button onClick={() => setPage("home")} className="btnBack">
                            <IconBack />
                        </button>
                        <div>
                            <div className="ptitle">Pembelian</div>
                            <div className="psub">Catat pembelian untuk booth ini</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pbody">
                {/* Tanggal */}
                <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 6 }}>
                        Tanggal Pembelian
                    </label>
                    <input
                        type="date"
                        value={formData.date}
                        onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                        style={{
                            width: "100%", padding: "11px 14px", borderRadius: 11,
                            border: errors.date ? "1.5px solid var(--red)" : "1px solid var(--border2)",
                            background: "var(--bg0)", fontFamily: "inherit", fontSize: 13,
                            color: "var(--text1)", outline: "none", boxSizing: "border-box",
                        }}
                    />
                    {errors.date && <span style={{ fontSize: 11, color: "var(--red)", marginTop: 3, display: "block" }}>{errors.date}</span>}
                </div>

                {/* Error duplikat */}
                {errors.duplikat && (
                    <div style={{ padding: "10px 14px", borderRadius: 10, background: "var(--redsoft)", color: "var(--red)", fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
                        {errors.duplikat}
                    </div>
                )}

                {/* Daftar item */}
                <div className="sec-title" style={{ marginBottom: 10 }}>
                    Daftar Barang
                </div>

                {loadingItems ? (
                    <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text3)", fontSize: 13 }}>Memuat daftar barang...</div>
                ) : itemList.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text3)", fontSize: 13 }}>
                        Tidak ada barang terdaftar di booth ini
                    </div>
                ) : (
                    <>
                        {formData.items.map((item, i) => {
                            const usedIds = formData.items
                                .filter((_, idx) => idx !== i)
                                .map(it => String(it.item_id))
                                .filter(Boolean);

                            const availableItems = itemList.filter(it => !usedIds.includes(String(it.id)));

                            return (
                                <ItemRow
                                    key={i}
                                    item={item}
                                    index={i}
                                    itemList={availableItems}  // ✅ bukan itemList langsung
                                    conversions={conversions}
                                    errors={errors}
                                    onChange={handleItemChange}
                                    onRemove={removeItem}
                                    canRemove={formData.items.length > 1}
                                />
                            );
                        })}

                        {/* Tambah barang */}
                        {formData.items.length < itemList.length && (
                            <button onClick={addItem} style={{
                                width: "100%", padding: "11px", borderRadius: 11,
                                border: "1.5px dashed var(--border2)", background: "transparent",
                                color: "var(--text3)", fontSize: 13, fontWeight: 700,
                                cursor: "pointer", fontFamily: "inherit",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                marginBottom: 16,
                            }}>
                                <IconPlus /> Tambah Barang
                            </button>
                        )}


                        {/* Total */}
                        <div style={{
                            background: "var(--brown-900, #1C1008)", borderRadius: 14,
                            padding: "16px 18px", display: "flex",
                            justifyContent: "space-between", alignItems: "center",
                            marginBottom: 16,
                        }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>Total Pembelian</span>
                            <span style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>
                                Rp {total.toLocaleString("id")}
                            </span>
                        </div>

                        {/* Error API */}
                        {submitError && (
                            <div style={{ padding: "10px 14px", borderRadius: 10, background: "var(--redsoft)", color: "var(--red)", fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
                                {submitError}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || total === 0}
                            style={{
                                width: "100%", padding: "15px", borderRadius: 14, border: "none",
                                background: total === 0 ? "var(--bg3)" : "var(--orange)",
                                color: total === 0 ? "var(--text3)" : "#fff",
                                fontSize: 15, fontWeight: 900, cursor: submitting || total === 0 ? "not-allowed" : "pointer",
                                fontFamily: "inherit", opacity: submitting ? 0.7 : 1,
                                boxShadow: total > 0 ? "0 4px 14px rgba(212,80,10,0.30)" : "none",
                            }}
                        >
                            {submitting ? "Menyimpan..." : `Simpan Pembelian — Rp ${total.toLocaleString("id")}`}
                        </button>

                        <div style={{ height: 20 }} />
                    </>
                )}
            </div>
        </div>
    );
}
