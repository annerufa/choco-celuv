import { useState, useEffect } from "react";
import { useApi } from "../../hooks/useApi";
import axios from 'axios';

const STATUS_OPTIONS = [
    { value: "", label: "Semua" },
    { value: "ACTIVE", label: "Aktif" },
    { value: "FROZEN", label: "Beku" },
    { value: "SOLD_OUT", label: "Habis" },
    { value: "EXPIRED", label: "Expired" },
    { value: "DAMAGED", label: "Rusak" },
];

const STATUS_COLOR = {
    ACTIVE: { bg: "#e6f9ee", color: "#1a9449" },
    FROZEN: { bg: "#e8f0fe", color: "#3b6fd4" },
    SOLD_OUT: { bg: "#f0f0f0", color: "#888" },
    EXPIRED: { bg: "#fff0e0", color: "#c97a00" },
    DAMAGED: { bg: "#fdecea", color: "#c0392b" },
};

function toDateStr(date) {
    return date.toISOString().slice(0, 10);
}

function IconBack() {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>;
}
function IconPlus() {
    return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
}
function IconFlask() {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 3h6M9 3v7.6L4.5 18a2 2 0 0 0 1.8 2.8h11.4a2 2 0 0 0 1.8-2.8L15 10.6V3" /><line x1="6.5" y1="14" x2="17.5" y2="14" /></svg>;
}

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';


const token = localStorage.getItem('token');
const headers = { Authorization: `Bearer ${token}` };

export default function Adonan({ setPage, navigate }) {
    const today = toDateStr(new Date());
    const weekAgo = toDateStr(new Date(Date.now() - 6 * 86400000));

    const [from, setFrom] = useState(weekAgo);
    const [to, setTo] = useState(today);
    const [status, setStatus] = useState("");

    // Bangun query string
    const params = new URLSearchParams({ from, to });
    if (status) params.set("batch_status", status);

    const { data: result, loading, error, fetchData } = useApi(`/productions/adonan?${params}`);
    // console.log('result mentah:', result);
    const adonanList = result ?? [];
    // console.log('data: ', adonanList);

    // Tambah di dalam komponen Adonan, setelah deklarasi adonanList:
    const [damageModal, setDamageModal] = useState(null); // { batchId }
    const [damageNote, setDamageNote] = useState("");
    const [loadingAction, setLoadingAction] = useState(null); // batchId yang sedang diproses
    // Tambah state ini di dalam komponen
    const [selectedBatch, setSelectedBatch] = useState(null);

    // Hitung total batch aktif untuk summary
    const totalAktif = adonanList.reduce(
        (acc, p) => acc + p.batches.filter(b => b.status === "ACTIVE").length, 0
    );


    const handleFreeze = async (batchId) => {
        setLoadingAction(batchId);
        console.log('API base:', API);
        try {
            // console.log('headers:', headers);
            // console.log('token:', token);
            await axios.patch(`${API}/batches/${batchId}/freeze`, {}, { headers });
            fetchData(); // re-fetch list
        } catch (err) {
            alert(err.response?.data?.payload?.message || 'Gagal freeze batch');
            // console.log('status:', err.response?.status);
            // console.log('message:', err.message);
            // console.log('data:', err.response?.data);
        } finally {
            setLoadingAction(null);
        }
    };

    const handleThaw = async (batchId) => {
        setLoadingAction(batchId);
        try {
            await axios.patch(`${API}/batches/${batchId}/thaw`, {}, { headers });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.payload?.message || 'Gagal thaw batch');
        } finally {
            setLoadingAction(null);
        }
    };

    const handleDamage = async () => {
        if (!damageModal) return;
        setLoadingAction(damageModal.batchId);
        try {
            await axios.patch(`${API}/batches/${damageModal.batchId}/damage`,
                { notes: damageNote }, { headers }
            );
            setDamageModal(null);
            setDamageNote("");
            fetchData();
        } catch (err) {
            alert(err.response?.data?.payload?.message || 'Gagal tandai rusak');
        } finally {
            setLoadingAction(null);
        }
    };
    return (
        <div className="page">
            {/* HEADER */}
            <div className="phead">
                <div className="phead-row">
                    <button onClick={() => setPage("home")} className="btnBack">
                        <IconBack />
                    </button>
                    <div style={{ flex: 1 }}>
                        <div className="ptitle">Adonan</div>
                        <div className="psub">
                            {totalAktif > 0 ? `${totalAktif} batch aktif sekarang` : "Daftar adonan di booth"}
                        </div>
                    </div>
                    <button
                        onClick={() => setPage("buat-adonan")}
                        style={{
                            display: "flex", alignItems: "center", gap: 5,
                            padding: "7px 12px", borderRadius: 10, border: "none",
                            background: "var(--accent)", color: "#fff",
                            fontSize: 12, fontWeight: 700, cursor: "pointer",
                            fontFamily: "inherit",
                        }}
                    >
                        <IconPlus /> Buat
                    </button>
                </div>
            </div>

            {/* FILTER BAR */}
            <div style={{
                padding: "10px 16px 0",
                display: "flex", flexDirection: "column", gap: 8,
            }}>
                {/* Tanggal */}
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                        type="date" value={from} max={to}
                        onChange={e => setFrom(e.target.value)}
                        style={inputStyle}
                    />
                    <span style={{ color: "var(--text3)", fontSize: 12 }}>–</span>
                    <input
                        type="date" value={to} min={from} max={today}
                        onChange={e => setTo(e.target.value)}
                        style={inputStyle}
                    />
                </div>

                {/* Status chips */}
                <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
                    {STATUS_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setStatus(opt.value)}
                            style={{
                                flexShrink: 0,
                                padding: "5px 12px", borderRadius: 20,
                                border: status === opt.value ? "none" : "1px solid var(--border)",
                                background: status === opt.value ? "var(--accent)" : "var(--bg0)",
                                color: status === opt.value ? "#fff" : "var(--text2)",
                                fontSize: 12, fontWeight: 600, cursor: "pointer",
                                fontFamily: "inherit",
                            }}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* LIST */}
            <div className="pbody" style={{ paddingBottom: 100 }}>
                {loading && (
                    <div style={{ textAlign: "center", color: "var(--text3)", fontSize: 13, marginTop: 40 }}>
                        Memuat data adonan...
                    </div>
                )}
                {error && (
                    <div style={{ textAlign: "center", color: "var(--red)", fontSize: 13, marginTop: 40 }}>
                        Gagal memuat data.
                    </div>
                )}
                {!loading && !error && adonanList.length === 0 && (
                    <div style={{ textAlign: "center", color: "var(--text3)", fontSize: 13, marginTop: 60 }}>
                        <div style={{ fontSize: 36, marginBottom: 10 }}>🧪</div>
                        Tidak ada adonan di rentang ini.
                    </div>
                )}

                {!loading && adonanList.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {adonanList.map(prod => (
                            <div key={prod.id} style={{
                                background: "var(--bg0)",
                                borderRadius: 16,
                                border: "1px solid var(--border)",
                                overflow: "hidden",
                            }}>
                                {/* Header produksi */}
                                <div style={{
                                    padding: "12px 16px",
                                    display: "flex", alignItems: "center", gap: 10,
                                    borderBottom: prod.batches.length > 0 ? "1px solid var(--border)" : "none",
                                }}>
                                    <div style={{
                                        width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                                        background: "var(--accentsoft)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        color: "var(--accent)",
                                    }}>
                                        <IconFlask />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text1)" }}>
                                            {prod.recipe_name}
                                        </div>
                                        <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                                            {prod.qty} batch · {prod.created_by_name} · {new Date(prod.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                        </div>
                                    </div>
                                </div>

                                {/* Batch list */}
                                {prod.batches.length > 0 && (
                                    <div style={{ padding: "8px 16px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                                        {prod.batches.map(b => {
                                            const sc = STATUS_COLOR[b.status] ?? { bg: "#f0f0f0", color: "#888" };
                                            const expiring = b.status === "ACTIVE" && b.expired_at &&
                                                new Date(b.expired_at) - Date.now() < 60 * 60 * 1000;
                                            const isLoading = loadingAction === b.id;

                                            return (
                                                <div key={b.id}
                                                    onClick={() => navigate("batch-detail", { batchId: b.id })}
                                                    style={{
                                                        borderRadius: 10,
                                                        background: expiring ? "#fff8e1" : "var(--bg1)",
                                                        border: expiring ? "1px solid #ffd54f" : "1px solid var(--border)",
                                                        overflow: "hidden",
                                                    }}>
                                                    {/* Info batch */}
                                                    <div style={{
                                                        display: "flex", alignItems: "center",
                                                        justifyContent: "space-between",
                                                        padding: "8px 10px",
                                                    }}>
                                                        <div>
                                                            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text1)" }}>
                                                                Batch #{b.id}
                                                                {expiring && <span style={{ color: "#e65100", marginLeft: 6, fontSize: 11 }}>⚠ Hampir exp!</span>}
                                                            </div>
                                                            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 1 }}>
                                                                Sisa {b.remaining_qty}/{b.total_qty} {prod.output_unit}
                                                                {b.expired_at && ` · exp ${new Date(b.expired_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`}
                                                                {b.status === "FROZEN" && " · ❄ Dikulkas"}
                                                            </div>
                                                        </div>
                                                        <span style={{
                                                            fontSize: 11, fontWeight: 700,
                                                            padding: "3px 9px", borderRadius: 20,
                                                            background: sc.bg, color: sc.color,
                                                        }}>
                                                            {b.status}
                                                        </span>
                                                    </div>

                                                    {/* Tombol aksi — hanya untuk ACTIVE atau FROZEN */}
                                                    {(b.status === "ACTIVE" || b.status === "FROZEN") && (
                                                        <div style={{
                                                            display: "flex", gap: 6, padding: "0 10px 8px",
                                                        }}>
                                                            {b.status === "ACTIVE" && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleFreeze(b.id) }}
                                                                    disabled={isLoading}
                                                                    style={btnStyle("#e8f0fe", "#3b6fd4")}
                                                                >
                                                                    ❄ Kulkas
                                                                </button>
                                                            )}
                                                            {b.status === "FROZEN" && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleThaw(b.id) }}
                                                                    disabled={isLoading}
                                                                    style={btnStyle("#e6f9ee", "#1a9449")}
                                                                >
                                                                    🌡 Keluarkan
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setDamageModal({ batchId: b.id }); setDamageNote(""); }}
                                                                disabled={isLoading}
                                                                style={btnStyle("#fdecea", "#c0392b")}
                                                            >
                                                                ⚠ Rusak
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {damageModal && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
                    display: "flex", alignItems: "flex-end", justifyContent: "center",
                    zIndex: 100,
                }}>
                    <div style={{
                        background: "var(--bg0)", borderRadius: "20px 20px 0 0",
                        padding: "20px 20px 36px", width: "100%", maxWidth: 330,
                    }}>
                        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Tandai Batch Rusak</div>
                        <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 14 }}>
                            Batch #{damageModal.batchId} akan ditandai rusak dan tidak bisa digunakan.
                        </div>
                        <textarea
                            value={damageNote}
                            onChange={e => setDamageNote(e.target.value)}
                            placeholder="Catatan (mis. kemasukan hewan, tumpah...)"
                            rows={3}
                            style={{
                                width: "100%", borderRadius: 10, border: "1px solid var(--border)",
                                padding: "10px 12px", fontSize: 13, fontFamily: "inherit",
                                background: "var(--bg1)", color: "var(--text1)",
                                resize: "none", outline: "none", boxSizing: "border-box",
                            }}
                        />
                        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                            <button
                                onClick={() => setDamageModal(null)}
                                style={{ ...btnStyle("var(--bg1)", "var(--text2)"), flex: 1, padding: "10px 0" }}
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDamage}
                                disabled={loadingAction !== null}
                                style={{ ...btnStyle("#fdecea", "#c0392b"), flex: 1, padding: "10px 0" }}
                            >
                                Tandai Rusak
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const inputStyle = {
    flex: 1, padding: "7px 10px", borderRadius: 10,
    border: "1px solid var(--border)", background: "var(--bg0)",
    fontSize: 12, color: "var(--text1)", fontFamily: "inherit",
    outline: "none",
};

const btnStyle = (bg, color) => ({
    flex: 1, padding: "6px 0", borderRadius: 8, border: "none",
    background: bg, color: color,
    fontSize: 11, fontWeight: 700, cursor: "pointer",
    fontFamily: "inherit",
});