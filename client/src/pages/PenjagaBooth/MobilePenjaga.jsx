import { useState, useEffect } from "react";
import "./mobile.css";
import { useAuth } from '../../context/AuthContext'; // tambah ini
import { useNavigate } from 'react-router-dom'; // tambah ini

// icons
import { IconHome, IconStok, IconPenjaga, IconAbsensi, IconProfil } from "./Icons";


// Penjaga pages
import HomePenjaga from "./HomePenjaga";
import KasirPenjaga from "./KasirPenjaga";
import ProfilPenjaga from "./ProfilPenjaga";

// shared pages
import StokPage from "./StokPage";
import AbsensiPage from "./AbsensiPage";

// ── Nav config per role ──────────────────────────────────────────────────────
const NAV = {
  kurir: [
    { id: "home", label: "Beranda", Icon: IconHome },
    { id: "pengiriman", label: "Pengiriman", Icon: IconStok },
    { id: "absensi", label: "Absensi", Icon: IconAbsensi },
    { id: "profil", label: "Profil", Icon: IconProfil },
  ],
  penjaga_booth: [
    { id: "home", label: "Beranda", Icon: IconHome },
    { id: "stok", label: "Stok", Icon: IconStok },
    { id: "kasir", label: "Penjaga", Icon: IconPenjaga },
    { id: "absensi", label: "Absensi", Icon: IconAbsensi },
    { id: "profil", label: "Profil", Icon: IconProfil },
  ],
};

// ── Page router ──────────────────────────────────────────────────────────────
function PageRenderer({ role, page, setPage }) {
  if (page === "stok") return <StokPage />;
  if (page === "absensi") return <AbsensiPage />;

  if (page === "home") return <HomePenjaga setPage={setPage} />;
  if (page === "kasir") return <KasirPenjaga />;
  if (page === "profil") return <ProfilPenjaga />;

  return null;
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function MobilePenjaga() {
  const { user, logout } = useAuth();       // tambah ini
  const navigate = useNavigate();     // tambah ini
  const [role, setRole] = useState(user?.role || "");
  const [page, setPage] = useState("home");


  function handleLogout() {           // tambah ini
    logout();
    navigate('/login');
  }

  // Jika role kurir & sedang di halaman Penjaga-only → redirect ke home
  useEffect(() => {
    if (user?.role) setRole(user?.role);
  }, [user]);

  useEffect(() => {
    if (page === "penjaga_booth") setPage("home");
  }, [role]);

  console.log("Current role:", role, "Current page:", page);
  return (
    <div className="phone">

      {/* SCREEN */}
      <div className="screen" key={`${role}-${page}`}>
        <PageRenderer role={role} page={page} setPage={setPage} />
      </div>

      {/* BOTTOM NAV */}
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
  );
}
