import { useState, useEffect } from "react";
import "./mobile.css";
import { useAuth } from '../../context/AuthContext'; // tambah ini
import { useNavigate } from 'react-router-dom'; // tambah ini
import SetPasswordModal from "./SetPasswordModal";
import PengirimanKurir from "./PengirimanKurir";
// icons
import { IconHome, IconStok, IconPenjaga, IconChevron, IconCheck, IconAbsensi, IconProfil } from "./Icons";


// Penjaga pages
import HomePenjaga from "./HomePenjaga";
import KasirPenjaga from "./KasirPenjaga";
import ProfilPenjaga from "./ProfilPenjaga";
// kurir
import KurirHome from "./KurirHome";
// shared pages
import StokPage from "./StokPage";
import AbsensiPage from "./AbsensiPage";

// Di PageRenderer tambah:
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
    { id: "pembelian", label: "Beli", Icon: IconChevron },
    { id: "distribusi", label: "Cek", Icon: IconCheck },
    { id: "kasir", label: "Kasir", Icon: IconPenjaga },
    { id: "absensi", label: "Absensi", Icon: IconAbsensi },
    { id: "profil", label: "Profil", Icon: IconProfil },
  ],
};

// ── Page router ──────────────────────────────────────────────────────────────
function PageRenderer({ role, page, setPage }) {
  if (page === "home") {
    if (role === "kurir") return <KurirHome setPage={setPage} />;
    return <HomePenjaga setPage={setPage} />;
  }
  if (page === "stok") return <StokPage />;
  if (page === "absensi") return <AbsensiPage />;

  if (page === "home") return <HomePenjaga setPage={setPage} />;
  if (page === "kasir") return <KasirPenjaga />;
  if (page === "profil") return <ProfilPenjaga />;

  if (role === "kurir" && page === "pengiriman") return <PengirimanKurir />;
  return null;
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function MobileApp() {

  const { user, logout, updateUser } = useAuth(); // pastikan setUser ada di context
  const navigate = useNavigate();
  const [role, setRole] = useState(user?.role || "");
  const [page, setPage] = useState("home");

  // ✅ Cek is_update — tampilkan modal jika belum diupdate
  const needsPasswordUpdate = user?.is_update === 0 || user?.is_update === false;

  function handlePasswordUpdated() {
    updateUser({ is_update: 1 });
  }

  function handleLogout() {           // tambah ini
    logout();
    navigate('/login');
  }

  // Jika role kurir & sedang di halaman Penjaga-only → redirect ke home
  useEffect(() => {
    if (user?.role) setRole(user?.role);
  }, [user]);

  useEffect(() => {
    const penjagaOnlyPages = ["kasir", "stok", "pembelian", "distribusi"];
    if (role === "kurir" && penjagaOnlyPages.includes(page)) {
      setPage("home");
    }
  }, [role]);

  // console.log("Current role:", role, "Current page:", page);
  // Di return MobilePenjaga, guard dulu:
  if (!role || !NAV[role]) return <div>Loading...</div>;
  return (
    <div className="phone">
      {/* ✅ Modal blokir jika belum set password */}
      {needsPasswordUpdate && (
        <SetPasswordModal onSuccess={handlePasswordUpdated} />
      )}
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
