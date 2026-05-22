import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';

// ── Status config ────────────────────────────────────────────────────────────
const STATUS = {
  menunggu_pickup: {
    label: 'Menunggu Pickup',
    color: 'var(--text3)',
    bg: 'var(--bg2)',
    dot: '#aaa',
  },
  dalam_perjalanan: {
    label: 'Dalam Perjalanan',
    color: 'var(--blue)',
    bg: 'var(--bluesoft)',
    dot: 'var(--blue)',
  },
  sudah_sampai: {
    label: 'Sudah Sampai',
    color: 'var(--accent)',
    bg: 'var(--accentsoft)',
    dot: 'var(--accent)',
  },
  terverifikasi: {
    label: 'Terverifikasi',
    color: 'var(--green)',
    bg: 'var(--greensoft)',
    dot: 'var(--green)',
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function getInitial(name) {
  return name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

// ── Delivery Card ────────────────────────────────────────────────────────────
function DeliveryCard({ delivery, onPickup, onSampai }) {
  const st = STATUS[delivery.status] ?? STATUS.menunggu_pickup;
  const totalProduk = (delivery.items ?? []).length;

  return (
    <div style={{
      background: 'var(--bg0)',
      borderRadius: 16,
      border: '1px solid var(--border)',
      boxShadow: '0 1px 4px rgba(100,70,20,0.06)',
      overflow: 'hidden',
      marginBottom: 10,
    }}>
      {/* Top row */}
      <div style={{ padding: '13px 14px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Icon */}
        <div style={{
          width: 40, height: 40, borderRadius: 11,
          background: st.bg, display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0,
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke={st.color} strokeWidth="2"
            style={{ width: 18, height: 18 }}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)' }}>
            {delivery.booth_name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
            {delivery.delivery_code ?? `#DEL-${delivery.id}`}
          </div>
        </div>

        {/* Status badge */}
        <div style={{
          fontSize: 10, fontWeight: 700, padding: '3px 9px',
          borderRadius: 20, background: st.bg, color: st.color,
          display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%',
            background: st.dot, display: 'inline-block',
          }} />
          {st.label}
        </div>
      </div>

      {/* Item list */}
      <div style={{
        margin: '0 14px 10px',
        background: 'var(--bg1)',
        borderRadius: 10,
        padding: '8px 10px',
        border: '1px solid var(--border)',
      }}>
        {(delivery.items ?? []).map((item, idx) => (
          <div key={idx} style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center',
            padding: '4px 0',
            borderBottom: idx < delivery.items.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>{item.name}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)' }}>
              {item.qty} {item.unit ?? 'pcs'}
            </span>
          </div>
        ))}
        <div style={{
          paddingTop: 6, marginTop: 2,
          fontSize: 11, color: 'var(--text3)', fontWeight: 600,
        }}>
          {totalProduk} produk
        </div>
      </div>

      {/* Action button */}
      {delivery.status === 'menunggu_pickup' && (
        <div style={{ padding: '0 14px 13px' }}>
          <button
            onClick={() => onPickup(delivery.id)}
            style={{
              width: '100%', padding: '10px', borderRadius: 11,
              border: 'none', background: 'var(--blue)', color: '#fff',
              fontSize: 13, fontWeight: 800, cursor: 'pointer',
              fontFamily: 'inherit',
            }}>
            Pickup — Mulai Kirim
          </button>
        </div>
      )}

      {delivery.status === 'dalam_perjalanan' && (
        <div style={{ padding: '0 14px 13px' }}>
          <button
            onClick={() => onSampai(delivery.id)}
            style={{
              width: '100%', padding: '10px', borderRadius: 11,
              border: 'none', background: 'var(--accent)', color: '#fff',
              fontSize: 13, fontWeight: 800, cursor: 'pointer',
              fontFamily: 'inherit',
            }}>
            Konfirmasi Sudah Sampai
          </button>
        </div>
      )}

      {(delivery.status === 'sudah_sampai' || delivery.status === 'terverifikasi') && (
        <div style={{ padding: '0 14px 13px' }}>
          <div style={{
            textAlign: 'center', fontSize: 11, fontWeight: 700,
            color: delivery.status === 'terverifikasi' ? 'var(--green)' : 'var(--accent)',
            padding: '8px', borderRadius: 10,
            background: delivery.status === 'terverifikasi' ? 'var(--greensoft)' : 'var(--accentsoft)',
          }}>
            {delivery.status === 'terverifikasi'
              ? '✓ Stok booth sudah diperbarui'
              : 'Menunggu verifikasi penjaga booth…'}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function KurirHome({ setPage }) {
  const { user } = useAuth();

  const {
    data: deliveries,
    loading,
    fetchData: refetch,
  } = useApi('/distribution/my-today');
  // Expected shape:
  // [{ id, delivery_code, booth_name, status, items: [{name, qty, unit}] }]

  const list = Array.isArray(deliveries) ? deliveries : [];

  // Summary counts
  const total = list.length;
  const selesai = list.filter(d =>
    d.status === 'sudah_sampai' || d.status === 'terverifikasi'
  ).length;
  const proses = list.filter(d => d.status === 'dalam_perjalanan').length;
  const menunggu = list.filter(d => d.status === 'menunggu_pickup').length;

  // ── Actions ──────────────────────────────────────────────────────────────
  // Ganti endpoint sesuai API kamu
  async function handlePickup(id) {
    try {
      await fetch(`/api/distribution/${id}/pickup`, { method: 'PATCH' });
      refetch();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSampai(id) {
    try {
      await fetch(`/api/distribution/${id}/arrive`, { method: 'PATCH' });
      refetch();
    } catch (e) {
      console.error(e);
    }
  }

  // ── Group by status priority ─────────────────────────────────────────────
  const ORDER = ['dalam_perjalanan', 'menunggu_pickup', 'sudah_sampai', 'terverifikasi'];
  const sorted = [...list].sort(
    (a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status)
  );

  return (
    <div className="page">
      {/* HEADER */}
      <div className="phead">
        <div className="phead-row">
          <div>
            <div className="ptitle">Hai, {user?.name?.split(' ')[0]} 👋</div>
            <div className="psub">Kurir</div>
          </div>
          <div className="ava" style={{
            background: 'linear-gradient(135deg, #f4874a, #d4500a)',
            color: '#fff',
          }}>
            {getInitial(user?.name)}
          </div>
        </div>
      </div>

      <div className="pbody">
        {/* HERO */}
        <div className="hero" style={{ marginBottom: 14 }}>
          <div className="hero-lbl">Pengiriman Hari Ini</div>
          <div className="hero-val">{loading ? '—' : `${total} Booth`}</div>
          <div className="hero-tag">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {selesai} selesai · {proses} jalan · {menunggu} menunggu
          </div>
          <div className="hero-minis">
            <div className="hmini">
              <div className="hmini-lbl">Jalan</div>
              <div className="hmini-val">{proses}</div>
            </div>
            <div className="hmini">
              <div className="hmini-lbl">Selesai</div>
              <div className="hmini-val">{selesai}</div>
            </div>
            <div className="hmini">
              <div className="hmini-lbl">Menunggu</div>
              <div className="hmini-val">{menunggu}</div>
            </div>
          </div>
        </div>

        {/* LIST */}
        <div className="sec-title">Daftar Pengiriman</div>

        {loading && (
          <div style={{
            textAlign: 'center', padding: '30px 0',
            color: 'var(--text3)', fontSize: 13,
          }}>
            Memuat data…
          </div>
        )}

        {!loading && list.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '30px 0',
            color: 'var(--text3)', fontSize: 13,
          }}>
            Tidak ada pengiriman hari ini
          </div>
        )}

        {sorted.map(d => (
          <DeliveryCard
            key={d.id}
            delivery={d}
            onPickup={handlePickup}
            onSampai={handleSampai}
          />
        ))}

        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}