import { ROLES } from "./roles";
import { IconStok, IconAbsensi, IconKasir, IconClock, IconPin } from "./Icons";

export default function KurirHome({ setPage }) {
  const r = ROLES.kurir;

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
          <div className="hero-lbl">Pengiriman Hari Ini</div>
          <div className="hero-val">15 Pengiriman</div>
          <div className="hero-tag">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            6 terkirim · 9 sedang proses
          </div>
          <div className="hero-minis">
            {/* <div className="hmini">
              <div className="hmini-lbl">Jarak Tempuh</div>
              <div className="hmini-val">34 km</div>
            </div> */}
            <div className="hmini">
              <div className="hmini-lbl">Avg. Waktu</div>
              <div className="hmini-val">22 mnt</div>
            </div>
            <div className="hmini">
              <div className="hmini-lbl">Status</div>
              <div className="hmini-val" >Proses</div>
            </div>
          </div>
        </div>

        {/* PENGIRIMAN AKTIF */}
        {/* <div style={{ marginBottom: "10px" }}>
          <div className="scard-row" onClick={() => setPage("absensi")}>
            <div className="scard-icon" style={{ background: "var(--greensoft)", color: "var(--green)" }}>
              <IconKasir />
            </div>
            <div className="scard-info">
              <div className="sval">Hadir</div>
              <div className="slbl">Status Hari Ini</div>
              <div className="sbadge" style={{ background: "var(--greensoft)", color: "var(--green)" }}>
                07:52 masuk
              </div>
            </div>
          </div>
        </div> */}
        {/* STAT CARDS */}
        <div className="sec-title">PENGIRIMAN BERLANGSUNG</div>
        <div className="act-list">
          <div className="act-item">
            <div className="act-ic" style={{ background: "var(--accentsoft)" }}>
              <IconClock style={{ stroke: "var(--accent)" }} />
            </div>
            <div>
              <div className="act-ttl">
                <p>Pengiriman</p>
                <p>#BR-0003</p>
              </div>
              <hr />
              <div className="act-sub">Booth Kebon Rojo</div>
            </div>
            <div className="act-r">
              <div className="act-amt chip active" style={{ color: "#ffffff)" }}>Sudah sampai</div>
              {/* <div className="act-time">09:35</div> */}
            </div>
          </div>
        </div>
        <div style={{ height: 20 }} />

        {/* AKTIVITAS */}
        <div className="sec-title">PENGIRIMAN SELESAI</div>
        <div className="act-list">
          <div className="act-item">
            <div className="act-ic" style={{ background: "var(--greensoft)" }}>
              <IconPin style={{ stroke: "var(--green)" }} />
            </div>
            <div>
              <div className="act-ttl">Pengiriman #BG-0003 </div>
              <div className="act-sub">Booth Banggle</div>
            </div>
            <div className="act-r">
              <div className="act-amt" style={{ color: "var(--green)" }}>Terkirim</div>
              <div className="act-time">09:22</div>
            </div>
          </div>

          <div className="act-item">
            <div className="act-ic" style={{ background: "var(--accentsoft)" }}>
              <IconPin style={{ stroke: "var(--accent)" }} />
            </div>
            <div>
              <div className="act-ttl">Pengiriman #PL-0003 </div>
              <div className="act-sub">Booth Pasar Legi</div>
            </div>
            <div className="act-r">
              <div className="act-amt" style={{ color: "var(--green)" }}>Terkirim</div>
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
              <div className="act-ttl">Pengiriman #ORD-2843 </div>
              <div className="act-sub">Booth Pasar Legi</div>
            </div>
            <div className="act-r">
              <div className="act-amt" style={{ color: "var(--green)" }}>Terkirim</div>
              <div className="act-time">09:40</div>
            </div>
          </div>
        </div>

        <div style={{ height: 20 }} />
      </div>
    </div >
  );
}
