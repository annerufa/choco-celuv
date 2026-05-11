import { ROLES } from "./roles";
import { IconStok, IconAbsensi, IconClock, IconPin } from "./Icons";

export default function KurirHome({ setPage }) {
  const r = ROLES.kurir;

  return (
    <div className="page">
      <div className="pbody">

        {/* HERO */}
        <div className="hero">
          <div className="hero-lbl">Pengiriman Hari Ini</div>
          <div className="hero-val">18 Order</div>
          <div className="hero-tag">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            6 terkirim · 12 pending
          </div>
          <div className="hero-minis">
            <div className="hmini">
              <div className="hmini-lbl">Jarak Tempuh</div>
              <div className="hmini-val">34 km</div>
            </div>
            <div className="hmini">
              <div className="hmini-lbl">Avg. Waktu</div>
              <div className="hmini-val">22 mnt</div>
            </div>
            <div className="hmini">
              <div className="hmini-lbl">Status</div>
              <div className="hmini-val" style={{ color: "var(--green)" }}>Aktif</div>
            </div>
          </div>
        </div>

        {/* STAT CARDS */}
        <div className="sgrid">
          <div className="scard" onClick={() => setPage("stok")}>
            <div className="sicon" style={{ background: "var(--bluesoft)", color: "var(--blue)" }}>
              <IconStok />
            </div>
            <div className="sval">47</div>
            <div className="slbl">Stok Barang</div>
            <div className="sbadge" style={{ background: "var(--accentsoft)", color: "var(--accent)" }}>
              3 menipis
            </div>
          </div>
          <div className="scard" onClick={() => setPage("absensi")}>
            <div className="sicon" style={{ background: "var(--greensoft)", color: "var(--green)" }}>
              <IconAbsensi />
            </div>
            <div className="sval">Hadir</div>
            <div className="slbl">Status Hari Ini</div>
            <div className="sbadge" style={{ background: "var(--greensoft)", color: "var(--green)" }}>
              07:52 masuk
            </div>
          </div>
        </div>

        {/* AKTIVITAS */}
        <div className="sec-title">Aktivitas Terbaru</div>
        <div className="act-list">
          <div className="act-item">
            <div className="act-ic" style={{ background: "var(--greensoft)" }}>
              <IconClock style={{ stroke: "var(--green)" }} />
            </div>
            <div>
              <div className="act-ttl">Order #ORD-2841 Terkirim</div>
              <div className="act-sub">Jl. Merdeka No.12</div>
            </div>
            <div className="act-r">
              <div className="act-amt" style={{ color: "var(--green)" }}>Selesai</div>
              <div className="act-time">09:22</div>
            </div>
          </div>

          <div className="act-item">
            <div className="act-ic" style={{ background: "var(--accentsoft)" }}>
              <IconPin style={{ stroke: "var(--accent)" }} />
            </div>
            <div>
              <div className="act-ttl">Order #ORD-2842 Dalam Perjalanan</div>
              <div className="act-sub">Jl. Pahlawan No.5</div>
            </div>
            <div className="act-r">
              <div className="act-amt" style={{ color: "var(--accent)" }}>Proses</div>
              <div className="act-time">09:35</div>
            </div>
          </div>

          <div className="act-item">
            <div className="act-ic" style={{ background: "var(--bluesoft)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" style={{ width: 15, height: 15 }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div>
              <div className="act-ttl">Order #ORD-2843 Pending</div>
              <div className="act-sub">Jl. Sudirman No.88</div>
            </div>
            <div className="act-r">
              <div className="act-amt" style={{ color: "var(--blue)" }}>Antri</div>
              <div className="act-time">09:40</div>
            </div>
          </div>
        </div>

        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}
