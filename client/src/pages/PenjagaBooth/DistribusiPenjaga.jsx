import { useState, useEffect } from "react";
import { useApi } from "../../hooks/useApi";
import axios from "axios";
import { IconCheck, IconWarn, IconTruck } from "./Icons";

const API_BASE_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'}`;

// ── axios helper untuk PUT (token sudah di-inject interceptor useApi) ────────
async function apiPut(path, data) {
    const res = await axios.put(`${API_BASE_URL}${path}`, data);
    return res.data?.payload?.data;
}

// ── Icons lokal ──────────────────────────────────────────────────────────────
function IconPin() {
    return (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
        </svg>
    );
}
function IconChevron() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
        </svg>
    );
}
function IconBack() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
        </svg>
    );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatTgl(dateStr) {
    if (!dateStr) return "–";
    return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}
function formatJam(dateStr) {
    if (!dateStr) return "–";
    return new Date(dateStr).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

// ── Status Chip ──────────────────────────────────────────────────────────────
function StatusChip({ status }) {
    const map = {
        sampai: { bg: "var(--bluesoft)", color: "var(--blue)", label: "Sampai" },
        diterima: { bg: "var(--greensoft)", color: "var(--green)", label: "Diterima" },
        kurang: { bg: "var(--accentsoft)", color: "var(--accent)", label: "Kurang" },
    };
    const s = map[status] ?? { bg: "var(--bg2)", color: "var(--text3)", label: status };
    return (
        <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 8px",
            borderRadius: 20, background: s.bg, color: s.color,
        }}>{s.label}</span>
    );
}

// ── Dist Card (list) ─────────────────────────────────────────────────────────
function DistCard({ dist, onClick }) {
    const isDiterima = dist.status === "diterima";
    const isKurang = dist.status === "kurang";
    const iconBg = isDiterima ? "var(--greensoft)" : isKurang ? "var(--accentsoft)" : "var(--bluesoft)";
    const iconColor = isDiterima ? "var(--green)" : isKurang ? "var(--accent)" : "var(--blue)";
    const Icon = isDiterima ? IconCheck : isKurang ? IconWarn : IconTruck;

    return (
        <div
            onClick={onClick}
            style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "var(--bg0)", borderRadius: 14,
                padding: "13px 14px", border: "1px solid var(--border)",
                boxShadow: "0 1px 4px rgba(100,70,20,0.06)", cursor: "pointer",
            }}
            onTouchStart={e => e.currentTarget.style.borderColor = "var(--accent)"}
            onTouchEnd={e => e.currentTarget.style.borderColor = "var(--border)"}
        >
            <div style={{
                width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                background: iconBg, display: "flex", alignItems: "center",
                justifyContent: "center", color: iconColor,
            }}>
                <Icon />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text1)" }}>
                        #{String(dist.id).padStart(4, "0")}
                    </span>
                    <StatusChip status={dist.status} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ color: "var(--text3)", display: "flex", flexShrink: 0 }}><IconPin /></span>
                    <span style={{ fontSize: 12, color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        dari {dist.from_location_name ?? `Lokasi #${dist.from_location_id}`}
                    </span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                    Tiba: {dist.arrived_at ? formatJam(dist.arrived_at) + ", " + formatTgl(dist.arrived_at) : formatTgl(dist.planned_date)}
                </div>
            </div>
            <div style={{ color: "var(--text3)", flexShrink: 0 }}><IconChevron /></div>
        </div>
    );
}

// ── Item Row (form konfirmasi) ────────────────────────────────────────────────
function ItemRow({ item, value, onChange }) {
    const isSesuai = value.sesuai && value.qty_diterima >= item.qty;

    return (
        <div style={{
            background: "var(--bg0)", borderRadius: 13, padding: "13px 14px",
            border: `1.5px solid ${isSesuai ? "var(--green)" : !value.sesuai ? "var(--accent)" : "var(--border)"}`,
            transition: "border-color 0.2s",
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Checkbox */}
                <div
                    onClick={() => onChange({
                        ...value,
                        sesuai: !value.sesuai,
                        qty_diterima: !value.sesuai ? item.qty : value.qty_diterima,
                    })}
                    style={{
                        width: 22, height: 22, borderRadius: 7, flexShrink: 0, cursor: "pointer",
                        background: value.sesuai ? "var(--green)" : "var(--bg2)",
                        border: `2px solid ${value.sesuai ? "var(--green)" : "var(--border2)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.15s",
                    }}
                >
                    {value.sesuai && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text1)" }}>
                        {item.item_name ?? `Item #${item.item_id}`}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 1 }}>
                        Dikirim: <strong style={{ color: "var(--text2)" }}>{item.qty}</strong> {item.unit ?? "pcs"}
                    </div>
                </div>

                {/* Qty badge */}
                <div style={{
                    fontSize: 13, fontWeight: 800,
                    color: isSesuai ? "var(--green)" : "var(--accent)",
                    background: isSesuai ? "var(--greensoft)" : "var(--accentsoft)",
                    padding: "4px 10px", borderRadius: 8,
                }}>
                    {value.qty_diterima ?? item.qty}
                </div>
            </div>

            {/* Expanded saat tidak sesuai */}
            {!value.sesuai && (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, color: "var(--text2)", flexShrink: 0 }}>Qty diterima:</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
                            <button
                                onClick={() => onChange({ ...value, qty_diterima: Math.max(0, (value.qty_diterima ?? item.qty) - 1) })}
                                style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--border2)", background: "var(--bg1)", color: "var(--text1)", fontSize: 16, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >−</button>
                            <input
                                type="number"
                                value={value.qty_diterima ?? item.qty}
                                onChange={e => onChange({ ...value, qty_diterima: Number(e.target.value) })}
                                style={{ width: 52, textAlign: "center", border: "1px solid var(--border2)", borderRadius: 8, padding: "4px 6px", fontSize: 14, fontWeight: 700, fontFamily: "inherit", color: "var(--text1)", background: "var(--bg1)", outline: "none" }}
                            />
                            <button
                                onClick={() => onChange({ ...value, qty_diterima: Math.min(item.qty, (value.qty_diterima ?? item.qty) + 1) })}
                                style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--border2)", background: "var(--bg1)", color: "var(--text1)", fontSize: 16, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >+</button>
                        </div>
                    </div>
                    <input
                        placeholder="Catatan (opsional)..."
                        value={value.notes ?? ""}
                        onChange={e => onChange({ ...value, notes: e.target.value })}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: 9, border: "1px solid var(--border2)", background: "var(--bg1)", fontSize: 12, color: "var(--text1)", fontFamily: "inherit", outline: "none" }}
                    />
                </div>
            )}
        </div>
    );
}

// ── Detail / Konfirmasi Screen ───────────────────────────────────────────────
function DetailScreen({ dist, onBack, onSuccess }) {
    const [itemVals, setItemVals] = useState({});
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);

    const isFinished = dist.status === "diterima" || dist.status === "kurang";

    // ✅ useApi untuk fetch items — token otomatis dari interceptor
    const {
        data: items,
        loading,
        error,
        fetchData: refetchItems,
    } = useApi(`/distribution/${dist.id}/items`);

    // Init itemVals saat items berhasil di-fetch
    useEffect(() => {
        if (!items?.length) return;
        const init = {};
        items.forEach(it => {
            init[it.item_id] = {
                sesuai: it.qty_diterima === null ? true : Number(it.qty_diterima) >= Number(it.qty),
                qty_diterima: it.qty_diterima !== null ? Number(it.qty_diterima) : Number(it.qty),
                notes: it.notes ?? "",
            };
        });
        setItemVals(init);
    }, [items]);

    const allSesuai = items?.every(it => {
        const v = itemVals[it.item_id];
        return v?.sesuai && v?.qty_diterima >= Number(it.qty);
    }) ?? true;

    async function handleKonfirmasi() {
        setSaving(true);
        setSaveError(null);
        try {
            const adaKurang = items.some(it => {
                const v = itemVals[it.item_id];
                return !v.sesuai || v.qty_diterima < Number(it.qty);
            });
            const newStatus = adaKurang ? "kurang" : "diterima";

            // ✅ PUT tiap item pakai axios (token sudah di-inject interceptor)
            await Promise.all(items.map(it => {
                const v = itemVals[it.item_id];
                return apiPut(`/distribution/${dist.id}/items/${it.item_id}`, {
                    qty_diterima: v.sesuai ? Number(it.qty) : v.qty_diterima,
                    notes: v.notes || null,
                });
            }));

            // ✅ PUT status distribusi
            await apiPut(`/distribution/${dist.id}/status`, {
                status: newStatus,
            });

            onSuccess();
        } catch (err) {
            setSaveError(err.response?.data?.payload?.message ?? "Gagal menyimpan. Coba lagi.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="page">
            {/* Header */}
            <div className="phead">
                <div className="phead-row">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div onClick={onBack} style={{ cursor: "pointer", color: "var(--bg3)", display: "flex" }}>
                            <IconBack />
                        </div>
                        <div>
                            <div className="ptitle">Pengiriman #{String(dist.id).padStart(4, "0")}</div>
                            <div className="psub">dari {dist.from_location_name ?? `Lokasi #${dist.from_location_id}`}</div>
                        </div>
                    </div>
                    <StatusChip status={dist.status} />
                </div>
            </div>

            <div className="pbody" style={{ paddingBottom: 100 }}>
                {/* Info card */}
                <div style={{
                    background: "var(--bg0)", borderRadius: 14, padding: "14px",
                    border: "1px solid var(--border)", marginBottom: 16,
                    boxShadow: "0 1px 4px rgba(100,70,20,0.06)",
                }}>
                    <div style={{ display: "flex", gap: 16 }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 10, color: "var(--text3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Kurir</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text1)", marginTop: 2 }}>{dist.kurir_name ?? "–"}</div>
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 10, color: "var(--text3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Tiba</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text1)", marginTop: 2 }}>{formatJam(dist.arrived_at)}</div>
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 10, color: "var(--text3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Tanggal</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text1)", marginTop: 2 }}>{formatTgl(dist.arrived_at ?? dist.planned_date)}</div>
                        </div>
                    </div>
                    {dist.notes && (
                        <div style={{ marginTop: 12, padding: "8px 10px", borderRadius: 8, background: "var(--accentsoft)", fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>
                            📝 {dist.notes}
                        </div>
                    )}
                </div>

                <div className="sec-title" style={{ marginBottom: 10 }}>
                    {isFinished ? "Detail Item" : "Konfirmasi Item"}
                </div>

                {loading ? (
                    <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text3)", fontSize: 13 }}>Memuat item...</div>
                ) : error ? (
                    <div style={{ textAlign: "center", padding: "20px 0", color: "var(--red)", fontSize: 13 }}>{error}</div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {items?.map(it => (
                            isFinished ? (
                                // Read-only
                                <div key={it.item_id} style={{ background: "var(--bg0)", borderRadius: 13, padding: "13px 14px", border: "1px solid var(--border)" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <div style={{
                                            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                                            background: Number(it.qty_diterima) >= Number(it.qty) ? "var(--greensoft)" : "var(--accentsoft)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            color: Number(it.qty_diterima) >= Number(it.qty) ? "var(--green)" : "var(--accent)",
                                        }}>
                                            {Number(it.qty_diterima) >= Number(it.qty) ? <IconCheck /> : <IconWarn />}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text1)" }}>{it.item_name ?? `Item #${it.item_id}`}</div>
                                            {it.notes && <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 2 }}>{it.notes}</div>}
                                        </div>
                                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                                            <div style={{ fontSize: 14, fontWeight: 800, color: Number(it.qty_diterima) >= Number(it.qty) ? "var(--green)" : "var(--accent)" }}>
                                                {it.qty_diterima ?? it.qty}
                                            </div>
                                            <div style={{ fontSize: 10, color: "var(--text3)" }}>/ {it.qty} {it.unit ?? "pcs"}</div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <ItemRow
                                    key={it.item_id}
                                    item={it}
                                    value={itemVals[it.item_id] ?? { sesuai: true, qty_diterima: Number(it.qty), notes: "" }}
                                    onChange={v => setItemVals(prev => ({ ...prev, [it.item_id]: v }))}
                                />
                            )
                        ))}
                    </div>
                )}

                {saveError && (
                    <div style={{ marginTop: 12, fontSize: 12, color: "var(--red)", textAlign: "center" }}>{saveError}</div>
                )}
            </div>

            {/* Tombol konfirmasi */}
            {!isFinished && !loading && (
                <div style={{
                    position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
                    width: "100%", maxWidth: 380,
                    padding: "12px 20px calc(12px + env(safe-area-inset-bottom))",
                    background: "var(--bg1)", borderTop: "1px solid var(--border)",
                }}>
                    {!allSesuai && (
                        <div style={{
                            display: "flex", alignItems: "center", gap: 6, marginBottom: 10,
                            padding: "8px 12px", borderRadius: 10,
                            background: "var(--accentsoft)", color: "var(--accent)", fontSize: 12, fontWeight: 600,
                        }}>
                            <IconWarn />
                            Ada item yang kurang — status akan jadi "Kurang"
                        </div>
                    )}
                    <button
                        onClick={handleKonfirmasi}
                        disabled={saving}
                        style={{
                            width: "100%", padding: 15, borderRadius: 15, border: "none",
                            background: allSesuai ? "var(--green)" : "var(--accent)",
                            color: "#fff", fontSize: 15, fontWeight: 900,
                            cursor: saving ? "not-allowed" : "pointer",
                            fontFamily: "inherit", opacity: saving ? 0.7 : 1,
                            boxShadow: allSesuai ? "0 4px 14px rgba(46,138,86,0.25)" : "0 4px 14px rgba(196,123,16,0.25)",
                            transition: "all 0.2s",
                        }}
                    >
                        {saving ? "Menyimpan..." : allSesuai ? "✓ Terima Semua" : "⚠ Terima dengan Catatan"}
                    </button>
                </div>
            )}
        </div>
    );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function DistribusiPenjaga() {
    const [tab, setTab] = useState("sampai");
    const [selected, setSelected] = useState(null);

    // ✅ useApi — token otomatis, refetch manual dengan fetchData()
    const {
        data,
        loading,
        error,
        fetchData: refetch,
    } = useApi("/distribution/booth");

    const list = Array.isArray(data) ? data : [];

    const sampaiList = list.filter(d => d.status === "sampai");
    const diterimaList = list.filter(d => d.status === "diterima");
    const kurangList = list.filter(d => d.status === "kurang");

    const activeList =
        tab === "sampai" ? sampaiList :
            tab === "diterima" ? diterimaList :
                kurangList;

    const emptyIcon = tab === "sampai" ? "🚚" : tab === "diterima" ? "✅" : "⚠️";
    const emptyText = tab === "sampai"
        ? "Tidak ada pengiriman yang menunggu konfirmasi"
        : tab === "diterima"
            ? "Belum ada pengiriman yang diterima"
            : "Tidak ada pengiriman dengan catatan kurang";

    if (selected) {
        return (
            <DetailScreen
                dist={selected}
                onBack={() => setSelected(null)}
                onSuccess={() => { setSelected(null); refetch(); }}
            />
        );
    }

    return (
        <div className="page">
            {/* Header */}
            <div className="phead">
                <div className="phead-row">
                    <div>
                        <div className="ptitle">Penerimaan</div>
                        <div className="psub">Konfirmasi barang masuk</div>
                    </div>
                    {sampaiList.length > 0 && (
                        <div style={{
                            background: "var(--bluesoft)", color: "var(--blue)",
                            fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 20,
                        }}>
                            {sampaiList.length} menunggu
                        </div>
                    )}
                </div>
            </div>

            <div className="pbody">
                {/* Tabs */}
                <div style={{ display: "flex", background: "var(--bg2)", borderRadius: 12, padding: 4, marginBottom: 14 }}>
                    {[
                        { key: "sampai", label: `Menunggu (${sampaiList.length})` },
                        { key: "diterima", label: `Diterima (${diterimaList.length})` },
                        { key: "kurang", label: `Kurang (${kurangList.length})` },
                    ].map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)} style={{
                            flex: 1, padding: "9px 6px", borderRadius: 9, border: "none",
                            cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700,
                            transition: "all 0.15s",
                            background: tab === t.key ? "var(--bg0)" : "transparent",
                            color: tab === t.key ? "var(--text1)" : "var(--text3)",
                            boxShadow: tab === t.key ? "0 1px 4px rgba(100,70,20,0.10)" : "none",
                        }}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* List */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text3)", fontSize: 13 }}>Memuat data...</div>
                ) : error ? (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "var(--red)", fontSize: 13 }}>{error}</div>
                ) : activeList.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text3)", fontSize: 13 }}>
                        <div style={{ fontSize: 32, marginBottom: 10 }}>{emptyIcon}</div>
                        {emptyText}
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {activeList.map(dist => (
                            <DistCard key={dist.id} dist={dist} onClick={() => setSelected(dist)} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}