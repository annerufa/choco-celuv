// src/pages/Mobile/PengirimanKurir.jsx

import { useState, useEffect, useCallback } from "react";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

function getToken() { return localStorage.getItem("token"); }

function formatTgl(val) {
    if (!val) return "-";
    return new Date(val).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(val) {
    if (!val) return "-";
    return new Date(val).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ── Icons ─────────────────────────────────────────────────
function IconBox() {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 15, height: 15 }}>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>;
}

function IconTruck() {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 15, height: 15 }}>
        <rect x="1" y="3" width="15" height="13" rx="1" /><path d="M16 8h4l3 4v4h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
    </svg>;
}

function IconPin() {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 11, height: 11 }}>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>;
}

function IconBack() {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ width: 18, height: 18 }}>
        <polyline points="15 18 9 12 15 6" />
    </svg>;
}

function IconChevron() {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ width: 14, height: 14 }}>
        <polyline points="9 18 15 12 9 6" />
    </svg>;
}

// ── Status chip ───────────────────────────────────────────
const STATUS_CFG = {
    draft: { label: "Perlu Pickup", bg: "var(--accentsoft)", color: "var(--accent)" },
    dikirim: { label: "Dikirim", bg: "var(--bluesoft)", color: "var(--blue)" },
    diterima: { label: "Diterima", bg: "var(--greensoft)", color: "var(--green)" },
    dibatalkan: { label: "Dibatalkan", bg: "var(--redsoft)", color: "var(--red)" },
};

function StatusChip({ status }) {
    const cfg = STATUS_CFG[status] ?? { label: status, bg: "var(--bg2)", color: "var(--text2)" };
    return (
        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: cfg.bg, color: cfg.color, whiteSpace: "nowrap" }}>
            {cfg.label}
        </span>
    );
}

// ── Timeline ──────────────────────────────────────────────
const STEPS = [
    { key: "draft", label: "Dibuat" },
    { key: "dikirim", label: "Dikirim" },
    { key: "diterima", label: "Diterima" },
];
const STATUS_ORDER = { draft: 0, dikirim: 1, diterima: 2, dibatalkan: -1 };

function Timeline({ status }) {
    const current = STATUS_ORDER[status] ?? 0;
    const isCancelled = status === "dibatalkan";

    if (isCancelled) return (
        <div style={{ margin: "0 20px 16px", padding: "10px 14px", background: "var(--redsoft)", borderRadius: 10, display: "flex", alignItems: "center", gap: 8 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" width="14" height="14">
                <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--red)" }}>Distribusi ini dibatalkan</span>
        </div>
    );

    return (
        <div style={{ display: "flex", alignItems: "flex-start", padding: "16px 20px", gap: 0 }}>
            {STEPS.map((step, i) => {
                const done = current > i;
                const active = current === i;
                return (
                    <div key={step.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                        {/* line kiri */}
                        {i > 0 && (
                            <div style={{
                                position: "absolute", top: 13, right: "50%", left: "-50%",
                                height: 2, background: current >= i ? "var(--green)" : "var(--bg3)",
                            }} />
                        )}
                        {/* dot */}
                        <div style={{
                            width: 26, height: 26, borderRadius: "50%", zIndex: 1,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: done ? "var(--green)" : active ? "var(--bg0)" : "var(--bg2)",
                            border: done ? "2px solid var(--green)" : active ? "2px solid var(--accent)" : "2px solid var(--bg4)",
                            boxShadow: active ? "0 0 0 4px var(--accentsoft)" : "none",
                        }}>
                            {done ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" width="11" height="11">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            ) : (
                                <div style={{ width: 7, height: 7, borderRadius: "50%", background: active ? "var(--accent)" : "var(--bg4)" }} />
                            )}
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: done || active ? "var(--text1)" : "var(--text3)", marginTop: 6, textAlign: "center" }}>
                            {step.label}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── Info row ──────────────────────────────────────────────
function InfoRow({ label, value }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: 12, color: "var(--text3)" }}>{label}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text1)", textAlign: "right", maxWidth: "55%" }}>{value}</span>
        </div>
    );
}

// ── Detail Page ───────────────────────────────────────────
function DetailPage({ dist: initialDist, onBack, onPickupSuccess }) {
    const [dist, setDist] = useState(initialDist);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pickupLoading, setPickupLoading] = useState(false);

    useEffect(() => {
        async function fetchDetail() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${BASE_URL}/distribution/${initialDist.id}`, {
                    headers: { Authorization: `Bearer ${getToken()}` },
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json.payload?.message ?? "Gagal memuat detail");
                const data = json.payload?.data ?? json.data ?? json;
                setDist(data);
                setItems(Array.isArray(data.items) ? data.items : []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchDetail();
    }, [initialDist.id]);

    async function handlePickup() {
        setPickupLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/distribution/${dist.id}/pickup`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.payload?.message ?? "Gagal konfirmasi pickup");
            setConfirmOpen(false);
            onPickupSuccess();
            onBack();
        } catch (err) {
            alert(err.message);
        } finally {
            setPickupLoading(false);
        }
    }

    return (
        <div className="page" style={{ animation: "slideInRight 0.22s ease" }}>
            <style>{`@keyframes slideInRight { from { transform: translateX(18px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>

            {/* Header */}
            <div className="phead">
                <div className="phead-row">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 9, padding: "6px 8px", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center" }}>
                            <IconBack />
                        </button>
                        <div>
                            <div className="ptitle">Detail Pengiriman</div>
                            <div className="psub">#{String(dist.id).padStart(4, "0")}</div>
                        </div>
                    </div>
                    <StatusChip status={dist.status} />
                </div>
            </div>

            <div className="pbody" style={{ padding: 0 }}>
                {loading ? (
                    <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--text3)", fontSize: 13 }}>Memuat detail...</div>
                ) : error ? (
                    <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--red)", fontSize: 13 }}>{error}</div>
                ) : (
                    <>
                        {/* Timeline */}
                        <div style={{ background: "var(--bg0)", margin: "16px 16px 0", borderRadius: 14, border: "1px solid var(--border)" }}>
                            <div style={{ padding: "12px 20px 0", fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                Status Pengiriman
                            </div>
                            <Timeline status={dist.status} />
                        </div>

                        {/* Info distribusi */}
                        <div style={{ background: "var(--bg0)", margin: "12px 16px 0", borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden" }}>
                            <div style={{ padding: "12px 20px", fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid var(--border)" }}>
                                Informasi
                            </div>
                            <InfoRow label="Asal" value={dist.from_location_name ?? "-"} />
                            <InfoRow label="Tujuan" value={dist.to_location_name ?? "-"} />
                            <InfoRow label="Tanggal" value={formatTgl(dist.planned_date)} />
                            <InfoRow label="Dibuat oleh" value={dist.created_by_name ?? "-"} />
                            {dist.notes && <InfoRow label="Catatan" value={dist.notes} />}
                            {dist.confirmed_at_kurir && <InfoRow label="Waktu Pickup" value={formatDateTime(dist.confirmed_at_kurir)} />}
                            {dist.confirmed_at_booth && <InfoRow label="Waktu Terima" value={formatDateTime(dist.confirmed_at_booth)} />}
                        </div>

                        {/* Daftar barang */}
                        <div style={{ margin: "12px 16px 0" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8, paddingLeft: 4 }}>
                                Daftar Barang ({items.length})
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {items.length === 0 ? (
                                    <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text3)", fontSize: 13 }}>Tidak ada barang</div>
                                ) : items.map((it, i) => (
                                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--bg0)", borderRadius: 12, padding: "12px 14px", border: "1px solid var(--border)" }}>
                                        <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--accentsoft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", flexShrink: 0 }}>
                                            <IconBox />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text1)" }}>{it.item_name ?? `Item #${it.item_id}`}</div>
                                            {it.notes && <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 1 }}>{it.notes}</div>}
                                        </div>
                                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                                            <div style={{ fontSize: 16, fontWeight: 900, color: "var(--text1)" }}>{Number(it.qty).toLocaleString("id")}</div>
                                            <div style={{ fontSize: 10, color: "var(--text3)" }}>{it.unit ?? ""}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tombol Pickup — hanya kalau draft */}
                        {dist.status === "draft" && (
                            <div style={{ padding: "20px 16px" }}>
                                {!confirmOpen ? (
                                    <button onClick={() => setConfirmOpen(true)} style={{
                                        width: "100%", padding: 15, borderRadius: 15, border: "none",
                                        background: "var(--orange)", color: "#fff", fontSize: 15, fontWeight: 900,
                                        cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(212,80,10,0.30)",
                                    }}>
                                        Konfirmasi Pickup
                                    </button>
                                ) : (
                                    <div style={{ background: "var(--bg0)", borderRadius: 16, border: "1px solid var(--border2)", padding: 16 }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text1)", marginBottom: 6, textAlign: "center" }}>
                                            Yakin sudah ambil semua barang?
                                        </div>
                                        <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 16, textAlign: "center", lineHeight: 1.6 }}>
                                            Stok gudang akan berkurang dan status berubah jadi <strong>Dikirim</strong>
                                        </div>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <button onClick={() => setConfirmOpen(false)} disabled={pickupLoading} style={{
                                                flex: 1, padding: 12, borderRadius: 12,
                                                border: "1px solid var(--border2)", background: "var(--bg2)",
                                                color: "var(--text1)", fontSize: 13, fontWeight: 700,
                                                cursor: "pointer", fontFamily: "inherit",
                                            }}>
                                                Batal
                                            </button>
                                            <button onClick={handlePickup} disabled={pickupLoading} style={{
                                                flex: 2, padding: 12, borderRadius: 12, border: "none",
                                                background: "var(--orange)", color: "#fff", fontSize: 13, fontWeight: 900,
                                                cursor: pickupLoading ? "not-allowed" : "pointer",
                                                fontFamily: "inherit", opacity: pickupLoading ? 0.6 : 1,
                                            }}>
                                                {pickupLoading ? "Memproses..." : "Ya, Pickup Sekarang"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div style={{ height: 16 }} />
                    </>
                )}
            </div>
        </div>
    );
}

// ── Dist Card ─────────────────────────────────────────────
function DistCard({ dist, onClick }) {
    return (
        <div onClick={onClick} style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "var(--bg0)", borderRadius: 14,
            padding: "13px 14px", border: "1px solid var(--border)",
            boxShadow: "0 1px 4px rgba(100,70,20,0.06)",
            cursor: "pointer",
        }}
            onTouchStart={e => e.currentTarget.style.borderColor = "var(--accent)"}
            onTouchEnd={e => e.currentTarget.style.borderColor = "var(--border)"}
        >
            <div style={{
                width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                background: dist.status === "draft" ? "var(--accentsoft)" : "var(--bluesoft)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: dist.status === "draft" ? "var(--accent)" : "var(--blue)",
            }}>
                {dist.status === "draft" ? <IconBox /> : <IconTruck />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text1)" }}>#{String(dist.id).padStart(4, "0")}</span>
                    <StatusChip status={dist.status} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ color: "var(--text3)", display: "flex", flexShrink: 0 }}><IconPin /></span>
                    <span style={{ fontSize: 12, color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {dist.to_location_name ?? `Lokasi #${dist.to_location_id}`}
                    </span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{formatTgl(dist.planned_date)}</div>
            </div>
            <div style={{ color: "var(--text3)", flexShrink: 0 }}><IconChevron /></div>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────
export default function PengirimanKurir() {
    const [tab, setTab] = useState("draft");
    const [draftList, setDraftList] = useState([]);
    const [dikirimList, setDikirimList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selected, setSelected] = useState(null); // kalau ada → tampil DetailPage

    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const headers = { Authorization: `Bearer ${getToken()}` };
            const [resDraft, resDikirim] = await Promise.all([
                fetch(`${BASE_URL}/distribution/my?status=draft`, { headers }),
                fetch(`${BASE_URL}/distribution/my?status=dikirim`, { headers }),
            ]);
            const [jDraft, jDikirim] = await Promise.all([resDraft.json(), resDikirim.json()]);
            setDraftList(Array.isArray(jDraft.payload?.data) ? jDraft.payload.data : (Array.isArray(jDraft) ? jDraft : []));
            setDikirimList(Array.isArray(jDikirim.payload?.data) ? jDikirim.payload.data : (Array.isArray(jDikirim) ? jDikirim : []));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // Kalau ada yang dipilih → tampil detail
    if (selected) {
        return (
            <DetailPage
                dist={selected}
                onBack={() => setSelected(null)}
                onPickupSuccess={fetchAll}
            />
        );
    }

    const activeList = tab === "draft" ? draftList : dikirimList;

    return (
        <div className="page">
            {/* Header */}
            <div className="phead">
                <div className="phead-row">
                    <div>
                        <div className="ptitle">Pengiriman</div>
                        <div className="psub">Distribusi yang ditugaskan ke kamu</div>
                    </div>
                    <div style={{ background: "var(--orange)", color: "#fff", borderRadius: 10, padding: "4px 10px", fontSize: 12, fontWeight: 800 }}>
                        {draftList.length + dikirimList.length} total
                    </div>
                </div>
            </div>

            <div className="pbody">
                {/* Summary */}
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                    <div style={{ flex: 1, background: "var(--accentsoft)", borderRadius: 14, padding: "12px 14px", border: "1px solid rgba(196,123,16,0.15)" }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "var(--accent)" }}>{draftList.length}</div>
                        <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>Perlu Pickup</div>
                    </div>
                    <div style={{ flex: 1, background: "var(--bluesoft)", borderRadius: 14, padding: "12px 14px", border: "1px solid rgba(37,99,168,0.15)" }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "var(--blue)" }}>{dikirimList.length}</div>
                        <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>Sedang Dikirim</div>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: "flex", background: "var(--bg2)", borderRadius: 12, padding: 4, marginBottom: 14 }}>
                    {[
                        { key: "draft", label: `Perlu Pickup (${draftList.length})` },
                        { key: "dikirim", label: `Berlangsung (${dikirimList.length})` },
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
                    <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text3)", fontSize: 13 }}>Memuat data pengiriman...</div>
                ) : error ? (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "var(--red)", fontSize: 13 }}>{error}</div>
                ) : activeList.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text3)", fontSize: 13 }}>
                        <div style={{ fontSize: 32, marginBottom: 10 }}>{tab === "draft" ? "📦" : "🚚"}</div>
                        {tab === "draft" ? "Tidak ada pengiriman yang perlu di-pickup" : "Tidak ada pengiriman yang sedang berlangsung"}
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