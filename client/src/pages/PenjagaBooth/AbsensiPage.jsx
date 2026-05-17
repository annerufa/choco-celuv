// pages/AbsensiPage.jsx
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

function getToken() {
  return localStorage.getItem('token');
}

function api() {
  return axios.create({
    baseURL: API,
    headers: { Authorization: `Bearer ${getToken()}` },
  });
}

function getNow() {
  const n = new Date();
  return (
    String(n.getHours()).padStart(2, '0') + ':' +
    String(n.getMinutes()).padStart(2, '0') + ':' +
    String(n.getSeconds()).padStart(2, '0')
  );
}

function getDateLabel() {
  return new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatJam(dt) {
  if (!dt) return '–';
  return new Date(dt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function formatTanggal(d) {
  if (!d) return '–';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function statusColor(status) {
  if (status === 'hadir') return { bg: 'var(--greensoft)', col: 'var(--green)' };
  if (status === 'terlambat') return { bg: 'var(--accentsoft)', col: 'var(--accent)' };
  if (status === 'absen') return { bg: 'var(--redsoft)', col: 'var(--red)' };
  return { bg: 'rgba(0,0,0,0.05)', col: 'var(--text2)' };
}

// ── Leaflet Map Component ────────────────────────────────────────────────────
function AbsenMap({ userLat, userLon, boothLat, boothLon, radius = 100, clockInLat, clockInLon, clockOutLat, clockOutLon }) {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!boothLat || !boothLon) return;

    if (!mapRef.current) return; // safety check
    if (mapRef.current._leaflet_id) return; // sudah diinisialisasi, jangan buat ulang
    // if (instanceRef.current) {
    //   instanceRef.current.remove();
    //   instanceRef.current = null;
    // }

    // Dynamic import Leaflet
    Promise.all([
      import('leaflet'),
      import('leaflet/dist/leaflet.css'),
    ]).then(([L]) => {
      L = L.default ?? L;

      if (!mapRef.current || mapRef.current._leaflet_id) return; // safety check lagi setelah load
      const centerLat = userLat ?? boothLat;
      const centerLon = userLon ?? boothLon;

      const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false, scrollWheelZoom: false, doubleClickZoom: false });
      // Kalau ada posisi user, fit ke 2 titik
      if (userLat && userLon) {
        const bounds = L.latLngBounds(
          [boothLat, boothLon],
          [userLat, userLon]
        );
        map.fitBounds(bounds, { padding: [30, 30] }); // ← padding biar tidak terlalu mepet pinggir
      } else {
        // Kalau GPS belum ada, center ke booth aja
        map.setView([boothLat, boothLon], 17);
      }
      instanceRef.current = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);

      // Radius circle booth
      L.circle([boothLat, boothLon], {
        radius,
        color: '#c47b10',
        fillColor: '#c47b10',
        fillOpacity: 0.08,
        weight: 1.5,
        dashArray: '4 4',
      }).addTo(map);

      // Marker booth
      const boothIcon = L.divIcon({
        html: `<div style="width:28px;height:28px;background:#c47b10;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.2)"></div>`,
        iconSize: [28, 28], iconAnchor: [14, 28], className: '',
      });
      L.marker([boothLat, boothLon], { icon: boothIcon })
        .addTo(map)
        .bindPopup('<b>📍 Booth</b>');

      // Marker posisi karyawan saat ini
      if (userLat && userLon) {
        const userIcon = L.divIcon({
          html: `<div style="width:16px;height:16px;background:#2563a8;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 4px rgba(37,99,168,0.2)"></div>`,
          iconSize: [16, 16], iconAnchor: [8, 8], className: '',
        });
        L.marker([userLat, userLon], { icon: userIcon })
          .addTo(map)
          .bindPopup('<b>📱 Posisimu</b>');
      }

      // Marker clock in (histori)
      if (clockInLat && clockInLon) {
        const inIcon = L.divIcon({
          html: `<div style="width:12px;height:12px;background:#2e8a56;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.2)"></div>`,
          iconSize: [12, 12], iconAnchor: [6, 6], className: '',
        });
        L.marker([clockInLat, clockInLon], { icon: inIcon })
          .addTo(map)
          .bindPopup('<b>✅ Clock In</b>');
      }

      // Marker clock out (histori)
      if (clockOutLat && clockOutLon) {
        const outIcon = L.divIcon({
          html: `<div style="width:12px;height:12px;background:#c0392b;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.2)"></div>`,
          iconSize: [12, 12], iconAnchor: [6, 6], className: '',
        });
        L.marker([clockOutLat, clockOutLon], { icon: outIcon })
          .addTo(map)
          .bindPopup('<b>🔴 Clock Out</b>');
      }
    });

    return () => {
      if (instanceRef.current) {
        instanceRef.current.remove();
        instanceRef.current = null;
      }
      // reset leaftlet id
      if (mapRef.current) {
        delete mapRef.current._leaflet_id;
      }
    };
  }, [userLat, userLon, boothLat, boothLon, clockInLat, clockInLon, clockOutLat, clockOutLon]);

  return (
    <div ref={mapRef} style={{ width: '100%', height: '180px', borderRadius: '16px', overflow: 'hidden', zIndex: 0 }} />
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function AbsensiPage() {
  const [time, setTime] = useState(getNow);
  const [jadwal, setJadwal] = useState(null);         // jadwal aktif hari ini
  const [openAbsen, setOpenAbsen] = useState(null);   // record absen hari ini yg belum clock out
  const [histori, setHistori] = useState([]);         // histori absensi pribadi
  const [userPos, setUserPos] = useState(null);       // { lat, lon }
  const [gpsStatus, setGpsStatus] = useState('idle'); // idle | loading | ok | denied | error
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);           // { msg, type }
  const [loadingPage, setLoadingPage] = useState(true);

  // Jam realtime
  useEffect(() => {
    const t = setInterval(() => setTime(getNow()), 1000);
    return () => clearInterval(t);
  }, []);

  // Fetch jadwal + open absen + histori
  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoadingPage(true);
    try {
      const [jadwalRes, openRes, historiRes] = await Promise.all([
        api().get('/schedules/me'),
        api().get('/attendance/open'),
        api().get('/attendance/mine'),
      ]);
      setJadwal(jadwalRes.data?.payload?.data ?? null);
      setOpenAbsen(openRes.data?.payload?.data ?? null);
      setHistori(historiRes.data?.payload?.data ?? []);
    } catch {
      // silent — tampilkan kosong
    } finally {
      setLoadingPage(false);
    }
  };

  // Ambil GPS
  const getGPS = () => new Promise((resolve, reject) => {
    setGpsStatus('loading');
    if (!navigator.geolocation) {
      setGpsStatus('error');
      reject(new Error('GPS tidak didukung browser ini.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setUserPos(coords);
        setGpsStatus('ok');
        resolve(coords);
      },
      (err) => {
        setGpsStatus(err.code === 1 ? 'denied' : 'error');
        reject(new Error(
          err.code === 1
            ? 'Akses GPS ditolak. Aktifkan lokasi di browser.'
            : 'Gagal mendapatkan lokasi.'
        ));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Clock In
  const handleClockIn = async () => {
    if (!jadwal) return showToast('Tidak ada jadwal aktif hari ini.', 'error');
    setActionLoading(true);
    try {
      const { lat, lon } = await getGPS();
      await api().post('/attendance/clockin', {
        booth_id: jadwal.booth_id,
        shift: jadwal.shift,
        lat, lon,
      });
      showToast('Clock in berhasil! ✅');
      await fetchAll();
    } catch (err) {
      showToast(err.response?.data?.payload?.message || err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Clock Out
  const handleClockOut = async () => {
    setActionLoading(true);
    try {
      const { lat, lon } = await getGPS();
      await api().post('/attendance/clockout', { lat, lon });
      showToast('Clock out berhasil! 👋');
      await fetchAll();
    } catch (err) {
      showToast(err.response?.data?.payload?.message || err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const sudahClockIn = Boolean(openAbsen);
  const sudahClockOut = histori[0]?.date === new Date().toISOString().slice(0, 10) && histori[0]?.clock_out;

  return (
    <div className="page">
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'error' ? 'var(--red)' : 'var(--green)',
          color: '#fff', borderRadius: 12, padding: '10px 18px',
          fontSize: 13, fontWeight: 700, zIndex: 999,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          maxWidth: 320, textAlign: 'center',
        }}>
          {toast.msg}
        </div>
      )}

      {/* HEADER */}
      <div className="phead">
        <div className="phead-row">
          <div>
            <div className="ptitle">Absensi</div>
            <div className="psub">{getDateLabel()}</div>
          </div>
          {gpsStatus === 'loading' && (
            <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700 }}>📡 GPS...</div>
          )}
          {gpsStatus === 'ok' && (
            <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700 }}>📍 GPS OK</div>
          )}
          {(gpsStatus === 'denied' || gpsStatus === 'error') && (
            <div style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700 }}>⚠️ GPS Mati</div>
          )}
        </div>
      </div>

      <div className="pbody">
        {/* CLOCK CARD */}
        <div className="absen-hero" style={{ background: 'var(--bg0)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.6px' }}>
            Jam Sekarang
          </div>
          <div className="clock">{time}</div>

          {/* Info Jadwal */}
          {loadingPage ? (
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14 }}>Memuat jadwal...</div>
          ) : jadwal ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, marginBottom: 14, flexWrap: 'wrap',
            }}>
              <span style={{ background: 'var(--accentsoft)', color: 'var(--accent)', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
                {jadwal.booth_name}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>
                {jadwal.shift.charAt(0).toUpperCase() + jadwal.shift.slice(1)} · {jadwal.expected_clock_in?.slice(0, 5)} – {jadwal.expected_clock_out?.slice(0, 5)}
              </span>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14 }}>Tidak ada jadwal aktif</div>
          )}

          {/* Status hari ini */}
          {sudahClockIn && !sudahClockOut && (
            <div style={{ fontSize: 12, color: 'var(--green)', fontWeight: 700, marginBottom: 10 }}>
              ✅ Masuk {formatJam(openAbsen.clock_in)} · Belum clock out
            </div>
          )}
          {sudahClockOut && (
            <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 700, marginBottom: 10 }}>
              ✅ Selesai · {formatJam(histori[0]?.clock_in)} – {formatJam(histori[0]?.clock_out)}
            </div>
          )}

          {/* Tombol */}
          {!sudahClockOut && (
            <div className="absen-btns">
              {!sudahClockIn ? (
                <button
                  className="abtn abtn-in"
                  onClick={handleClockIn}
                  disabled={actionLoading || !jadwal}
                  style={{ opacity: actionLoading || !jadwal ? 0.5 : 1 }}
                >
                  {actionLoading ? '⏳ Memproses...' : '✅ Absen Masuk'}
                </button>
              ) : (
                <button
                  className="abtn abtn-out"
                  onClick={handleClockOut}
                  disabled={actionLoading}
                  style={{ opacity: actionLoading ? 0.5 : 1 }}
                >
                  {actionLoading ? '⏳ Memproses...' : '🔴 Absen Keluar'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* GPS WARNING */}
        {gpsStatus === 'denied' && (
          <div style={{ background: 'var(--redsoft)', borderRadius: 12, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: 'var(--red)', fontWeight: 600 }}>
            ⚠️ GPS diblokir. Buka pengaturan browser → izinkan akses lokasi untuk halaman ini.
          </div>
        )}

        {/* PETA */}
        {jadwal?.booth_latitude && (
          <div style={{ marginBottom: 16 }}>
            <div className="sec-title" style={{ marginBottom: 8 }}>Lokasi Booth</div>
            <AbsenMap
              userLat={userPos?.lat}
              userLon={userPos?.lon}
              boothLat={jadwal.booth_latitude}
              boothLon={jadwal.booth_longitude}
              clockInLat={openAbsen?.lat_in}
              clockInLon={openAbsen?.lon_in}
            />
            <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 11, color: 'var(--text2)' }}>
              <span>🟡 Booth</span>
              <span>🔵 Posisimu</span>
              <span>🟢 Clock In</span>
            </div>
          </div>
        )}

        {/* HISTORI ABSENSI PRIBADI */}
        <div className="sec-title">Riwayat Absensimu</div>
        {histori.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 13, padding: '20px 0' }}>
            Belum ada riwayat absensi
          </div>
        ) : (
          <div className="alist">
            {histori.map((item) => {
              const { bg, col } = statusColor(item.status);
              const sudahOut = Boolean(item.clock_out);
              return (
                <div className="arow" key={item.id} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                    {/* Tanggal */}
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)', flex: 1 }}>
                      {formatTanggal(item.date)}
                    </div>
                    {/* Badge status */}
                    <div className="abadge" style={{ background: bg, color: col }}>
                      {item.status ?? '–'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text2)' }}>
                    <span>
                      <span style={{ color: 'var(--green)', fontWeight: 700 }}>Masuk </span>
                      {formatJam(item.clock_in)}
                    </span>
                    <span>
                      <span style={{ color: sudahOut ? 'var(--red)' : 'var(--text3)', fontWeight: 700 }}>
                        Keluar{' '}
                      </span>
                      {sudahOut ? formatJam(item.clock_out) : '–'}
                    </span>
                    <span style={{ marginLeft: 'auto', color: 'var(--text3)', fontSize: 11 }}>
                      {item.booth_name}
                    </span>
                  </div>
                  {/* Indikator lokasi */}
                  <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
                    <span style={{ color: item.location_in_valid ? 'var(--green)' : item.location_in_valid === false ? 'var(--red)' : 'var(--text3)' }}>
                      {item.location_in_valid === true ? '📍 In ✓' : item.location_in_valid === false ? '📍 In ✗' : '📍 –'}
                    </span>
                    {sudahOut && (
                      <span style={{ color: item.location_out_valid ? 'var(--green)' : item.location_out_valid === false ? 'var(--red)' : 'var(--text3)' }}>
                        {item.location_out_valid === true ? '📍 Out ✓' : item.location_out_valid === false ? '📍 Out ✗' : '📍 –'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}