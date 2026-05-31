// src/pages/Mobile/BuatAdonan.jsx
import { useState } from "react";
import { useApi } from "../../hooks/useApi";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";
function getToken() { return localStorage.getItem("token"); }
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

// ── Helpers ──────────────────────────────────────────────────
function formatQty(val, unit) {
  const n = Number(val);
  return isNaN(n) ? `${val} ${unit}` : `${n % 1 === 0 ? n : n.toFixed(2)} ${unit}`;
}

// ── Icons ────────────────────────────────────────────────────
function IconBack() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function IconFlask() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M9 3h6M9 3v7.6L4.5 18a2 2 0 0 0 1.8 2.8h11.4a2 2 0 0 0 1.8-2.8L15 10.6V3" />
      <line x1="6.5" y1="14" x2="17.5" y2="14" />
    </svg>
  );
}
function IconWarn() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconBox() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="21 8 21 21 3 21 3 8" />
      <rect x="1" y="3" width="22" height="5" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </svg>
  );
}

// ── Stepper ───────────────────────────────────────────────────
function Stepper({ value, min = 1, max = 99, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        style={{
          width: 36, height: 36, borderRadius: 10,
          border: "1px solid var(--border2)", background: "var(--bg1)",
          color: "var(--text1)", fontSize: 20, fontWeight: 700,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >−</button>
      <span style={{ fontSize: 22, fontWeight: 900, color: "var(--text1)", minWidth: 28, textAlign: "center" }}>
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        style={{
          width: 36, height: 36, borderRadius: 10,
          border: "1px solid var(--border2)", background: "var(--bg1)",
          color: "var(--text1)", fontSize: 20, fontWeight: 700,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >+</button>
    </div>
  );
}

// ── Bahan Row ─────────────────────────────────────────────────
function BahanRow({ bahan, batch }) {
  // bahan: { id, name, qty_per_batch, unit, stok_tersedia }
  const needed = bahan.qty_per_batch * batch;
  const cukup = bahan.stok_tersedia >= needed;
  const pct = Math.min(100, (bahan.stok_tersedia / needed) * 100);

  return (
    <div style={{
      background: "var(--bg0)",
      borderRadius: 13,
      padding: "12px 14px",
      border: `1px solid ${cukup ? "var(--border)" : "rgba(192,57,43,0.22)"}`,
    }}>
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        {/* Icon */}
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: cukup ? "var(--greensoft)" : "var(--redsoft)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: cukup ? "var(--green)" : "var(--red)",
        }}>
          {cukup ? <IconCheck /> : <IconWarn />}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text1)" }}>{bahan.name}</span>
            <span style={{
              fontSize: 11, fontWeight: 700,
              padding: "2px 8px", borderRadius: 20,
              background: cukup ? "var(--greensoft)" : "var(--redsoft)",
              color: cukup ? "var(--green)" : "var(--red)",
            }}>
              {cukup ? "Cukup" : "Kurang"}
            </span>
          </div>

          <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 8 }}>
            Butuh&nbsp;
            <span style={{ fontWeight: 700, color: cukup ? "var(--text2)" : "var(--red)" }}>
              {formatQty(needed, bahan.unit)}
            </span>
            &nbsp;· Tersedia&nbsp;
            <span style={{ fontWeight: 700, color: "var(--text2)" }}>
              {formatQty(bahan.stok_tersedia, bahan.unit)}
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ height: 5, borderRadius: 99, background: "var(--bg2)", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${pct}%`,
              borderRadius: 99,
              background: cukup ? "var(--green)" : "var(--red)",
              transition: "width 0.3s ease",
            }} />
          </div>
        </div>
      </div>

      {/* Warning keterangan */}
      {!cukup && (
        <div style={{
          marginTop: 8, padding: "7px 10px",
          borderRadius: 9, background: "var(--redsoft)",
          color: "var(--red)", fontSize: 11, fontWeight: 600,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <IconWarn />
          Kurang {formatQty(needed - bahan.stok_tersedia, bahan.unit)} — minta distribusi ke kurir
        </div>
      )}
    </div>
  );
}

// ── Sukses Modal ──────────────────────────────────────────────
function SuksesModal({ batch, resepNama, onClose }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(28,16,8,0.45)", zIndex: 50,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 350,
          background: "var(--bg0)", borderRadius: "20px 20px 0 0",
          padding: "24px 24px calc(32px + env(safe-area-inset-bottom))",
          animation: "slideUp 0.22s ease",
          textAlign: "center",
        }}
      >
        <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--bg3)", margin: "0 auto 20px" }} />
        <div style={{
          width: 64, height: 64, borderRadius: 20,
          background: "var(--greensoft)", display: "flex",
          alignItems: "center", justifyContent: "center",
          color: "var(--green)", margin: "0 auto 14px",
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text1)", marginBottom: 6 }}>
          Adonan Berhasil Dibuat!
        </div>
        <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 24 }}>
          {batch} batch <strong>{resepNama}</strong> telah dicatat & stok bahan dikurangi
        </div>
        <button
          onClick={onClose}
          style={{
            width: "100%", padding: 14, borderRadius: 14, border: "none",
            background: "var(--green)", color: "#fff",
            fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
          }}
        >
          Selesai
        </button>
      </div>
    </div>
  );
}

// ── Main: BuatAdonan ──────────────────────────────────────────
export default function BuatAdonan({ setPage }) {
  const [batch, setBatch] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sukses, setSukses] = useState(false);

  // Fetch resep aktif + kebutuhan bahan dengan stok tersedia
  // Endpoint yang diharapkan: GET /recipe/active
  // Response: { id, name, deskripsi, bahan: [{ id, name, qty_per_batch, unit, stok_tersedia }] }
  const { data: resep, loading: loadResep, error: errResep } = useApi("/recipes/active");

  const bahan = resep?.bahan ?? [];
  const allCukup = bahan.every(b => b.stok_tersedia >= b.qty_per_batch * batch);

  async function handleBuat() {
    if (!allCukup) return;
    setLoading(true);
    setError(null);

    // Debug: cek nilai sebelum kirim
    console.log("resep.id:", resep?.id);
    console.log("batch:", batch);
    console.log("Data yang dikirim:", { recipe_id: resep?.id, batch });
    try {
      await axios.post(
        `${BASE_URL}/productions`,
        { recipe_id: resep.id, qty: batch },
        { headers: authHeader() }
      );
      setSukses(true);
    } catch (e) {
      setError(e?.response?.data?.message ?? "Gagal membuat adonan, coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  function handleSuksesClose() {
    setSukses(false);
    setBatch(1);
    setPage?.("home");
  }

  // ── Loading state ──
  if (loadResep) {
    return (
      <div className="page">
        <div className="phead">
          <div className="phead-row">
            <button onClick={() => setPage?.("adonan")} style={btnBack}>
              <IconBack />
            </button>
            <div>
              <div className="ptitle">Buat Adonan</div>
              <div className="psub">Memuat resep...</div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "var(--text3)", fontSize: 13 }}>
          Memuat resep aktif...
        </div>
      </div>
    );
  }

  // ── Error / tidak ada resep ──
  if (errResep || !resep) {
    return (
      <div className="page">
        <div className="phead">
          <div className="phead-row">
            <button onClick={() => setPage?.("adonan")} style={btnBack}><IconBack /></button>
            <div>
              <div className="ptitle">Buat Adonan</div>
              <div className="psub">Resep tidak tersedia</div>
            </div>
          </div>
        </div>
        <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text3)", fontSize: 13 }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🍫</div>
          Belum ada resep aktif. Hubungi pemilik untuk mengaktifkan resep.
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* HEADER */}
      <div className="phead">
        <div className="phead-row">
          <button onClick={() => setPage?.("adonan")} className="btnBack"><IconBack /></button>
          <div style={{ flex: 1 }}>
            <div className="ptitle">Buat Adonan</div>
            <div className="psub">Cek ketersediaan bahan</div>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "5px 10px", borderRadius: 10,
            background: "var(--accentsoft)", color: "var(--accent)",
            fontSize: 11, fontWeight: 700,
          }}>
            <IconFlask />
            Aktif
          </div>
        </div>
      </div>

      <div className="pbody" style={{ paddingBottom: 120 }}>
        {/* RESEP CARD */}
        <div style={{
          background: "var(--bg0)", borderRadius: 16,
          border: "1px solid var(--border)",
          padding: "16px",
          marginBottom: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: resep.deskripsi ? 10 : 0 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 13, flexShrink: 0,
              background: "var(--accentsoft)", display: "flex",
              alignItems: "center", justifyContent: "center",
              color: "var(--accent)",
            }}>
              <IconFlask />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text1)" }}>{resep.name}</div>
              {resep.deskripsi && (
                <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>{resep.deskripsi}</div>
              )}
            </div>
          </div>
        </div>

        {/* JUMLAH BATCH */}
        <div style={{
          background: "var(--bg0)", borderRadius: 16,
          border: "1px solid var(--border)", padding: "16px",
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
            Jumlah Adonan (Batch)
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 2 }}>Berapa batch yang ingin dibuat?</div>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>1 batch = 1 takaran penuh resep</div>
            </div>
            <Stepper value={batch} onChange={setBatch} />
          </div>
        </div>

        {/* DAFTAR BAHAN */}
        <div className="sec-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <IconBox />
          Bahan yang Dibutuhkan
        </div>

        {/* Summary badge */}
        {!allCukup && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 13px", borderRadius: 12,
            background: "var(--redsoft)", color: "var(--red)",
            fontSize: 12, fontWeight: 700, marginBottom: 12,
          }}>
            <IconWarn />
            {bahan.filter(b => b.stok_tersedia < b.qty_per_batch * batch).length} bahan tidak mencukupi
          </div>
        )}
        {allCukup && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 13px", borderRadius: 12,
            background: "var(--greensoft)", color: "var(--green)",
            fontSize: 12, fontWeight: 700, marginBottom: 12,
          }}>
            <IconCheck />
            Semua bahan tersedia — siap buat adonan!
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {bahan.map(b => (
            <BahanRow key={b.id} bahan={b} batch={batch} />
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginTop: 12, padding: "10px 13px",
            borderRadius: 12, background: "var(--redsoft)",
            color: "var(--red)", fontSize: 12, fontWeight: 600,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <IconWarn />
            {error}
          </div>
        )}

        <div style={{ height: 20 }} />
      </div>

      {/* FOOTER CTA */}
      <div style={{
        position: "fixed", bottom: 60, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 350,
        padding: "8px 10px calc(8px + env(safe-area-inset-bottom))",
        background: "var(--bg1)", borderTop: "1px solid var(--border)",
      }}>
        <button
          onClick={handleBuat}
          disabled={loading || !allCukup}
          style={{
            width: "100%", padding: 8, borderRadius: 15, border: "none",
            background: allCukup ? "var(--accent)" : "var(--bg3)",
            color: allCukup ? "#fff" : "var(--text3)",
            fontSize: 15, fontWeight: 900,
            cursor: loading || !allCukup ? "not-allowed" : "pointer",
            fontFamily: "inherit", opacity: loading ? 0.75 : 1,
            transition: "all 0.2s",
            boxShadow: allCukup ? "0 4px 14px rgba(196,123,16,0.22)" : "none",
          }}
        >
          {loading
            ? "Memproses..."
            : !allCukup
              ? "Stok Tidak Mencukupi"
              : `Buat Adonan · ${batch} Batch`}
        </button>
      </div>

      {/* SUCCESS MODAL */}
      {sukses && (
        <SuksesModal
          batch={batch}
          resepNama={resep.name}
          onClose={handleSuksesClose}
        />
      )}
    </div>
  );
}

// ── Shared style ──────────────────────────────────────────────
const btnBack = {
  width: 36, height: 36, borderRadius: 10,
  border: "1px solid var(--border2)", background: "var(--bg0)",
  display: "flex", alignItems: "center", justifyContent: "center",
  color: "var(--text1)", cursor: "pointer", flexShrink: 0,
};
