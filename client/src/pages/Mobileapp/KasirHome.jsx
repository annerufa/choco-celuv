import { ROLES } from "./roles";
import { IconKasir, IconStok, IconCheck, IconWarn } from "./Icons";

export default function KasirHome({ setPage }) {
  const r = ROLES.kasir;

  return (
    <div className="page">
      {/* HEADER */}
      <div className="phead">
        <div className="phead-row">
          <div>
            <div className="ptitle">Hai, {r.name.split(" ")[0]} 👋</div>
            <div className="psub">{r.sub}</div>
          </div>
          <div className="ava" style={{ background: r.avaGrad, color: "#0e0a07" }}>
            {r.init}
          </div>
        </div>
      </div>

      <div className="pbody">
        {/* HERO */}
        <div className="hero">
          <div className="hero-lbl">Penjualan Hari Ini</div>
          <div className="hero-val">Rp 3,85jt</div>
          <div className="hero-tag">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            +9.3% vs kemarin
          </div>
          <div className="hero-minis">
            <div className="hmini">
              <div className="hmini-lbl">Transaksi</div>
              <div className="hmini-val">31</div>
            </div>
            <div className="hmini">
              <div className="hmini-lbl">Avg. Order</div>
              <div className="hmini-val">124rb</div>
            </div>
            <div className="hmini">
              <div className="hmini-lbl">QRIS</div>
              <div className="hmini-val">68%</div>
            </div>
          </div>
        </div>

        {/* STAT CARDS */}
        <div className="sgrid">
          <div className="scard" onClick={() => setPage("kasir")}>
            <div className="sicon" style={{ background: "var(--accentsoft)", color: "var(--accent)" }}>
              <IconKasir />
            </div>
            <div className="sval">31</div>
            <div className="slbl">Transaksi</div>
            <div className="sbadge" style={{ background: "var(--greensoft)", color: "var(--green)" }}>
              aktif
            </div>
          </div>
          <div className="scard" onClick={() => setPage("stok")}>
            <div className="sicon" style={{ background: "var(--bluesoft)", color: "var(--blue)" }}>
              <IconStok />
            </div>
            <div className="sval">142</div>
            <div className="slbl">Produk</div>
            <div className="sbadge" style={{ background: "var(--accentsoft)", color: "var(--accent)" }}>
              8 menipis
            </div>
          </div>
        </div>

        {/* AKTIVITAS */}
        <div className="sec-title">Aktivitas Terbaru</div>
        <div className="act-list">
          <div className="act-item">
            <div className="act-ic" style={{ background: "var(--greensoft)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" style={{ width: 15, height: 15 }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <div className="act-ttl">Transaksi #INV-0312</div>
              <div className="act-sub">QRIS · 3 item</div>
            </div>
            <div className="act-r">
              <div className="act-amt" style={{ color: "var(--green)" }}>+Rp 95.000</div>
              <div className="act-time">09:38</div>
            </div>
          </div>

          <div className="act-item">
            <div className="act-ic" style={{ background: "var(--accentsoft)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" style={{ width: 15, height: 15 }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <div className="act-ttl">Stok Menipis</div>
              <div className="act-sub">Coklat Bubuk — sisa 2 kg</div>
            </div>
            <div className="act-r">
              <div className="act-amt" style={{ color: "var(--accent)" }}>Peringatan</div>
              <div className="act-time">09:15</div>
            </div>
          </div>

          <div className="act-item">
            <div className="act-ic" style={{ background: "var(--greensoft)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" style={{ width: 15, height: 15 }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <div className="act-ttl">Transaksi #INV-0311</div>
              <div className="act-sub">Tunai · 2 item</div>
            </div>
            <div className="act-r">
              <div className="act-amt" style={{ color: "var(--green)" }}>+Rp 50.000</div>
              <div className="act-time">09:02</div>
            </div>
          </div>
        </div>

        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}
