import { useState, useEffect } from "react";
import "./mobile2.css";
import { useAuth } from '../../context/AuthContext'; // tambah ini
import { useNavigate } from 'react-router-dom'; // tambah ini

// icons
import { IconHome, IconStok, IconKasir, IconAbsensi, IconProfil } from "./Icons";

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
    { id: "pengiriman", label: "Pengiriman", Icon: IconStok },
    { id: "absensi", label: "Absensi", Icon: IconAbsensi },
    { id: "profil", label: "Profil", Icon: IconProfil },
  ],
  kasir: [
    { id: "home", label: "Beranda", Icon: IconHome },
    { id: "stok", label: "Stok", Icon: IconStok },
    { id: "kasir", label: "Kasir", Icon: IconKasir },
    { id: "absensi", label: "Absensi", Icon: IconAbsensi },
    { id: "profil", label: "Profil", Icon: IconProfil },
  ],
};

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
  const { user, logout } = useAuth();       // tambah ini
  const navigate = useNavigate();     // tambah ini
  const [role, setRole] = useState(user?.role || "");
  const [page, setPage] = useState("home");


  function handleLogout() {           // tambah ini
    logout();
    navigate('/login');
  }

  // Jika role kurir & sedang di halaman kasir-only → redirect ke home
  useEffect(() => {
    if (user?.role) setRole(user?.role);
  }, [user]);

  useEffect(() => {
    if (role === "kurir" && page === "kasir") setPage("home");
  }, [role]);

  const handleRoleChange = (r) => {
    setRole(r);
    setPage("home");
  };

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
