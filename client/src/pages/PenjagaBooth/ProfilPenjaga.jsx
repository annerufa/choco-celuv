import { ROLES } from "./roles";
import { IconChevron, IconUser, IconLock, IconMonitor, IconActivity, IconLogout } from "./Icons";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
function getInitial(name) {
  return name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}
export default function ProfilPenjaga() {
  const r = ROLES.kasir;
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate('/login');
  }
  return (
    <div className="page">
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
        <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 5 }}>
          Shift Pagi · Bergabung Jan 2024
        </div>
      </div>

      <div style={{ height: 12, background: "var(--bg1)" }} />

      <div style={{ padding: "16px 0 0" }}>
        {/* AKUN */}
        <div className="mgrp">
          <div className="mgrp-title">Akun Saya</div>
          <div className="mitems">
            <div className="mrow">
              <div className="mic" style={{ background: "var(--accentsoft)", color: "var(--accent)" }}>
                <IconUser />
              </div>
              <div>
                <div className="mtitle">Edit Profil</div>
                <div className="msub">Nama, foto, kontak</div>
              </div>
              <div className="mchev"><IconChevron /></div>
            </div>
            <div className="mrow">
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
            <div className="mrow">
              <div className="mic" style={{ background: "var(--accentsoft)", color: "var(--accent)" }}>
                <IconMonitor />
              </div>
              <div>
                <div className="mtitle">Riwayat Transaksi</div>
                <div className="msub">Hari ini · 31 transaksi</div>
              </div>
              <div className="mchev"><IconChevron /></div>
            </div>
            <div className="mrow">
              <div className="mic" style={{ background: "var(--greensoft)", color: "var(--green)" }}>
                <IconActivity />
              </div>
              <div>
                <div className="mtitle">Laporan Shift</div>
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
