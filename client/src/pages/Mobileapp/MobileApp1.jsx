import { useState, useEffect } from "react";





// ─── PAGES ───────────────────────────────────────────────────────────────────


function StokPage() {
  const [activeChip, setActiveChip] = useState("Semua");
  const chips = ["Semua", "Minuman", "Makanan", "Bahan Baku"];
  const items = [
    { icon: "☕", name: "Kopi Arabika", sku: "SKU-001", dot: "dot-g", qty: 45, unit: "kg", color: "var(--green)" },
    { icon: "🍵", name: "Kopi Robusta", sku: "SKU-002", dot: "dot-a", qty: 5, unit: "kg", color: "var(--accent)" },
    { icon: "🥛", name: "Susu Full Cream", sku: "SKU-003", dot: "dot-g", qty: 24, unit: "liter", color: "var(--green)" },
    { icon: "🍫", name: "Coklat Bubuk", sku: "SKU-004", dot: "dot-r", qty: 2, unit: "kg", color: "var(--red)" },
    { icon: "🧋", name: "Gula Aren", sku: "SKU-005", dot: "dot-g", qty: 18, unit: "kg", color: "var(--green)" },
    { icon: "🫙", name: "Sirup Vanila", sku: "SKU-006", dot: "dot-a", qty: 4, unit: "btl", color: "var(--accent)" },
  ];
  return (
    <div className="page">
      <div className="phead">
        <div className="phead-row">
          <div><div className="ptitle">Inventori</div><div className="psub">Stok Barang Tersedia</div></div>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--accentsoft)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </div>
        </div>
      </div>
      <div className="pbody">
        <div className="srchbar">
          <IconSearch />
          <input placeholder="Cari produk..." />
        </div>
        <div className="chips">
          {chips.map(c => (
            <div key={c} className={`chip${activeChip === c ? " active" : ""}`} onClick={() => setActiveChip(c)}>{c}</div>
          ))}
        </div>
        <div className="slist">
          {items.map(it => (
            <div className="sitem" key={it.sku}>
              <div className="sthumb">{it.icon}</div>
              <div>
                <div className="sname">{it.name}</div>
                <div className="ssku"><span className={`sdot ${it.dot}`} />{it.sku}</div>
              </div>
              <div className="sright">
                <div className="sqty" style={{ color: it.color }}>{it.qty}</div>
                <div className="sunit">{it.unit}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}

function KasirPage() {
  const [cart, setCart] = useState([
    { id: 1, icon: "☕", name: "Americano", price: 25000, qty: 2 },
    { id: 2, icon: "🧋", name: "Es Kopi Aren", price: 32000, qty: 1 },
    { id: 3, icon: "🍫", name: "Cokelat Panas", price: 28000, qty: 1 },
  ]);

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item =>
      item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item
    ).filter(item => item.qty > 0));
  };

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="page">
      <div className="phead">
        <div className="phead-row">
          <div><div className="ptitle">Kasir</div></div>
          <div style={{ fontSize: 11, color: "var(--text2)", background: "var(--bg3)", padding: "4px 10px", borderRadius: 8, border: "1px solid var(--border)" }}>#INV-0313</div>
        </div>
      </div>
      <div className="pbody">
        <div className="srchbar">
          <IconSearch />
          <input placeholder="Cari atau scan produk..." />
        </div>
        <div className="sec-title">Keranjang</div>
        <div className="klist">
          {cart.map(item => (
            <div className="kitem" key={item.id}>
              <div className="kthumb">{item.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="kname">{item.name}</div>
                <div className="kprice">Rp {item.price.toLocaleString("id-ID")}</div>
              </div>
              <div className="qctrl">
                <div className="qbtn" onClick={() => updateQty(item.id, -1)}>−</div>
                <div className="qnum">{item.qty}</div>
                <div className="qbtn" onClick={() => updateQty(item.id, 1)}>+</div>
              </div>
            </div>
          ))}
        </div>
        <div className="ktotal">
          <div>
            <div style={{ fontSize: 11, color: "var(--text2)" }}>Total Bayar</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "var(--text1)" }}>Rp {total.toLocaleString("id-ID")}</div>
            <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 1 }}>{totalItems} item · diskon 0</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "var(--text2)" }}>Metode</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--accent)", marginTop: 2 }}>QRIS</div>
          </div>
        </div>
        <button className="baybtn">Proses Pembayaran →</button>
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}

function AbsensiPage() {
  const [time, setTime] = useState(() => {
    const n = new Date();
    return String(n.getHours()).padStart(2, "0") + ":" + String(n.getMinutes()).padStart(2, "0");
  });

  useEffect(() => {
    const t = setInterval(() => {
      const n = new Date();
      setTime(String(n.getHours()).padStart(2, "0") + ":" + String(n.getMinutes()).padStart(2, "0"));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const team = [
    { init: "RK", name: "Raka Kurniawan", time: "Masuk 07:52", badge: "Hadir", bg: "rgba(232,160,32,.2)", col: "var(--accent)", badgeBg: "var(--greensoft)", badgeCol: "var(--green)" },
    { init: "DN", name: "Dina Nurhayati", time: "Masuk 08:01", badge: "Hadir", bg: "rgba(91,155,213,.2)", col: "var(--blue)", badgeBg: "var(--greensoft)", badgeCol: "var(--green)" },
    { init: "FH", name: "Farhan Hidayat", time: "Masuk 08:41", badge: "Terlambat", bg: "rgba(155,114,207,.2)", col: "var(--purple)", badgeBg: "var(--accentsoft)", badgeCol: "var(--accent)" },
    { init: "SR", name: "Sari Rahmawati", time: "–", badge: "Izin", bg: "rgba(76,175,122,.2)", col: "var(--green)", badgeBg: "rgba(255,255,255,.06)", badgeCol: "var(--text2)" },
  ];

  return (
    <div className="page">
      <div className="phead">
        <div className="ptitle">Absensi</div>
        <div className="psub">Minggu, 26 April 2026</div>
      </div>
      <div className="pbody">
        <div className="absen-hero">
          <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: ".6px" }}>Jam Sekarang</div>
          <div className="clock">{time}</div>
          <div className="cdate">Minggu, 26 April 2026</div>
          <div className="absen-btns">
            <button className="abtn abtn-in">Absen Masuk</button>
            <button className="abtn abtn-out">Absen Keluar</button>
          </div>
        </div>
        <div className="astats">
          <div className="astat"><div className="astat-val" style={{ color: "var(--green)" }}>12</div><div className="astat-lbl">Hadir</div></div>
          <div className="astat"><div className="astat-val" style={{ color: "var(--accent)" }}>2</div><div className="astat-lbl">Terlambat</div></div>
          <div className="astat"><div className="astat-val" style={{ color: "var(--red)" }}>0</div><div className="astat-lbl">Alpha</div></div>
          <div className="astat"><div className="astat-val" style={{ color: "var(--text2)" }}>2</div><div className="astat-lbl">Izin</div></div>
        </div>
        <div className="sec-title">Daftar Hadir Tim</div>
        <div className="alist">
          {team.map(m => (
            <div className="arow" key={m.init}>
              <div className="aava" style={{ background: m.bg, color: m.col }}>{m.init}</div>
              <div><div className="aname">{m.name}</div><div className="atime">{m.time}</div></div>
              <div className="abadge" style={{ background: m.badgeBg, color: m.badgeCol }}>{m.badge}</div>
            </div>
          ))}
        </div>
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}

function ProfilPage({ role }) {
  const r = ROLES[role];
  return (
    <div className="page">
      <div className="phead-profil">
        <div className="pava-lg" style={{ background: r.avaGrad }}>
          <span>{r.init}</span>
          <div className="pava-ring" />
        </div>
        <div className="pname">{r.name}</div>
        <div><span className="prole-badge" style={r.badgeStyle}>{r.badge}</span></div>
        <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 5 }}>Shift Pagi · Bergabung Jan 2024</div>
      </div>
      <div style={{ height: 12, background: "var(--bg1)" }} />
      <div style={{ padding: "16px 0 0" }}>
        <div className="mgrp">
          <div className="mgrp-title">Akun Saya</div>
          <div className="mitems">
            <div className="mrow">
              <div className="mic" style={{ background: "var(--accentsoft)", color: "var(--accent)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /></svg>
              </div>
              <div><div className="mtitle">Edit Profil</div><div className="msub">Nama, foto, kontak</div></div>
              <div className="mchev"><IconChevron /></div>
            </div>
            <div className="mrow">
              <div className="mic" style={{ background: "var(--greensoft)", color: "var(--green)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              </div>
              <div><div className="mtitle">Ubah Password</div><div className="msub">Keamanan akun</div></div>
              <div className="mchev"><IconChevron /></div>
            </div>
          </div>
        </div>

        {role === "kurir" && (
          <div className="mgrp">
            <div className="mgrp-title">Kurir</div>
            <div className="mitems">
              <div className="mrow">
                <div className="mic" style={{ background: "var(--bluesoft)", color: "var(--blue)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="10" r="3" /><path d="M12 2a8 8 0 0 1 8 8c0 5.5-8 12-8 12S4 15.5 4 10a8 8 0 0 1 8-8z" /></svg>
                </div>
                <div><div className="mtitle">Riwayat Pengiriman</div><div className="msub">248 order selesai</div></div>
                <div className="mchev"><IconChevron /></div>
              </div>
              <div className="mrow">
                <div className="mic" style={{ background: "var(--accentsoft)", color: "var(--accent)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                </div>
                <div><div className="mtitle">Performa Saya</div><div className="msub">Rating 4.9 · 98% tepat waktu</div></div>
                <div className="mchev"><IconChevron /></div>
              </div>
            </div>
          </div>
        )}

        {role === "kasir" && (
          <div className="mgrp">
            <div className="mgrp-title">Kasir</div>
            <div className="mitems">
              <div className="mrow">
                <div className="mic" style={{ background: "var(--accentsoft)", color: "var(--accent)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="2" y1="20" x2="22" y2="20" /></svg>
                </div>
                <div><div className="mtitle">Riwayat Transaksi</div><div className="msub">Hari ini · 31 transaksi</div></div>
                <div className="mchev"><IconChevron /></div>
              </div>
              <div className="mrow">
                <div className="mic" style={{ background: "var(--greensoft)", color: "var(--green)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                </div>
                <div><div className="mtitle">Laporan Shift</div><div className="msub">Rekap penjualan saya</div></div>
                <div className="mchev"><IconChevron /></div>
              </div>
            </div>
          </div>
        )}

        <div className="mgrp">
          <div className="mgrp-title">Lainnya</div>
          <div className="mitems">
            <div className="mrow">
              <div className="mic" style={{ background: "var(--redsoft)", color: "var(--red)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
              </div>
              <div><div className="mtitle" style={{ color: "var(--red)" }}>Keluar</div></div>
              <div className="mchev"><IconChevron /></div>
            </div>
          </div>
        </div>
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}

