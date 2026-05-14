import { ROLES } from "./roles";
import { IconChevron, IconUser, IconLock, IconPin, IconActivity, IconLogout } from "./Icons";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function KurirProfil() {
  const r = ROLES.kurir;
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
          <span>{r.init}</span>
          <div className="pava-ring" />
        </div>
        <div className="pname">{r.name}</div>
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

        {/* KURIR MENU */}
        <div className="mgrp">
          <div className="mgrp-title">Kurir</div>
          <div className="mitems">
            <div className="mrow">
              <div className="mic" style={{ background: "var(--bluesoft)", color: "var(--blue)" }}>
                <IconPin />
              </div>
              <div>
                <div className="mtitle">Riwayat Pengiriman</div>
                <div className="msub">248 order selesai</div>
              </div>
              <div className="mchev"><IconChevron /></div>
            </div>
            <div className="mrow">
              <div className="mic" style={{ background: "var(--accentsoft)", color: "var(--accent)" }}>
                <IconActivity />
              </div>
              <div>
                <div className="mtitle">Akurasi Pengiriman Saya</div>
                <div className="msub">Rating 4.9 · 98% kecocokan barang</div>
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
                <div className="mtitle" style={{ color: "var(--red)" }} >Keluar</div>
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
