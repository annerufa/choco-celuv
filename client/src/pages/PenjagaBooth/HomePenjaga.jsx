import { ROLES } from "./roles";
import { IconKasir, IconStok, IconCheck, IconWarn } from "./Icons";
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';

const ROLE_LABEL = {
  pemilik: 'Pemilik',
  kurir: 'Kurir',
  penjaga_booth: 'Penjaga Booth',
};
const statusVariant = {
  hadir: { cls: 'success', label: 'Hadir' },
  terlambat: { cls: 'warning', label: 'Terlambat' },
  absen: { cls: 'danger', label: 'Absen' },
  izin: { cls: 'accent', label: 'Izin' },
  sakit: { cls: 'brown', label: 'Sakit' },
  libur: { cls: 'grey', label: 'Libur' },
};
export function formatRole(role) {
  return ROLE_LABEL[role] ?? role;
}

function formatJam(dt) {
  if (!dt) return '–';
  if (typeof dt === 'string' && dt.length <= 8 && dt.includes(':')) {
    return dt.slice(0, 5);
  }
  return new Date(dt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export default function HomePenjaga({ setPage }) {
  const r = ROLES.kasir;
  const { user, logout } = useAuth();

  const {
    data: openAbsen,
    loading: loadingOpen,
    fetchData: refetchOpen,
  } = useApi('/attendance/open');
  // console.log('openAbsen:', openAbsen);
  const rawOpen = openAbsen; // ini array [] atau [{ ... }]
  const absenHariIni = Array.isArray(rawOpen) ? (rawOpen[0] ?? null) : rawOpen ?? null;
  // console.log("status: ", absenHariIni.status);

  const getInitial = (name) =>
    name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  return (
    <div className="page">
      {/* HEADER */}
      <div className="phead">
        <div className="phead-row">
          <div>
            <div className="ptitle">Hai, {user?.name.split(" ")[0]} 👋</div>
            <div className="psub" style={{ textTransform: 'capitalize' }}>{formatRole(user?.role)}</div>
          </div>
          <div className="ava" style={{ background: r.avaGrad, color: "#0e0a07" }}>
            {getInitial(user?.name)}
          </div>
        </div>
      </div>

      <div className="pbody">
        {/* HERO */}
        <div className="hero">
          <div className="hero-lbl">Penjualan Hari Ini</div>
          <div className="hero-val">Rp 62.000</div>
          <div className="hero-tag">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            +9.3% vs kemarin
          </div>
          <div className="hero-minis">
            <div className="hmini">
              <div className="hmini-lbl">Transaksi</div>
              <div className="hmini-val">3</div>
            </div>
            <div className="hmini">
              <div className="hmini-lbl">Avg. Order</div>
              <div className="hmini-val">12rb</div>
            </div>
            {/* <div className="hmini">
              <div className="hmini-lbl">QRIS</div>
              <div className="hmini-val">68%</div>
            </div> */}
          </div>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <div className="scard-row">
            <div className="scard-icon" style={{ background: openAbsen ? "var(--greensoft)" : "var(--bg2)", color: openAbsen ? "var(--green)" : "var(--text3)" }}>
              <IconKasir />
            </div>
            <div className="scard-info">
              {absenHariIni ? (
                <>
                  <div className="sval" style={{ fontSize: 14 }}>Absen hari ini</div>
                  <div style={{ marginTop: 4 }}>
                    <span style={{ padding: '4px', color: 'var(--accent)', fontSize: 12 }}>{(absenHariIni.status)}   </span>
                    <span style={{
                      background: 'var(--greensoft)', color: 'var(--green)',
                      fontSize: 11, fontWeight: 700, padding: '2px 8px',
                      borderRadius: 20, display: 'inline-block'
                    }}>
                      {formatJam(absenHariIni.clock_in)}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="slbl">Hari ini</div>
                  <div className="sval" style={{ fontSize: 14 }}>Belum absen masuk</div>
                </>
              )}
            </div>

            {/* Tombol absensi — selalu muncul */}
            <button
              onClick={() => setPage("absensi")}
              style={{
                marginLeft: 'auto',
                flexShrink: 0,
                padding: '7px 13px',
                borderRadius: '10px',
                border: 'none',
                background: 'var(--greensoft)',
                color: 'var(--green)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Absensi
            </button>
          </div>
        </div>
        {/* STAT CARDS */}
        <div className="sgrid">
          <div className="scard" onClick={() => setPage("kasir")}>
            <div className="sicon" style={{ background: "var(--accentsoft)", color: "var(--accent)" }}>
              <IconKasir />
            </div>
            <div className="sval">31</div>
            <div className="slbl">Transaksi</div>
            <div className="sbadge" style={{ background: "var(--greensoft)", color: "var(--green)" }}>
              aktif
            </div>
          </div>
          <div className="scard" onClick={() => setPage("stok")}>
            <div className="sicon" style={{ background: "var(--bluesoft)", color: "var(--blue)" }}>
              <IconStok />
            </div>
            <div className="sval">142</div>
            <div className="slbl">Produk</div>
            <div className="sbadge" style={{ background: "var(--accentsoft)", color: "var(--accent)" }}>
              8 menipis
            </div>
          </div>
        </div>

        {/* AKTIVITAS */}
        <div className="sec-title">Aktivitas Terbaru</div>
        <div className="act-list">
          <div className="act-item">
            <div className="act-ic" style={{ background: "var(--greensoft)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" style={{ width: 15, height: 15 }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <div className="act-ttl">Transaksi #INV-0312</div>
              <div className="act-sub">QRIS · 3 item</div>
            </div>
            <div className="act-r">
              <div className="act-amt" style={{ color: "var(--green)" }}>+Rp 95.000</div>
              <div className="act-time">09:38</div>
            </div>
          </div>

          <div className="act-item">
            <div className="act-ic" style={{ background: "var(--accentsoft)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" style={{ width: 15, height: 15 }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <div className="act-ttl">Stok Menipis</div>
              <div className="act-sub">Coklat Bubuk — sisa 2 kg</div>
            </div>
            <div className="act-r">
              <div className="act-amt" style={{ color: "var(--accent)" }}>Peringatan</div>
              <div className="act-time">09:15</div>
            </div>
          </div>

          <div className="act-item">
            <div className="act-ic" style={{ background: "var(--greensoft)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" style={{ width: 15, height: 15 }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <div className="act-ttl">Transaksi #INV-0311</div>
              <div className="act-sub">Tunai · 2 item</div>
            </div>
            <div className="act-r">
              <div className="act-amt" style={{ color: "var(--green)" }}>+Rp 50.000</div>
              <div className="act-time">09:02</div>
            </div>
          </div>
        </div>

        <div style={{ height: 20 }} />
      </div>
    </div >
  );
}
