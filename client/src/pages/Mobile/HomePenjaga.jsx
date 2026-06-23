import { ROLES } from "./roles";
import { IconKasir, IconStok, IconTruck, IconAbsensi, IconFlask, IconBox, IconRekap, IconProfil } from "./Icons";
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';

const ROLE_LABEL = {
  pemilik: 'Pemilik',
  kurir: 'Kurir',
  penjaga_booth: 'Penjaga Booth',
};

export function formatRole(role) {
  return ROLE_LABEL[role] ?? role;
}

function fmt(val) {
  return Number(val ?? 0).toLocaleString('id-ID');
}

function formatJam(dt) {
  if (!dt) return '–';
  return new Date(dt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export default function HomePenjaga({ setPage }) {
  const r = ROLES.kasir;
  const { user } = useAuth();

  const { data: apiData, loading } = useApi('/sales/shift-summary');

  // const summary = Array.isArray(apiData) ? apiData[0] : apiData ?? {};
  const summary = Array.isArray(apiData) ? (apiData[0] ?? {}) : (apiData ?? {});
  const transaksi = Array.isArray(apiData?.transaksi) ? apiData.transaksi : [];
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
          <div className="ava">{getInitial(user?.name)}</div>
        </div>
      </div>

      <div className="pbody">
        {/* HERO */}
        <div className="hero">
          <div className="hero-lbl">Penjualan Hari Ini</div>
          <div className="hero-val">
            {/* {loading ? '...' : `Rp ${fmt(summary.total_penjualan)}`} */}
            {loading ? '...' : `Rp ${fmt(summary.total_penjualan)}`}

          </div>

          <div className="hero-minis">
            <div className="hmini">
              <div className="hmini-lbl">Transaksi</div>
              <div className="hmini-val">{loading ? '–' : (summary.total_transaksi ?? 0)}</div>
            </div>
            <div className="hmini">
              <div className="hmini-lbl">Avg. Order</div>
              <div className="hmini-val">{loading ? '–' : `Rp ${fmt(summary.avg_order)}`}</div>
            </div>
          </div>
        </div>

        {/* MENU GRID */}
        <div className="sec-title">Menu</div>
        <div className="menu-grid">
          {[
            { id: "kasir", label: "Kasir", icon: <IconKasir />, bg: "var(--accentsoft)", color: "var(--accent)" },
            { id: "stok", label: "Stok", icon: <IconStok />, bg: "var(--bluesoft)", color: "var(--blue)" },
            { id: "adonan", label: "Adonan", icon: <IconFlask />, bg: "var(--accentsoft)", color: "var(--accent)" },
            { id: "absensi", label: "Absensi", icon: <IconAbsensi />, bg: "var(--greensoft)", color: "var(--green)" },
            { id: "distribusi", label: "Distribusi", icon: <IconBox />, bg: "var(--purplesoft)", color: "var(--purple)" },
            { id: "pembelian", label: "Pembelian", icon: <IconTruck />, bg: "rgba(212,80,10,0.12)", color: "#D4500A" },
            { id: "rekap", label: "Rekap", icon: <IconRekap />, bg: "var(--accentsoft)", color: "var(--accent)" },
            { id: "profil", label: "Profil", icon: <IconProfil />, bg: "var(--greensoft)", color: "var(--green)" },
          ].map(({ id, label, icon, bg, color }) => (
            <div key={id} className="menu-item" onClick={() => setPage(id)}>
              <div className="menu-icon" style={{ background: bg, color }}>{icon}</div>
              <div className="menu-label">{label}</div>
            </div>

          ))}
        </div>

        {/* AKTIVITAS TERBARU */}
        <div className="sec-title">Aktivitas Terbaru</div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)', fontSize: 13 }}>
            Memuat...
          </div>
        ) : transaksi.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>🧾</div>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>Belum ada transaksi hari ini</div>
          </div>
        ) : (
          <div className="act-list">
            {transaksi.slice(0, 5).map((trx) => (
              <div key={trx.id} className="act-item">
                <div className="act-ic" style={{ background: 'var(--greensoft)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" style={{ width: 15, height: 15 }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="act-ttl">#{String(trx.id).padStart(4, '0')}</div>
                  <div className="act-sub" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {trx.items_label}
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, marginTop: 3, display: 'inline-block',
                    background: trx.payment_method === 'qris' ? 'var(--bluesoft)' : 'var(--greensoft)',
                    color: trx.payment_method === 'qris' ? 'var(--blue)' : 'var(--green)',
                  }}>
                    {trx.payment_method === 'qris' ? 'QRIS' : 'Tunai'}
                  </span>
                </div>
                <div className="act-r">
                  <div className="act-amt" style={{ color: 'var(--green)' }}>+Rp {fmt(trx.grand_total)}</div>
                  <div className="act-time">{formatJam(trx.created_at)}</div>
                </div>
              </div>
            ))}

            {/* Tombol lihat semua kalau lebih dari 5 */}
            {transaksi.length > 5 && (
              <button
                onClick={() => setPage('rekap')}
                style={{
                  width: '100%', padding: '10px', borderRadius: 12,
                  border: '1px solid var(--border2)', background: 'var(--bg0)',
                  color: 'var(--accent)', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit', marginTop: 2,
                }}
              >
                Lihat semua {transaksi.length} transaksi →
              </button>
            )}
          </div>
        )}

        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}