import { ROLES } from "./roles";
import { useState, useEffect } from "react";
import { IconChevron, IconUser, IconLock, IconPin, IconActivity, IconLogout } from "./Icons";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SetPasswordModal from "./SetPasswordModal";

function getInitial(name) {
  return name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export default function KurirProfil({ setPage }) {
  const r = ROLES.kurir;
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [showModal, setShowModal] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }
  return (
    <div className="page">
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
          <span className="prole-badge" style={{ background: "rgba(232,160,32,.15)", color: "#5c2603" }}>🛵 Kurir</span>
        </div>
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

        {/* KURIR MENU */}
        <div className="mgrp">
          <div className="mgrp-title">Kurir</div>
          <div className="mitems">
            <div className="mrow" onClick={() => setPage('rekap')} style={{ cursor: 'pointer' }}>
              <div className="mic" style={{ background: "var(--bluesoft)", color: "var(--blue)" }}>
                <IconPin />
              </div>
              <div>
                <div className="mtitle">Riwayat Pengiriman</div>
              </div>
              <div className="mchev"><IconChevron /></div>
            </div>
          </div>
        </div>

        {/* LAINNYA */}
        <div className="mgrp">
          <div className="mgrp-title">Lainnya</div>
          <div className="mitems">
            <div className="mrow" onClick={handleLogout}>
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