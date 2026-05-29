// src/pages/Mobile/StokPage.jsx
import { useState } from "react";
import { useApi } from "../../hooks/useApi";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";
function getToken() { return localStorage.getItem("token"); }
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

// ── Helpers ──────────────────────────────────────────────────
function fmt(val) {
  const n = Number(val);
  if (isNaN(n)) return "0";
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}

// ── Icons ────────────────────────────────────────────────────
function IconSearch() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
}
function IconWarn() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
}
function IconBox() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" /></svg>;
}
function IconTruck() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>;
}
function IconEdit() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
}
function IconX() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}
function IconCheck() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>;
}

// ── Category chip ─────────────────────────────────────────────
const CAT_STYLE = {
  "Bahan Baku": { bg: "var(--accentsoft)", color: "var(--accent)" },
  "Bahan Setengah Jadi": { bg: "var(--bluesoft)", color: "var(--blue)" },
  "Packaging": { bg: "var(--purplesoft)", color: "var(--purple)" },
  "Mixing": { bg: "var(--greensoft)", color: "var(--green)" },
  "Lainnya": { bg: "var(--bg2)", color: "var(--text3)" },
};
function CatChip({ cat }) {
  const s = CAT_STYLE[cat] ?? CAT_STYLE["Lainnya"];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: s.bg, color: s.color }}>
      {cat}
    </span>
  );
}

// ── Stok status ───────────────────────────────────────────────
function stokStatus(item) {
  const stok = Number(item.current_stock ?? 0);
  const safety = Number(item.safety_stock ?? 0);
  const min = Number(item.min_qty ?? 0);
  if (stok <= 0) return { label: "Habis", cls: "danger" };
  if (safety && stok < safety) return { label: "Menipis", cls: "warn" };
  if (min && stok < min) return { label: "Menipis", cls: "warn" };
  return { label: "Aman", cls: "ok" };
}

const STATUS_STYLE = {
  ok: { bg: "var(--greensoft)", color: "var(--green)" },
  warn: { bg: "rgba(196,123,16,0.12)", color: "var(--accent)" },
  danger: { bg: "var(--redsoft)", color: "var(--red)" },
};

// ── Stok Item Card ────────────────────────────────────────────
function StokCard({ item, onKoreksi, onDistribusi }) {
  const status = stokStatus(item);
  const ss = STATUS_STYLE[status.cls];
  const pct = item.max_qty
    ? Math.min(100, (Number(item.current_stock) / Number(item.max_qty)) * 100)
    : null;

  return (
    <div style={{
      background: "var(--bg0)", borderRadius: 14,
      border: `1px solid ${status.cls !== "ok" ? "rgba(192,57,43,0.18)" : "var(--border)"}`,
      padding: "13px 14px",
    }}>
      {/* Top */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11, flexShrink: 0,
          background: ss.bg, display: "flex", alignItems: "center",
          justifyContent: "center", color: ss.color,
        }}>
          <IconBox />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text1)" }}>{item.name}</span>
            <CatChip cat={item.category} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: "var(--text1)" }}>
              {fmt(item.current_stock)}
            </span>
            <span style={{ fontSize: 12, color: "var(--text3)", fontWeight: 600 }}>{item.unit}</span>
            <span style={{
              marginLeft: "auto", fontSize: 10, fontWeight: 700,
              padding: "2px 8px", borderRadius: 20,
              background: ss.bg, color: ss.color,
            }}>
              {status.label}
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar (kalau ada max_qty) */}
      {pct !== null && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ height: 4, borderRadius: 99, background: "var(--bg2)", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 99,
              width: `${pct}%`,
              background: status.cls === "ok" ? "var(--green)" : status.cls === "warn" ? "var(--accent)" : "var(--red)",
              transition: "width 0.3s",
            }} />
          </div>
          {item.safety_stock && (
            <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 3 }}>
              Safety stock: {fmt(item.safety_stock)} {item.unit}
              {item.max_qty ? ` · Maks: ${fmt(item.max_qty)} ${item.unit}` : ""}
            </div>
          )}
        </div>
      )}

      {/* Warning menipis */}
      {status.cls !== "ok" && (
        <div style={{
          padding: "6px 10px", borderRadius: 9,
          background: status.cls === "danger" ? "var(--redsoft)" : "var(--accentsoft)",
          color: status.cls === "danger" ? "var(--red)" : "var(--accent)",
          fontSize: 11, fontWeight: 600,
          display: "flex", alignItems: "center", gap: 6, marginBottom: 10,
        }}>
          <IconWarn />
          {status.cls === "danger"
            ? "Stok habis — segera request distribusi"
            : `Stok menipis — di bawah safety stock (${fmt(item.safety_stock)} ${item.unit})`}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => onKoreksi(item)}
          style={{
            flex: 1, padding: "8px 0", borderRadius: 10,
            border: "1px solid var(--border2)", background: "var(--bg1)",
            color: "var(--text2)", fontSize: 12, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          <IconEdit /> Koreksi
        </button>
        <button
          onClick={() => onDistribusi(item)}
          style={{
            flex: 1, padding: "8px 0", borderRadius: 10,
            border: "none", background: "var(--accentsoft)",
            color: "var(--accent)", fontSize: 12, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          <IconTruck /> Request
        </button>
      </div>
    </div>
  );
}

// ── Koreksi Sheet ─────────────────────────────────────────────
function KoreksiSheet({ item, onClose, onSuccess }) {
  const [type, setType] = useState("IN");
  const [qty, setQty] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit() {
    if (!qty || Number(qty) <= 0) return setError("Jumlah harus lebih dari 0");
    setLoading(true);
    setError(null);
    try {
      await axios.post(`${BASE_URL}/stock/koreksi`, {
        item_id: item.item_id,
        location_id: item.location_id,
        qty: Number(qty),
        movement_type: type,   // 'IN' | 'OUT'
        source_type: "KOREKSI",
        notes,
      }, { headers: authHeader() });
      onSuccess();
      onClose();
    } catch (e) {
      setError(e?.response?.data?.payload?.message ?? "Gagal menyimpan koreksi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Overlay onClose={onClose}>
      <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--bg3)", margin: "0 auto 18px" }} />
      <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text1)", marginBottom: 2 }}>Koreksi Stok</div>
      <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 18 }}>{item.name}</div>

      {/* IN / OUT toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["IN", "OUT"].map(t => (
          <button
            key={t}
            onClick={() => setType(t)}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 12,
              border: `1.5px solid ${type === t ? (t === "IN" ? "var(--green)" : "var(--red)") : "var(--border2)"}`,
              background: type === t ? (t === "IN" ? "var(--greensoft)" : "var(--redsoft)") : "var(--bg1)",
              color: type === t ? (t === "IN" ? "var(--green)" : "var(--red)") : "var(--text3)",
              fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
              transition: "all 0.15s",
            }}
          >
            {t === "IN" ? "+ Tambah" : "− Kurangi"}
          </button>
        ))}
      </div>

      {/* Qty input */}
      <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        Jumlah ({item.unit})
      </label>
      <input
        type="number"
        min="0"
        value={qty}
        onChange={e => setQty(e.target.value)}
        placeholder="0"
        style={{
          width: "100%", padding: "11px 14px", borderRadius: 12,
          border: "1px solid var(--border2)", background: "var(--bg1)",
          fontSize: 16, fontWeight: 700, color: "var(--text1)",
          fontFamily: "inherit", marginTop: 6, marginBottom: 14,
          outline: "none",
        }}
      />

      {/* Notes */}
      <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        Catatan (opsional)
      </label>
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Alasan koreksi..."
        rows={2}
        style={{
          width: "100%", padding: "11px 14px", borderRadius: 12,
          border: "1px solid var(--border2)", background: "var(--bg1)",
          fontSize: 13, color: "var(--text1)", fontFamily: "inherit",
          marginTop: 6, marginBottom: 16, resize: "none", outline: "none",
        }}
      />

      {/* Stok sesudah preview */}
      {qty && Number(qty) > 0 && (
        <div style={{
          padding: "10px 13px", borderRadius: 11,
          background: "var(--bg2)", marginBottom: 14,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: 12, color: "var(--text3)", fontWeight: 600 }}>Stok sesudah koreksi</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text1)" }}>
            {fmt(type === "IN"
              ? Number(item.current_stock) + Number(qty)
              : Math.max(0, Number(item.current_stock) - Number(qty))
            )} {item.unit}
          </span>
        </div>
      )}

      {error && <ErrorBox msg={error} />}

      <button
        onClick={handleSubmit}
        disabled={loading || !qty}
        style={{
          width: "100%", padding: 14, borderRadius: 14, border: "none",
          background: type === "IN" ? "var(--green)" : "var(--red)",
          color: "#fff", fontSize: 14, fontWeight: 900,
          cursor: loading || !qty ? "not-allowed" : "pointer",
          fontFamily: "inherit", opacity: loading || !qty ? 0.6 : 1,
        }}
      >
        {loading ? "Menyimpan..." : `Simpan Koreksi ${type}`}
      </button>
    </Overlay>
  );
}

// ── Request Distribusi Sheet ───────────────────────────────────
function DistribusiSheet({ item, onClose, onSuccess }) {
  const [qty, setQty] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit() {
    if (!qty || Number(qty) <= 0) return setError("Jumlah harus lebih dari 0");
    setLoading(true);
    setError(null);
    try {
      // POST ke /distributions — buat distribution baru dengan status 'draft'
      // Backend perlu resolve warehouse location_id otomatis
      await axios.post(`${BASE_URL}/distributions/request`, {
        item_id: item.item_id,
        to_location_id: item.location_id,
        qty: Number(qty),
        planned_date: date,
        notes,
      }, { headers: authHeader() });
      onSuccess();
      onClose();
    } catch (e) {
      setError(e?.response?.data?.payload?.message ?? "Gagal membuat request");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Overlay onClose={onClose}>
      <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--bg3)", margin: "0 auto 18px" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: "var(--accentsoft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)" }}>
          <IconTruck />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text1)" }}>Request Distribusi</div>
          <div style={{ fontSize: 11, color: "var(--text3)" }}>Dari warehouse ke booth</div>
        </div>
      </div>

      {/* Item info */}
      <div style={{
        margin: "14px 0", padding: "10px 13px", borderRadius: 11,
        background: "var(--bg2)", display: "flex", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--text3)" }}>Item</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text1)" }}>{item.name}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, color: "var(--text3)" }}>Stok saat ini</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text1)" }}>{fmt(item.current_stock)} {item.unit}</div>
        </div>
      </div>

      {/* Qty */}
      <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        Jumlah Request ({item.unit})
      </label>
      <input
        type="number"
        min="0"
        value={qty}
        onChange={e => setQty(e.target.value)}
        placeholder="0"
        style={inputStyle}
      />

      {/* Tanggal */}
      <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 12, display: "block" }}>
        Tanggal Dibutuhkan
      </label>
      <input
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        style={inputStyle}
      />

      {/* Notes */}
      <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 12, display: "block" }}>
        Catatan (opsional)
      </label>
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Keterangan tambahan..."
        rows={2}
        style={{ ...inputStyle, resize: "none" }}
      />

      {error && <ErrorBox msg={error} />}

      <button
        onClick={handleSubmit}
        disabled={loading || !qty}
        style={{
          width: "100%", padding: 14, borderRadius: 14, border: "none",
          background: "var(--accent)", color: "#fff",
          fontSize: 14, fontWeight: 900, marginTop: 4,
          cursor: loading || !qty ? "not-allowed" : "pointer",
          fontFamily: "inherit", opacity: loading || !qty ? 0.6 : 1,
          boxShadow: "0 4px 14px rgba(196,123,16,0.22)",
        }}
      >
        {loading ? "Mengirim..." : "Kirim Request"}
      </button>
    </Overlay>
  );
}

// ── Success Toast ─────────────────────────────────────────────
function Toast({ msg, onDone }) {
  return (
    <div style={{
      position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
      background: "var(--green)", color: "#fff",
      padding: "10px 18px", borderRadius: 12,
      fontSize: 13, fontWeight: 700,
      display: "flex", alignItems: "center", gap: 8,
      zIndex: 100, boxShadow: "0 4px 16px rgba(46,138,86,0.3)",
      animation: "fadeIn 0.2s ease",
    }}>
      <IconCheck /> {msg}
    </div>
  );
}

// ── Shared UI helpers ─────────────────────────────────────────
function Overlay({ onClose, children }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(28,16,8,0.45)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 330,
          background: "var(--bg0)", borderRadius: "20px 20px 0 0",
          padding: "20px 20px calc(24px + env(safe-area-inset-bottom))",
          animation: "slideUp 0.22s ease",
        }}
      >
        <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}} @keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
        {children}
      </div>
    </div>
  );
}
function ErrorBox({ msg }) {
  return (
    <div style={{ padding: "9px 12px", borderRadius: 10, background: "var(--redsoft)", color: "var(--red)", fontSize: 12, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
      <IconWarn /> {msg}
    </div>
  );
}
const inputStyle = {
  width: "100%", padding: "11px 14px", borderRadius: 12,
  border: "1px solid var(--border2)", background: "var(--bg1)",
  fontSize: 14, fontWeight: 600, color: "var(--text1)",
  fontFamily: "inherit", marginTop: 6, marginBottom: 4,
  outline: "none", display: "block",
};

// ── Main: StokPage ────────────────────────────────────────────
export default function StokPage() {
  const [search, setSearch] = useState("");
  const [filterMenipis, setFilterMenipis] = useState(false);
  const [koreksiItem, setKoreksiItem] = useState(null);
  const [distribusiItem, setDistribusiItem] = useState(null);
  const [toast, setToast] = useState(null);

  // GET /stock/booth — return array item stok di booth penjaga
  // payload: [{ item_id, location_id, name, category, unit, current_stock, safety_stock, min_qty, max_qty }]
  const { data, loading, error, fetchData } = useApi("/items/boothStock");
  const items = Array.isArray(data) ? data : [];

  const filtered = items.filter(item => {
    const matchSearch = item.name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filterMenipis ? stokStatus(item).cls !== "ok" : true;
    return matchSearch && matchFilter;
  });

  const menipisCount = items.filter(i => stokStatus(i).cls !== "ok").length;

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function handleKoreksiSuccess() {
    fetchData();
    showToast("Koreksi stok berhasil disimpan");
  }

  function handleDistribusiSuccess() {
    showToast("Request distribusi berhasil dikirim");
  }

  return (
    <div className="page">
      {/* HEADER */}
      <div className="phead">
        <div className="phead-row">
          <div style={{ flex: 1 }}>
            <div className="ptitle">Stok Booth</div>
            <div className="psub">{items.length} item terdaftar</div>
          </div>
          {menipisCount > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 10px", borderRadius: 10,
              background: "var(--redsoft)", color: "var(--red)",
              fontSize: 11, fontWeight: 700,
            }}>
              <IconWarn /> {menipisCount} menipis
            </div>
          )}
        </div>
      </div>

      <div className="pbody" style={{ paddingBottom: 24 }}>
        {/* Search + filter */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <div className="srchbar" style={{ flex: 1, marginBottom: 0 }}>
            <IconSearch />
            <input
              placeholder="Cari item..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setFilterMenipis(v => !v)}
            style={{
              flexShrink: 0, padding: "0 14px", borderRadius: 12,
              border: `1.5px solid ${filterMenipis ? "var(--red)" : "var(--border2)"}`,
              background: filterMenipis ? "var(--redsoft)" : "var(--bg0)",
              color: filterMenipis ? "var(--red)" : "var(--text3)",
              fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 5,
              transition: "all 0.15s",
            }}
          >
            <IconWarn /> Menipis
          </button>
        </div>

        {/* Summary chips */}
        {!loading && items.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            {[
              { label: "Aman", count: items.filter(i => stokStatus(i).cls === "ok").length, bg: "var(--greensoft)", color: "var(--green)" },
              { label: "Menipis", count: items.filter(i => stokStatus(i).cls === "warn").length, bg: "var(--accentsoft)", color: "var(--accent)" },
              { label: "Habis", count: items.filter(i => stokStatus(i).cls === "danger").length, bg: "var(--redsoft)", color: "var(--red)" },
            ].map(({ label, count, bg, color }) => (
              <div key={label} style={{ padding: "5px 12px", borderRadius: 20, background: bg, color, fontSize: 11, fontWeight: 700 }}>
                {label} · {count}
              </div>
            ))}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text3)", fontSize: 13 }}>
            Memuat stok...
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--red)", fontSize: 13 }}>{error}</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text3)", fontSize: 13 }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📦</div>
            {search || filterMenipis ? "Tidak ada item yang cocok" : "Belum ada data stok"}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(item => (
              <StokCard
                key={item.item_id}
                item={item}
                onKoreksi={setKoreksiItem}
                onDistribusi={setDistribusiItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sheets */}
      {koreksiItem && (
        <KoreksiSheet
          item={koreksiItem}
          onClose={() => setKoreksiItem(null)}
          onSuccess={handleKoreksiSuccess}
        />
      )}
      {distribusiItem && (
        <DistribusiSheet
          item={distribusiItem}
          onClose={() => setDistribusiItem(null)}
          onSuccess={handleDistribusiSuccess}
        />
      )}

      {/* Toast */}
      {toast && <Toast msg={toast} />}
    </div>
  );
}
