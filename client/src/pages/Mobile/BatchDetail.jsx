import { useApi } from "../../hooks/useApi";

function IconBack() {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>;
}

const STATUS_COLOR = {
    ACTIVE: { bg: "#e6f9ee", color: "#1a9449" },
    FROZEN: { bg: "#e8f0fe", color: "#3b6fd4" },
    SOLD_OUT: { bg: "#f0f0f0", color: "#888" },
    EXPIRED: { bg: "#fff0e0", color: "#c97a00" },
    DAMAGED: { bg: "#fdecea", color: "#c0392b" },
};

export default function BatchDetail({ setPage, batchId }) {
    const { data: result, loading, error } = useApi(`/batches/${batchId}`);
    console.log('batch result:', result); // ← tambah ini
    const batch = Array.isArray(result) ? null : result;

    // const batch = result ?? null;
    if (loading || !batch) return (
        <div className="page">
            <div style={{ textAlign: "center", color: "var(--text3)", fontSize: 13, marginTop: 80 }}>
                Memuat detail batch...
            </div>
        </div>
    );
    if (error) return (
        <div className="page">
            <div style={{ textAlign: "center", color: "var(--red)", fontSize: 13, marginTop: 80 }}>
                Gagal memuat data batch.
            </div>
        </div>
    );

    if (loading) return (
        <div className="page">
            <div style={{ textAlign: "center", color: "var(--text3)", fontSize: 13, marginTop: 80 }}>
                Memuat detail batch...
            </div>
        </div>
    );

    if (error || !batch) return (
        <div className="page">
            <div style={{ textAlign: "center", color: "var(--red)", fontSize: 13, marginTop: 80 }}>
                Gagal memuat data batch.
            </div>
        </div>
    );

    const sc = STATUS_COLOR[batch.status] ?? { bg: "#f0f0f0", color: "#888" };

    return (
        <div className="page">
            {/* HEADER */}
            <div className="phead">
                <div className="phead-row">
                    <button onClick={() => setPage("adonan")} className="btnBack">
                        <IconBack />
                    </button>
                    <div style={{ flex: 1 }}>
                        <div className="ptitle">Batch #{batch.id}</div>
                        <div className="psub">{batch.recipe_name}</div>
                    </div>
                    <span style={{
                        fontSize: 11, fontWeight: 700,
                        padding: "4px 10px", borderRadius: 20,
                        background: sc.bg, color: sc.color,
                    }}>
                        {batch.status}
                    </span>
                </div>
            </div>

            <div className="pbody" style={{ paddingBottom: 100 }}>

                {/* INFO BATCH */}
                <div style={cardStyle}>
                    <div style={sectionTitle}>Info Batch</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                        <Row label="Dibuat oleh" value={batch.created_by_name ?? "-"} />
                        <Row label="Booth" value={batch.booth_name} />
                        <Row label="Diproduksi" value={fmtDateTime(batch.produced_at)} />
                        <Row label="Kadaluarsa" value={batch.expired_at ? fmtDateTime(batch.expired_at) : "—"} />
                        <Row label="Total qty" value={`${batch.total_qty} ${batch.output_unit}`} />
                        <Row label="Sisa" value={`${batch.remaining_qty} ${batch.output_unit}`} />
                        {batch.notes && <Row label="Catatan" value={batch.notes} />}
                    </div>
                </div>

                {/* SUMMARY */}
                <div style={{ display: "flex", gap: 8, margin: "0 0 12px" }}>
                    <SummaryCard label="Terjual" value={`${batch.summary.total_terjual} ${batch.output_unit}`} color="var(--accent)" />
                    <SummaryCard label="Transaksi" value={batch.summary.total_transaksi} color="#3b6fd4" />
                    <SummaryCard label="Pendapatan" value={`Rp ${Number(batch.summary.total_pendapatan).toLocaleString("id-ID")}`} color="#1a9449" />
                </div>

                {/* RIWAYAT */}
                <div style={cardStyle}>
                    <div style={sectionTitle}>Riwayat Penjualan</div>
                    {batch.riwayat.length === 0 && (
                        <div style={{ textAlign: "center", color: "var(--text3)", fontSize: 12, marginTop: 16, paddingBottom: 8 }}>
                            Belum ada penjualan dari batch ini.
                        </div>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                        {batch.riwayat.map(s => (
                            <div key={s.sale_id} style={{
                                background: "var(--bg1)",
                                borderRadius: 10, padding: "10px 12px",
                                border: "1px solid var(--border)",
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text1)" }}>
                                        #{s.sale_id} · {s.payment_method === "tunai" ? "💵 Tunai" : "📱 QRIS"}
                                    </div>
                                    <div style={{ fontSize: 11, color: "var(--text3)" }}>
                                        {fmtTime(s.created_at)}
                                    </div>
                                </div>
                                <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
                                    Adonan: -{s.adonan_terpakai} {batch.output_unit} · {s.kasir}
                                </div>
                                {/* Item list */}
                                <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 2 }}>
                                    {(typeof s.items === 'string' ? JSON.parse(s.items) : s.items).map((item, i) => (
                                        <div key={i} style={{ fontSize: 11, color: "var(--text2)", display: "flex", justifyContent: "space-between" }}>
                                            <span>{item.product} ({item.size}) ×{item.qty}</span>
                                            <span>Rp {Number(item.total_price).toLocaleString("id-ID")}</span>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: "var(--accent)", textAlign: "right" }}>
                                    Rp {Number(s.grand_total).toLocaleString("id-ID")}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Helper components ────────────────────────────────────────
function Row({ label, value }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span style={{ color: "var(--text3)" }}>{label}</span>
            <span style={{ color: "var(--text1)", fontWeight: 600, textAlign: "right", maxWidth: "60%" }}>{value}</span>
        </div>
    );
}

function SummaryCard({ label, value, color }) {
    return (
        <div style={{
            flex: 1, background: "var(--bg0)", borderRadius: 12,
            border: "1px solid var(--border)", padding: "10px 8px",
            textAlign: "center",
        }}>
            <div style={{ fontSize: 13, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>{label}</div>
        </div>
    );
}

// ─── Helpers ──────────────────────────────────────────────────
function fmtDateTime(str) {
    return new Date(str).toLocaleString("id-ID", {
        day: "numeric", month: "short",
        hour: "2-digit", minute: "2-digit"
    });
}
function fmtTime(str) {
    return new Date(str).toLocaleString("id-ID", {
        day: "numeric", month: "short",
        hour: "2-digit", minute: "2-digit"
    });
}

const cardStyle = {
    background: "var(--bg0)", borderRadius: 16,
    border: "1px solid var(--border)", padding: "14px 16px",
    marginBottom: 12,
};
const sectionTitle = {
    fontSize: 13, fontWeight: 800, color: "var(--text1)",
};