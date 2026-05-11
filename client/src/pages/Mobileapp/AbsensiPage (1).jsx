import { useState, useEffect } from "react";

const TEAM = [
  {
    init: "RK", name: "Raka Kurniawan", time: "Masuk 07:52",
    badge: "Hadir",
    avaBg: "rgba(232,160,32,.2)", avaCol: "var(--accent)",
    badgeBg: "var(--greensoft)",  badgeCol: "var(--green)",
  },
  {
    init: "DN", name: "Dina Nurhayati", time: "Masuk 08:01",
    badge: "Hadir",
    avaBg: "rgba(91,155,213,.2)", avaCol: "var(--blue)",
    badgeBg: "var(--greensoft)",  badgeCol: "var(--green)",
  },
  {
    init: "FH", name: "Farhan Hidayat", time: "Masuk 08:41",
    badge: "Terlambat",
    avaBg: "rgba(155,114,207,.2)", avaCol: "var(--purple)",
    badgeBg: "var(--accentsoft)", badgeCol: "var(--accent)",
  },
  {
    init: "SR", name: "Sari Rahmawati", time: "–",
    badge: "Izin",
    avaBg: "rgba(76,175,122,.2)", avaCol: "var(--green)",
    badgeBg: "rgba(255,255,255,.06)", badgeCol: "var(--text2)",
  },
];

function getNow() {
  const n = new Date();
  return (
    String(n.getHours()).padStart(2, "0") + ":" +
    String(n.getMinutes()).padStart(2, "0")
  );
}

export default function AbsensiPage() {
  const [time, setTime] = useState(getNow);

  useEffect(() => {
    const t = setInterval(() => setTime(getNow()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="page">
      {/* HEADER */}
      <div className="phead">
        <div className="ptitle">Absensi</div>
        <div className="psub">Minggu, 26 April 2026</div>
      </div>

      <div className="pbody">
        {/* CLOCK CARD */}
        <div className="absen-hero">
          <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: ".6px" }}>
            Jam Sekarang
          </div>
          <div className="clock">{time}</div>
          <div className="cdate">Minggu, 26 April 2026</div>
          <div className="absen-btns">
            <button className="abtn abtn-in">Absen Masuk</button>
            <button className="abtn abtn-out">Absen Keluar</button>
          </div>
        </div>

        {/* STATS */}
        <div className="astats">
          <div className="astat">
            <div className="astat-val" style={{ color: "var(--green)" }}>12</div>
            <div className="astat-lbl">Hadir</div>
          </div>
          <div className="astat">
            <div className="astat-val" style={{ color: "var(--accent)" }}>2</div>
            <div className="astat-lbl">Terlambat</div>
          </div>
          <div className="astat">
            <div className="astat-val" style={{ color: "var(--red)" }}>0</div>
            <div className="astat-lbl">Alpha</div>
          </div>
          <div className="astat">
            <div className="astat-val" style={{ color: "var(--text2)" }}>2</div>
            <div className="astat-lbl">Izin</div>
          </div>
        </div>

        {/* TEAM LIST */}
        <div className="sec-title">Daftar Hadir Tim</div>
        <div className="alist">
          {TEAM.map(m => (
            <div className="arow" key={m.init}>
              <div className="aava" style={{ background: m.avaBg, color: m.avaCol }}>
                {m.init}
              </div>
              <div>
                <div className="aname">{m.name}</div>
                <div className="atime">{m.time}</div>
              </div>
              <div className="abadge" style={{ background: m.badgeBg, color: m.badgeCol }}>
                {m.badge}
              </div>
            </div>
          ))}
        </div>

        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}
