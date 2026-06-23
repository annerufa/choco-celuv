import { useState, useEffect } from "react";
import "./mobile.css";
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import SetPasswordModal from "./SetPasswordModal";
import axios from 'axios';
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
import RekapShift from "./RekapShift";
import RekapPage from "./RekapPage";

// PageRenderer — ganti baris rekap:

// di PageRenderer, tambah:
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
function PageRenderer({ role, page, setPage, navigate, pageParams, onSudahAbsen }) {
  if (role === "kurir") {
    if (page === "home") return <KurirHome setPage={setPage} prevPage={pageParams.prevPage ?? 'home'} />;
    if (page === "profil") return <KurirProfil setPage={setPage} />;
    if (page === "pengiriman") return <PengirimanKurir setPage={setPage} />;
    if (page === "rekap") return <RekapKurir setPage={setPage} />;
  } else {
    if (page === "home") return <HomePenjaga setPage={setPage} prevPage={pageParams.prevPage ?? 'home'} />;
    if (page === "stok") return <StokPage setPage={setPage} />;
    if (page === "absensi") return <AbsensiPage setPage={setPage} onSudahAbsen={onSudahAbsen} />;
    if (page === "kasir") return <KasirPenjaga setPage={setPage} />;
    if (page === "profil") return <ProfilPenjaga setPage={setPage} />;  // ✅ tambah setPage
    if (page === "rekap") return <RekapPage setPage={setPage} />;     // ✅ pindah ke sini
    if (page === "buat-adonan") return <BuatAdonan setPage={setPage} />;
    if (page === "distribusi") return <DistribusiPenjaga setPage={setPage} />;
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
  const [sudahAbsen, setSudahAbsen] = useState(null);
  const [dismissedBanner, setDismissedBanner] = useState(false);

  useEffect(() => {
    if (role !== 'penjaga_booth') return;

    // Minta permission notifikasi
    if ('Notification' in window) {
      Notification.requestPermission();
    }

    const checkExpiring = async () => {
      if (Notification.permission !== 'granted') return;
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${BASE_URL}/productions/batches/expiring-soon`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data?.payload?.data ?? [];
        if (data.length > 0) {
          new Notification('⚠️ Adonan Hampir Kadaluarsa', {
            body: `${data.length} adonan akan kadaluarsa dalam 30 menit!`,
            icon: '/icons/icon-192x192.png', // sesuaikan path icon PWA-mu
          });
        }
      } catch (err) { }
    };

    checkExpiring();
    const interval = setInterval(checkExpiring, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [role]);

  useEffect(() => {
    if (role !== 'penjaga_booth') return;

    const checkAbsensi = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${BASE_URL}/attendance/check-today`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // setSudahAbsen(res.data?.data?.sudahAbsen ?? false);
        setSudahAbsen(res.data?.payload?.data?.sudahAbsen ?? false);
      } catch (err) {
        // setSudahAbsen(true); // gagal fetch → jangan ganggu user
        // jangan setSudahAbsen(true) — biarkan banner tetap muncul
        console.warn('Gagal cek absensi:', err.message);
      }
    };

    checkAbsensi();
  }, [role]);

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

  // wrap semua setter dengan log
  const debugSetSudahAbsen = (val) => {
    console.log('setSudahAbsen dipanggil:', val, new Error().stack);
    setSudahAbsen(val);
  };

  const debugSetDismissed = (val) => {
    console.log('setDismissedBanner dipanggil:', val, new Error().stack);
    setDismissedBanner(val);
  };

  if (!role || !NAV[role]) return <div>Loading...</div>;
  return (
    <div className="phone">
      {/* ✅ Modal blokir jika belum set password */}
      {needsPasswordUpdate && (
        <SetPasswordModal onSuccess={handlePasswordUpdated} />
      )}
      {/* Banner reminder absensi */}
      {role === 'penjaga_booth' && sudahAbsen === false && !dismissedBanner && (
        <div
          style={{
            position: 'absolute',
            bottom: 80, // di atas bottom nav
            left: 16,
            right: 16,
            background: '#FEF3C7',
            border: '1px solid #F59E0B',
            borderRadius: 14,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            fontSize: 13,
            color: '#92400E',
            fontWeight: 500,
            zIndex: 100,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}
        >
          <span>⚠️ Kamu belum absen hari ini!</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => setPage('absensi')}
              style={{
                background: '#F59E0B',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '5px 12px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Absen
            </button>
            <button
              onClick={() => setDismissedBanner(true)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: 16,
                cursor: 'pointer',
                color: '#92400E',
                lineHeight: 1,
                padding: '2px 4px',
              }}
            >
              ✕
            </button>
          </div>
        </div>
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
          onSudahAbsen={() => setSudahAbsen(true)}
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
