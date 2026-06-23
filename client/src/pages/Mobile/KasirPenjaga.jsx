// src/pages/Mobile/KasirPenjaga.jsx
import { useState, useRef } from "react";
import { useApi } from "../../hooks/useApi";
import axios from "axios";
import { IconCart, IconBack, IconCheck, IconCup } from "./Icons";
import useJadwalCheck from '../../hooks/useJadwalCheck';
import JadwalWarningBanner from '../../components/JadwalWarningBanner';

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";
function getToken() { return localStorage.getItem("token"); }
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });


function formatRp(val) {
  return "Rp " + Number(val).toLocaleString("id");
}

// ── Size Chip ─────────────────────────────────────────────────
function SizeChip({ size }) {
  const map = {
    kecil: { bg: "#D1FAE5", color: "#065F46" },
    sedang: { bg: "#FEF3C7", color: "#92400E" },
    jumbo: { bg: "#EDE9FE", color: "#5B21B6" },
  };
  const s = map[size] ?? { bg: "var(--bg2)", color: "var(--text3)" };
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: s.bg, color: s.color }}>
      {size}
    </span>
  );
}

// ── Mini Stepper ──────────────────────────────────────────────
function Stepper({ value, onChange, accent }) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState("");
  const inputRef = useRef(null);

  const color = accent ?? "var(--accent)";
  const softBg = accent ? "rgba(37,99,168,0.12)" : "var(--accentsoft)";

  function startEdit() {
    setRaw(value > 0 ? String(value) : "");
    setEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  }

  function commitEdit() {
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed >= 0) onChange(parsed);
    else onChange(value);
    setEditing(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") commitEdit();
    if (e.key === "Escape") setEditing(false);
    if (e.key === "ArrowUp") { e.preventDefault(); setRaw(String(Math.max(0, (parseInt(raw) || 0) + 1))); }
    if (e.key === "ArrowDown") { e.preventDefault(); setRaw(String(Math.max(0, (parseInt(raw) || 0) - 1))); }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        style={{
          width: 30, height: 30, borderRadius: "8px 0 0 8px",
          border: "1px solid var(--border2)", borderRight: "none",
          background: "var(--bg1)", color: "var(--text2)",
          fontSize: 16, fontWeight: 800, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >−</button>

      {editing ? (
        <input
          ref={inputRef}
          type="number"
          min="0"
          value={raw}
          onChange={e => setRaw(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          style={{
            width: 34, height: 30,
            border: "1px solid var(--border2)",
            borderLeft: `1.5px solid ${color}`,
            borderRight: `1.5px solid ${color}`,
            background: softBg,
            textAlign: "center",
            fontSize: 14, fontWeight: 900,
            color: color,
            outline: "none",
            padding: 0,
            MozAppearance: "textfield",
          }}
        />
      ) : (
        <div
          onClick={startEdit}
          title="Klik untuk isi angka langsung"
          style={{
            width: 34, height: 30, border: "1px solid var(--border2)",
            background: value > 0 ? softBg : "var(--bg1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 900,
            color: value > 0 ? color : "var(--text3)",
            cursor: "text",
            transition: "all 0.15s",
            userSelect: "none",
          }}
        >
          {value}
        </div>
      )}

      <button
        onClick={() => onChange(value + 1)}
        style={{
          width: 30, height: 30, borderRadius: "0 8px 8px 0",
          border: "1px solid var(--border2)", borderLeft: "none",
          background: value > 0 ? color : "var(--bg1)",
          color: value > 0 ? "#fff" : "var(--text2)",
          fontSize: 16, fontWeight: 800, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.15s",
        }}
      >+</button>
    </div>
  );
}
// ── Product Card ──────────────────────────────────────────────
// entry: { qty: number, lessIceQty: number }
function ProductCard({ product, entry, onChange }) {
  const qty = entry?.qty ?? 0;
  const lessIceQty = entry?.lessIceQty ?? 0;
  const active = qty > 0 || lessIceQty > 0;

  function setQty(val) { onChange(product, val, lessIceQty); }
  function setLessIceQty(val) { onChange(product, qty, val); }

  function clearAll() { onChange(product, 0, 0); } // ← tambah ini
  return (
    <div style={{
      background: "var(--bg0)", borderRadius: 14,
      border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
      padding: "12px 13px",
      transition: "border-color 0.15s",
    }}>
      {/* Header: icon + nama + harga */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: active ? 12 : 0 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: active ? "var(--accentsoft)" : "var(--bg2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: active ? "var(--accent)" : "var(--text3)",
          transition: "all 0.15s",
        }}>
          <IconCup />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text1)" }}>{product.name}</span>
            <SizeChip size={product.size} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--accent)" }}>
            {formatRp(product.price)}
          </span>
        </div>

        {/* Kalau belum ada qty — tombol + saja */}
        {!active ? (
          // Tombol + kalau belum ada item
          <button
            onClick={() => setQty(1)}
            style={{
              width: 32, height: 32, borderRadius: 9,
              border: "none", background: "var(--accent)", color: "#fff",
              fontSize: 20, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >+</button>
        ) : (
          // Tombol hapus kalau sudah ada item
          <button
            onClick={clearAll}
            title="Hapus dari keranjang"
            style={{
              width: 32, height: 32, borderRadius: 9,
              border: "1px solid var(--border2)",
              background: "var(--bg1)", color: "var(--text3)",
              fontSize: 15, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              transition: "all 0.15s",
            }}
          >🗑</button>
        )}
      </div>

      {/* Dua baris stepper — hanya muncul kalau active */}
      {active && (
        <div style={{
          borderTop: "1px solid var(--border)",
          paddingTop: 10,
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          {/* Regular */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 20, height: 20, borderRadius: 6,
                background: "var(--accentsoft)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <IconCup />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)" }}>Regular</span>
            </div>
            <Stepper value={qty} onChange={setQty} />
          </div>

          {/* Less Ice */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 20, height: 20, borderRadius: 6,
                background: lessIceQty > 0 ? "var(--bluesoft)" : "var(--bg2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.15s",
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={lessIceQty > 0 ? "var(--blue)" : "var(--text3)"} strokeWidth="2.2" strokeLinecap="round">
                  <line x1="12" y1="2" x2="12" y2="22" />
                  <path d="M17 7l-5 5-5-5" /><path d="M17 17l-5-5-5 5" />
                  <path d="M2 12h20" />
                  <path d="M7 7l-5 5 5 5" /><path d="M17 7l5 5-5 5" />
                </svg>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: lessIceQty > 0 ? "var(--blue)" : "var(--text3)" }}>
                Less Ice
              </span>
            </div>
            <Stepper value={lessIceQty} onChange={setLessIceQty} accent="var(--blue)" />
          </div>

          {/* Subtotal baris ini */}
          {(qty + lessIceQty) > 0 && (
            <div style={{
              marginTop: 2, paddingTop: 8, borderTop: "1px dashed var(--border2)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600 }}>
                {qty + lessIceQty}× subtotal
              </span>
              <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text1)" }}>
                {formatRp(Number(product.price) * (qty + lessIceQty))}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Cart Screen ───────────────────────────────────────────────
function CartScreen({ cart, products, onBack, onSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState("tunai");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);

  // Flatten cart jadi array items untuk ditampilkan & dikirim
  const cartItems = Object.entries(cart).flatMap(([id, e]) => {
    const product = products.find(p => String(p.id) === String(id));
    if (!product) return [];
    const rows = [];
    if (e.qty > 0) rows.push({ product, qty: e.qty, lessIce: false });
    if (e.lessIceQty > 0) rows.push({ product, qty: e.lessIceQty, lessIce: true });
    return rows;
  });

  const grandTotal = cartItems.reduce((s, it) => s + Number(it.product.price) * it.qty, 0);

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(
        `${BASE_URL}/sales`,
        {
          payment_method: paymentMethod,
          items: cartItems.map(it => ({
            product_id: it.product.id,
            qty: it.qty,
            is_less_ice: it.lessIce ? 1 : 0,
          })),
        },
        { headers: authHeader() }
      );
      setDone(res.data?.payload?.data);
    } catch (err) {
      setError(err.response?.data?.payload?.message ?? "Transaksi gagal");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="page" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", gap: 16, padding: "0 24px" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--greensoft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--green)" }}>
          <IconCheck />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: "var(--text1)", marginBottom: 6 }}>Transaksi Berhasil!</div>
          <div style={{ fontSize: 13, color: "var(--text3)" }}>#{String(done.id).padStart(4, "0")} · {paymentMethod.toUpperCase()}</div>
        </div>
        <div style={{ background: "var(--bg0)", borderRadius: 16, padding: "16px 20px", border: "1px solid var(--border)", width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 4 }}>Total Pembayaran</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "var(--accent)" }}>{formatRp(done.grand_total)}</div>
        </div>
        <button onClick={onSuccess} style={{ width: "100%", padding: 15, borderRadius: 15, border: "none", background: "var(--accent)", color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer", fontFamily: "inherit" }}>
          Transaksi Baru
        </button>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="phead">
        <div className="phead-row">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={onBack} style={{ background: "var(--bg0)", border: "1px solid var(--border2)", borderRadius: 9, padding: "6px 8px", cursor: "pointer", color: "var(--text1)", display: "flex" }}>
              <IconBack />
            </button>
            <div>
              <div className="ptitle">Keranjang</div>
              <div className="psub">{cartItems.length} baris pesanan</div>
            </div>
          </div>
        </div>
      </div>

      <div className="pbody" style={{ paddingBottom: 120 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {cartItems.map((it, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "var(--bg0)", borderRadius: 13,
              padding: "12px 14px",
              border: `1px solid ${it.lessIce ? "rgba(37,99,168,0.2)" : "var(--border)"}`,
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: it.lessIce ? "var(--bluesoft)" : "var(--accentsoft)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: it.lessIce ? "var(--blue)" : "var(--accent)",
              }}>
                <IconCup />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text1)" }}>{it.product.name}</span>
                  <SizeChip size={it.product.size} />
                  {it.lessIce && (
                    <span style={{ fontSize: 10, fontWeight: 700, background: "var(--bluesoft)", color: "var(--blue)", padding: "1px 6px", borderRadius: 20 }}>
                      Less Ice
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
                  {it.qty}× · {formatRp(it.product.price)}
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text1)", flexShrink: 0 }}>
                {formatRp(Number(it.product.price) * it.qty)}
              </div>
            </div>
          ))}
        </div>

        {/* Payment method */}
        <div style={{ background: "var(--bg0)", borderRadius: 14, padding: "14px", border: "1px solid var(--border)", marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
            Metode Pembayaran
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {["tunai", "qris"].map(m => (
              <button
                key={m}
                onClick={() => setPaymentMethod(m)}
                style={{
                  flex: 1, padding: "10px 8px", borderRadius: 10, cursor: "pointer",
                  fontFamily: "inherit", fontSize: 13, fontWeight: 700,
                  border: `1.5px solid ${paymentMethod === m ? "var(--accent)" : "var(--border)"}`,
                  background: paymentMethod === m ? "var(--accentsoft)" : "var(--bg1)",
                  color: paymentMethod === m ? "var(--accent)" : "var(--text2)",
                  transition: "all 0.15s",
                }}
              >
                {m === "tunai" ? "💵 Tunai" : "📱 QRIS"}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ padding: "10px 12px", borderRadius: 10, background: "var(--redsoft)", color: "var(--red)", fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
            ⚠ {error}
          </div>
        )}
      </div>

      <div style={{
        position: "fixed", bottom: 65, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 330,
        padding: "5px 10px calc(5px + env(safe-area-inset-bottom))",
        borderTop: "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: "var(--text2)", fontWeight: 600 }}>Total</span>
          <span style={{ fontSize: 20, fontWeight: 900, color: "var(--accent)" }}>{formatRp(grandTotal)}</span>
        </div>
        <button
          onClick={handleCheckout}
          disabled={loading}
          style={{
            width: "100%", padding: 8, borderRadius: 15, border: "none",
            background: "var(--accent)", color: "#fff", fontSize: 15, fontWeight: 900,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "inherit", opacity: loading ? 0.7 : 1,
            boxShadow: "0 4px 14px rgba(196,123,16,0.25)",
          }}
        >
          {loading ? "Memproses..." : `Bayar ${formatRp(grandTotal)}`}
        </button>
      </div>
    </div>
  );
}

// ── Main: KasirPenjaga ────────────────────────────────────────
export default function KasirPenjaga({ setPage }) {
  const { loading: loadingJadwal, adaJadwal, jadwal } = useJadwalCheck();
  const [cart, setCart] = useState({});
  const [showCart, setShowCart] = useState(false);
  const [search, setSearch] = useState("");

  const { data, loading, error } = useApi("/sales/products");
  const products = Array.isArray(data) ? data : [];

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.recipe_name?.toLowerCase().includes(search.toLowerCase())
  );

  function handleChange(product, qty, lessIceQty) {
    setCart(prev => {
      if (qty === 0 && lessIceQty === 0) {
        const next = { ...prev };
        delete next[product.id];
        return next;
      }
      return { ...prev, [product.id]: { qty, lessIceQty } };
    });
  }

  const cartCount = Object.values(cart).reduce((s, e) => s + e.qty + e.lessIceQty, 0);
  const grandTotal = Object.entries(cart).reduce((s, [id, e]) => {
    const p = products.find(p => String(p.id) === String(id));
    return s + (p ? Number(p.price) * (e.qty + e.lessIceQty) : 0);
  }, 0);

  function handleSuccess() {
    setCart({});
    setShowCart(false);
  }

  if (showCart) {
    return (
      <CartScreen
        cart={cart}
        products={products}
        onBack={() => setShowCart(false)}
        onSuccess={handleSuccess}
      />
    );
  }

  return (
    <div className="page">
      {!loadingJadwal && !adaJadwal && (
        <JadwalWarningBanner jadwal={jadwal} />
      )}
      <div className="phead">
        <div className="phead-row">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setPage?.("home")} className="btnBack">
              <IconBack />
            </button>
            <div>
              <div className="ptitle">Kasir</div>
              <div className="psub">Atur jumlah langsung di produk</div>
            </div>
          </div>
          {cartCount > 0 && (
            <button
              onClick={() => setShowCart(true)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 12px", borderRadius: 10, border: "none",
                background: "var(--accentsoft)", color: "var(--accent)",
                fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              <IconCart />
              {cartCount} · {formatRp(grandTotal)}
            </button>
          )}
        </div>
      </div>

      <div className="pbody" style={{ paddingBottom: cartCount > 0 ? 90 : 24 }}>
        <div className="srchbar" style={{ marginBottom: 14 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            placeholder="Cari produk..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text3)", fontSize: 13 }}>Memuat produk...</div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--red)", fontSize: 13 }}>{error}</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text3)", fontSize: 13 }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>☕</div>
            Tidak ada produk ditemukan
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                entry={cart[p.id]}
                onChange={handleChange}
              />
            ))}
          </div>
        )}
      </div>

      {cartCount > 0 && (
        <div style={{
          position: "fixed", bottom: 60, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 320,
          padding: "5px 5px calc(8px + env(safe-area-inset-bottom))",
          backgroundColor: " rgba(0, 0, 0, 0.0)",
        }}>
          <button
            onClick={() => setShowCart(true)}
            style={{
              width: "100%", padding: 10, borderRadius: 14, border: "none",
              background: "var(--accent)", color: "#fff",
              fontSize: 12, fontWeight: 900, cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              boxShadow: "0 4px 14px rgba(196,123,16,0.25)",
            }}
          >
            <span style={{ background: "rgba(255,255,255,0.2)", borderRadius: 8, padding: "2px 10px", fontSize: 13 }}>
              {cartCount} item
            </span>
            <span>Lanjut Bayar</span>
            <span>{formatRp(grandTotal)}</span>
          </button>
        </div>
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
