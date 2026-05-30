import { useState, useEffect } from "react";
import { ROLES } from "./roles";
import { IconChevron, IconUser, IconLock, IconMonitor, IconActivity, IconLogout } from "./Icons";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import SetPasswordModal from "./SetPasswordModal";

function getInitial(name) {
  return name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function formatJoinDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
}

export default function ProfilPenjaga({ setPage }) {
  const r = ROLES.kasir;
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [showModal, setShowModal] = useState(false); // ✅ tambah ini
  const { data: profile, loading } = useApi('/karyawan/my-profile');

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const shiftLabel = profile?.shift === 'pagi' ? 'Shift Pagi' : profile?.shift === 'malam' ? 'Shift Malam' : '–';
  const joinDate = formatJoinDate(profile?.created_at);
  const boothName = profile?.booth_name ?? '–';

  return (
    <div className="page">
      {/* ✅ Modal ubah password */}
      {showModal && (
        <SetPasswordModal onSuccess={() => setShowModal(false)} onClose={() => setShowModal(false)} />
      )}
      {/* AVATAR HEADER */}
      <div className="phead-profil">
        <div className="pava-lg" style={{ background: r.avaGrad }}>
          <span>{getInitial(user?.name)}</span>
          <div className="pava-ring" />
        </div>
        <div className="pname">{user?.name}</div>
        <div>
          <span className="prole-badge" style={r.badgeStyle}>{r.badge}</span>
        </div>
        {loading ? (
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 5 }}>Memuat...</div>
        ) : (
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 5 }}>
            {shiftLabel} · {boothName} · Bergabung {joinDate}
          </div>
        )}
      </div>

      <div style={{ height: 12, background: "var(--bg1)" }} />

      <div style={{ padding: "16px 0 0" }}>
        {/* AKUN */}
        <div className="mgrp">
          <div className="mgrp-title">Akun Saya</div>
          <div className="mitems">
            <div className="mrow" onClick={() => setShowModal(true)} style={{ cursor: 'pointer' }}>
              <div className="mic" style={{ background: "var(--greensoft)", color: "var(--green)" }}>
                <IconLock />
              </div>
              <div>
                <div className="mtitle">Ubah Password</div>
                <div className="msub">Keamanan akun</div>
              </div>
              <div className="mchev"><IconChevron /></div>
            </div>
          </div>
        </div>

        {/* KASIR MENU */}
        <div className="mgrp">
          <div className="mgrp-title">Kasir</div>
          <div className="mitems">
            <div className="mrow" onClick={() => setPage('rekap')} style={{ cursor: 'pointer' }}>
              <div className="mic" style={{ background: "var(--greensoft)", color: "var(--green)" }}>
                <IconActivity />
              </div>
              <div>
                <div className="mtitle">Laporan Shift Hari Ini</div>
                <div className="msub">Rekap penjualan saya</div>
              </div>
              <div className="mchev"><IconChevron /></div>
            </div>
          </div>
        </div>

        {/* LAINNYA */}
        <div className="mgrp">
          <div className="mgrp-title">Lainnya</div>
          <div className="mitems">
            <div className="mrow" onClick={handleLogout} style={{ cursor: 'pointer' }}>
              <div className="mic" style={{ background: "var(--redsoft)", color: "var(--red)" }}>
                <IconLogout />
              </div>
              <div>
                <div className="mtitle" style={{ color: "var(--red)" }}>Keluar</div>
              </div>
              <div className="mchev"><IconChevron /></div>
            </div>
          </div>
        </div>

        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}