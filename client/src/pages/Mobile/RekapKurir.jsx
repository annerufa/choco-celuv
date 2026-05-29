import { useState, useEffect } from "react";
import { useApi } from "../../hooks/useApi";
import { DetailPage } from "./PengirimanKurir";
// ── Icons ────────────────────────────────────────────────────────────────────
function IconFilter() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
    );
}
function IconCalendar() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    );
}
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
function IconCheck() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}
function IconWarn() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    );
}
function IconX() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
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
function toInputDate(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr).toISOString().slice(0, 10);
}

// Default range: 30 hari terakhir
function defaultRange() {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    return {
        from: toInputDate(from),
        to: toInputDate(to),
    };
}

// ── Status Chip ──────────────────────────────────────────────────────────────
function StatusChip({ status }) {
    const map = {
        sesuai: { bg: "var(--greensoft)", color: "var(--green)", label: "Sesuai" },
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

// ── Rekap Card ───────────────────────────────────────────────────────────────
function RekapCard({ dist, onClick }) {
    const isDiterima = dist.status === "sesuai";
    const iconBg = isDiterima ? "var(--greensoft)" : "var(--accentsoft)";
    const iconColor = isDiterima ? "var(--green)" : "var(--accent)";
    const Icon = isDiterima ? IconCheck : IconWarn;

    return (
        <div
            onClick={onClick}   // ← taruh di sini
            onTouchStart={e => e.currentTarget.style.borderColor = "var(--accent)"}
            onTouchEnd={e => e.currentTarget.style.borderColor = "var(--border)"}
            style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "var(--bg0)", borderRadius: 14,
                padding: "13px 14px", border: "1px solid var(--border)",
                boxShadow: "0 1px 4px rgba(100,70,20,0.06)",
            }}>
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
                        {dist.to_location_name ?? `Lokasi #${dist.to_location_id}`}
                    </span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                    {dist.arrived_at
                        ? formatJam(dist.arrived_at) + ", " + formatTgl(dist.arrived_at)
                        : formatTgl(dist.planned_date)}
                </div>
            </div>
            <div style={{ color: "var(--text3)", flexShrink: 0 }}><IconChevron /></div>
        </div>
    );
}

// ── Summary Bar ──────────────────────────────────────────────────────────────
function SummaryBar({ list }) {
    const total = list.length;
    const sesuai = list.filter(d => d.status === "diterima").length;
    const kurang = list.filter(d => d.status === "kurang").length;

    return (
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {[
                { label: "Total", val: total, bg: "var(--bg0)", color: "var(--text1)" },
                { label: "Sesuai", val: sesuai, bg: "var(--greensoft)", color: "var(--green)" },
                { label: "Kurang", val: kurang, bg: "var(--accentsoft)", color: "var(--accent)" },
            ].map(s => (
                <div key={s.label} style={{
                    flex: 1, background: s.bg, borderRadius: 12, padding: "10px 12px",
                    border: "1px solid var(--border)", textAlign: "center",
                    boxShadow: "0 1px 3px rgba(100,70,20,0.05)",
                }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 1 }}>{s.label}</div>
                </div>
            ))}
        </div>
    );
}


// ── Main Component ───────────────────────────────────────────────────────────
export default function RekapKurir() {
    const range = defaultRange();
    const [dateFrom, setDateFrom] = useState(range.from);
    const [dateTo, setDateTo] = useState(range.to);
    const [filterStatus, setFilterStatus] = useState("semua"); // semua | diterima | kurang
    const [showFilter, setShowFilter] = useState(false);
    const [selected, setSelected] = useState(null);

    // ✅ useApi dengan query params tanggal
    const {
        data,
        loading,
        error,
        fetchData: refetch,
    } = useApi(`/distribution/rekap?from=${dateFrom}&to=${dateTo}`);

    const list = Array.isArray(data) ? data : [];

    // Filter status di sisi client (data sudah difilter tanggal dari server)
    const filtered = filterStatus === "semua"
        ? list
        : list.filter(d => d.status === filterStatus);

    const hasActiveFilter = filterStatus !== "semua";

    function handleApplyFilter() {
        refetch();
        setShowFilter(false);
    }

    function handleResetFilter() {
        const r = defaultRange();
        setDateFrom(r.from);
        setDateTo(r.to);
        setFilterStatus("semua");
        setShowFilter(false);
    }
    // Kalau ada yang dipilih → tampil detail
    if (selected) {
        return (
            <DetailPage
                dist={selected}
                onBack={() => setSelected(null)}
                onPickupSuccess={() => { }}   // rekap tidak perlu refetch pickup
                onArriveSuccess={() => { }}   // rekap tidak perlu refetch arrive
            />
        );
    }

    return (
        <div className="page">
            {/* Header */}
            <div className="phead">
                <div className="phead-row">
                    <div>
                        <div className="ptitle">Rekap</div>
                        <div className="psub">Riwayat pengiriman selesai</div>
                    </div>
                    <button
                        onClick={() => setShowFilter(v => !v)}
                        style={{
                            display: "flex", alignItems: "center", gap: 5,
                            padding: "7px 12px", borderRadius: 10, border: "none",
                            background: showFilter || hasActiveFilter ? "var(--accent)" : "var(--accentsoft)",
                            color: showFilter || hasActiveFilter ? "#fff" : "var(--accent)",
                            fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                        }}
                    >
                        <IconFilter />
                        Filter {hasActiveFilter && "•"}
                    </button>
                </div>
            </div>

            <div className="pbody">
                {/* Filter Panel */}
                {showFilter && (
                    <div style={{
                        background: "var(--bg0)", borderRadius: 14, padding: "14px",
                        border: "1px solid var(--border)", marginBottom: 14,
                        boxShadow: "0 2px 8px rgba(100,70,20,0.08)",
                    }}>
                        {/* Tanggal */}
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                            Rentang Tanggal
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                            <div style={{ flex: 1, position: "relative" }}>
                                <div style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "var(--text3)", pointerEvents: "none" }}>
                                    <IconCalendar />
                                </div>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={e => setDateFrom(e.target.value)}
                                    style={{
                                        width: "100%", padding: "8px 8px 8px 28px",
                                        borderRadius: 9, border: "1px solid var(--border2)",
                                        background: "var(--bg1)", fontSize: 12, color: "var(--text1)",
                                        fontFamily: "inherit", outline: "none",
                                    }}
                                />
                            </div>
                            <span style={{ fontSize: 12, color: "var(--text3)", flexShrink: 0 }}>–</span>
                            <div style={{ flex: 1, position: "relative" }}>
                                <div style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "var(--text3)", pointerEvents: "none" }}>
                                    <IconCalendar />
                                </div>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={e => setDateTo(e.target.value)}
                                    style={{
                                        width: "100%", padding: "8px 8px 8px 28px",
                                        borderRadius: 9, border: "1px solid var(--border2)",
                                        background: "var(--bg1)", fontSize: 12, color: "var(--text1)",
                                        fontFamily: "inherit", outline: "none",
                                    }}
                                />
                            </div>
                        </div>

                        {/* Filter Status */}
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                            Status
                        </div>
                        <div style={{ display: "flex", gap: 7, marginBottom: 14 }}>
                            {[
                                { key: "semua", label: "Semua" },
                                { key: "sesuai", label: "Sesuai" },
                                { key: "kurang", label: "Kurang" },
                            ].map(s => (
                                <button
                                    key={s.key}
                                    onClick={() => setFilterStatus(s.key)}
                                    style={{
                                        padding: "6px 14px", borderRadius: 20, border: "1px solid var(--border2)",
                                        fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                                        background: filterStatus === s.key ? "var(--accent)" : "var(--bg1)",
                                        color: filterStatus === s.key ? "#fff" : "var(--text2)",
                                        transition: "all 0.15s",
                                    }}
                                >{s.label}</button>
                            ))}
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: 8 }}>
                            <button
                                onClick={handleResetFilter}
                                style={{
                                    flex: 1, padding: "9px", borderRadius: 10, border: "1px solid var(--border2)",
                                    background: "var(--bg1)", color: "var(--text2)", fontSize: 12, fontWeight: 700,
                                    cursor: "pointer", fontFamily: "inherit",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                                }}
                            >
                                <IconX /> Reset
                            </button>
                            <button
                                onClick={handleApplyFilter}
                                style={{
                                    flex: 2, padding: "9px", borderRadius: 10, border: "none",
                                    background: "var(--accent)", color: "#fff", fontSize: 12, fontWeight: 700,
                                    cursor: "pointer", fontFamily: "inherit",
                                }}
                            >
                                Terapkan
                            </button>
                        </div>
                    </div>
                )}

                {/* Active filter chips */}
                {!showFilter && (
                    <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                        <div style={{
                            display: "flex", alignItems: "center", gap: 4,
                            background: "var(--bg0)", border: "1px solid var(--border2)",
                            borderRadius: 20, padding: "4px 10px", fontSize: 11, color: "var(--text2)", fontWeight: 600,
                        }}>
                            <IconCalendar />
                            {formatTgl(dateFrom)} – {formatTgl(dateTo)}
                        </div>
                        {hasActiveFilter && (
                            <div style={{
                                display: "flex", alignItems: "center", gap: 4,
                                background: "var(--accentsoft)", border: "1px solid var(--border2)",
                                borderRadius: 20, padding: "4px 10px", fontSize: 11, color: "var(--accent)", fontWeight: 700,
                            }}>
                                {filterStatus === "diterima" ? "Sesuai" : "Kurang"}
                                <span onClick={() => setFilterStatus("semua")} style={{ cursor: "pointer", display: "flex" }}>
                                    <IconX />
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Summary */}
                {!loading && !error && list.length > 0 && (
                    <SummaryBar list={list} />
                )}

                {/* List */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text3)", fontSize: 13 }}>
                        Memuat data...
                    </div>
                ) : error ? (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "var(--red)", fontSize: 13 }}>
                        {error}
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text3)", fontSize: 13 }}>
                        <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
                        {list.length === 0
                            ? "Tidak ada pengiriman selesai di rentang ini"
                            : "Tidak ada pengiriman dengan filter ini"}
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {filtered.map(dist => (
                            <RekapCard key={dist.id} dist={dist} onClick={() => setSelected(dist)} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
