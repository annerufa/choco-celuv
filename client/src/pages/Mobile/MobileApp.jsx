import { useState, useEffect } from "react";
import "./mobile.css";
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import SetPasswordModal from "./SetPasswordModal";

// icons
import { IconHome, IconStok, IconPenjaga, IconChevron, IconRekap, IconCheck, IconAbsensi, IconProfil } from "./Icons";


// Di PageRenderer:

// PageRenderer:
// Penjaga pages
import HomePenjaga from "./HomePenjaga";
import KasirPenjaga from "./KasirPenjaga";
import ProfilPenjaga from "./ProfilPenjaga";
import DistribusiPenjaga from "./DistribusiPenjaga";
import BuatAdonan from "./BuatAdonan";
import Adonan from "./Adonan";
import StokPage from "./StokPage";
import AbsensiPage from "./AbsensiPage";
import PembelianBooth from "./PembelianBooth";
import BatchDetail from "./BatchDetail";
// kurir
import KurirHome from "./KurirHome";
import PengirimanKurir from "./PengirimanKurir";
import RekapKurir from "./RekapKurir";
import KurirProfil from "./KurirProfil";

// ── Nav config per role ──────────────────────────────────────────────────────
const NAV = {
  kurir: [
    { id: "home", label: "Beranda", Icon: IconHome },
    { id: "pengiriman", label: "Pengiriman", Icon: IconStok },
    { id: "rekap", label: "Rekap", Icon: IconRekap },
    { id: "profil", label: "Profil", Icon: IconProfil },
  ],
  penjaga_booth: [
    { id: "home", label: "Beranda", Icon: IconHome },
    { id: "stok", label: "Stok", Icon: IconStok },
    { id: "kasir", label: "Kasir", Icon: IconPenjaga },
    { id: "absensi", label: "Absensi", Icon: IconAbsensi },
    { id: "profil", label: "Profil", Icon: IconProfil },

  ],
};

// ── Page router ──────────────────────────────────────────────────────────────
function PageRenderer({ role, page, setPage, navigate, pageParams }) {
  if (role === "kurir") {
    if (page === "home") return <KurirHome setPage={setPage} />;
    if (page === "profil") return <KurirProfil />;
    if (page === "pengiriman") return <PengirimanKurir />;
    if (page === "rekap") return <RekapKurir />;
  } else {
    if (page === "home") return <HomePenjaga setPage={setPage} />;
    if (page === "stok") return <StokPage />;
    if (page === "absensi") return <AbsensiPage />;
    if (page === "kasir") return <KasirPenjaga />;
    if (page === "profil") return <ProfilPenjaga />;
    if (page === "buat-adonan") return <BuatAdonan setPage={setPage} />;
    if (page === "distribusi") return <DistribusiPenjaga />;
    if (page === "pembelian") return <PembelianBooth setPage={setPage} />;
    if (page === "adonan") return <Adonan setPage={setPage} navigate={navigate} />;
    if (page === "batch-detail") return <BatchDetail setPage={setPage} batchId={pageParams.batchId} />;
  }

  return <div>Halaman tidak ditemukan: {page}</div>; // debug helper
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function MobileApp() {

  const { user, logout, updateUser } = useAuth();
  const [role, setRole] = useState(user?.role || "");
  const [page, setPage] = useState("home");
  const [pageParams, setPageParams] = useState({});

  const navigate = (pageName, params = {}) => {
    setPage(pageName);
    setPageParams(params);
  };
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
    const penjagaOnlyPages = ["kasir", "stok", "pembelian", "distribusi", "adonan", "absensi"];
    if (role === "kurir" && penjagaOnlyPages.includes(page)) {
      setPage("home");
    }
  }, [role]);

  // console.log("Current role:", role, "Current page:", page);


  if (!role || !NAV[role]) return <div>Loading...</div>;
  return (
    <div className="phone">
      {/* ✅ Modal blokir jika belum set password */}
      {needsPasswordUpdate && (
        <SetPasswordModal onSuccess={handlePasswordUpdated} />
      )}
      {/* SCREEN */}
      <div className="screen" key={`${role}-${page}`}>
        {/* <PageRenderer role={role} page={page} setPage={setPage} /> */}
        <PageRenderer
          role={role}
          page={page}
          setPage={setPage}
          navigate={navigate}
          pageParams={pageParams}
        />
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
