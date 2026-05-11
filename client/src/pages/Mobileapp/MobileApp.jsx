import { useState, useEffect } from "react";
import "./mobile.css";

// icons
import { IconHome, IconStok, IconKasir, IconActivity, IconAbsensi, IconProfil } from "./Icons";
import { ROLES } from "./roles";

// kurir pages
import KurirHome from "./KurirHome";
import KurirProfil from "./KurirProfil";

// kasir pages
import KasirHome from "./KasirHome";
import KasirKasir from "./KasirKasir";
import KasirProfil from "./KasirProfil";

// shared pages
import StokPage from "./StokPage";
import AbsensiPage from "./AbsensiPage";

// ── Nav config per role ──────────────────────────────────────────────────────
const NAV = {
  kurir: [
    { id: "home", label: "Beranda", Icon: IconHome },
    { id: "stok", label: "Stok", Icon: IconStok },
    { id: "kasir", label: "Distribusi", Icon: IconKasir },
    { id: "absensi", label: "Absensi", Icon: IconAbsensi },
    { id: "profil", label: "Profil", Icon: IconProfil },
  ],
  kasir: [
    { id: "home", label: "Beranda", Icon: IconHome },
    { id: "stok", label: "Stok", Icon: IconStok },
    { id: "penjualan", label: "Penjualan", Icon: IconActivity },
    { id: "absensi", label: "Absensi", Icon: IconAbsensi },
    { id: "profil", label: "Profil", Icon: IconProfil },
  ],
};

// ── Page Header — di luar .screen supaya tidak ikut scroll ───────────────────
function PageHeader({ role, page }) {
  const r = ROLES[role];

  // Profil punya header sendiri (phead-profil) yang lebih besar,
  // jadi kita skip — KurirProfil/KasirProfil render sendiri di atas .pbody
  if (page === "profil") return null;

  const titles = {
    home: { title: `Hai, ${r.name.split(" ")[0]} 👋`, sub: r.sub },
    stok: { title: "Stok Barang", sub: "Kelola inventaris" },
    absensi: { title: "Absensi", sub: "Kehadiran karyawan" },
    kasir: { title: "Kasir", sub: "Transaksi penjualan" },
  };

  const h = titles[page];
  if (!h) return null;

  return (
    <div className="phead">
      <div className="phead-row">
        <div>
          <div className="ptitle">{h.title}</div>
          <div className="psub">{h.sub}</div>
        </div>
        {/* Avatar hanya di halaman home */}
        {page === "home" && (
          <div className="ava" style={{ background: r.avaGrad, color: "#0e0a07" }}>
            {r.init}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page router ──────────────────────────────────────────────────────────────
function PageRenderer({ role, page, setPage }) {
  if (page === "stok") return <StokPage />;
  if (page === "absensi") return <AbsensiPage />;

  if (role === "kurir") {
    if (page === "home") return <KurirHome setPage={setPage} />;
    if (page === "profil") return <KurirProfil />;
  }

  if (role === "kasir") {
    if (page === "home") return <KasirHome setPage={setPage} />;
    if (page === "kasir") return <KasirKasir />;
    if (page === "profil") return <KasirProfil />;
  }

  return null;
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function MobileApp() {
  const [role, setRole] = useState("kurir");
  const [page, setPage] = useState("home");

  useEffect(() => {
    if (role === "kurir" && page === "kasir") setPage("home");
  }, [role]);

  return (
    <div className="appWrap">
      <div className="phone">

        {/* HEADER — fixed di atas, tidak ikut scroll */}
        {/* <PageHeader role={role} page={page} /> */}

        {/* SCREEN — hanya konten yang scroll */}
        <div className="screen" key={`${role}-${page}`}>
          <PageRenderer role={role} page={page} setPage={setPage} />
        </div>

        {/* BOTTOM NAV — fixed di bawah, tidak ikut scroll */}
        <nav className="botnav">
          {NAV[role].map(({ id, label, Icon }) => (
            <div
              key={id}
              className={`ni${page === id ? " active" : ""}`}
              onClick={() => setPage(id)}
            >
              <Icon />
              <span>{label}</span>
              <div className="ni-pip" />
            </div>
          ))}
        </nav>

      </div>
    </div>
  );
}
