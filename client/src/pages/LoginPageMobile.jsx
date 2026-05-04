import { useState, useEffect } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --dark:   #1c1008;
    --cream:  #fdf5ee;
    --accent: #d4500a;
    --amber:  #b8420a;
    --glass:  rgba(253, 245, 238, 0.06);
    --glass2: rgba(253, 245, 238, 0.11);
  }

  html, body { height: 100%; }

  /* ─── PAGE SHELL ─── */
  .page {
    min-height: 100vh;
    min-height: 100svh;
    background: var(--dark);
    display: flex;
    flex-direction: column;
    font-family: 'DM Sans', sans-serif;
    overflow-x: hidden;
    position: relative;
  }

  /* ─── DECORATIVE ORBS ─── */
  .orb {
    position: fixed;
    border-radius: 50%;
    pointer-events: none;
    z-index: 0;
  }
  .orb-1 {
    width: 380px; height: 380px;
    background: radial-gradient(circle, rgba(212,80,10,.22) 0%, transparent 68%);
    top: -120px; right: -120px;
  }
  .orb-2 {
    width: 280px; height: 280px;
    background: radial-gradient(circle, rgba(212,80,10,.12) 0%, transparent 68%);
    bottom: 40px; left: -80px;
  }
  .orb-3 {
    width: 160px; height: 160px;
    background: radial-gradient(circle, rgba(253,245,238,.04) 0%, transparent 68%);
    top: 45%; left: 60%;
  }

  /* ─── HEADER STRIP ─── */
  .header {
    position: relative;
    z-index: 10;
    padding: 20px 24px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .logo-pill {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--glass);
    border: 1px solid rgba(253,245,238,.1);
    border-radius: 40px;
    padding: 8px 16px 8px 8px;
    backdrop-filter: blur(12px);
  }

  .logo-icon {
    width: 34px; height: 34px;
    background: linear-gradient(135deg, var(--accent), var(--amber));
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
    box-shadow: 0 4px 14px rgba(212,80,10,.4);
    flex-shrink: 0;
    animation: float 3.5s ease-in-out infinite;
  }

  @keyframes float {
    0%,100% { transform: translateY(0); }
    50%      { transform: translateY(-4px); }
  }

  .logo-name {
    font-family: 'Playfair Display', serif;
    font-size: 16px;
    font-weight: 900;
    color: var(--cream);
    letter-spacing: -.01em;
  }
  .logo-name span { color: var(--accent); }

  .header-badge {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: rgba(253,245,238,.35);
  }

  /* ─── HERO SECTION (top card) ─── */
  .hero {
    position: relative;
    z-index: 10;
    padding: 28px 24px 0;
    text-align: center;
  }

  .welcome-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(212,80,10,.14);
    border: 1px solid rgba(212,80,10,.25);
    border-radius: 30px;
    padding: 5px 14px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 16px;
  }

  .pulse-dot {
    width: 6px; height: 6px;
    background: var(--accent);
    border-radius: 50%;
    animation: blink 1.8s ease-in-out infinite;
  }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.25} }

  .hero-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(30px, 8vw, 40px);
    font-weight: 900;
    color: var(--cream);
    line-height: 1.1;
    margin-bottom: 10px;
  }
  .hero-title span { color: var(--accent); }

  .hero-sub {
    font-size: 13px;
    color: rgba(253,245,238,.45);
    line-height: 1.6;
    max-width: 300px;
    margin: 0 auto;
  }

  /* ─── STATS ROW ─── */
  .stats-row {
    position: relative;
    z-index: 10;
    display: flex;
    gap: 10px;
    padding: 22px 24px 0;
    justify-content: center;
  }

  .stat-card {
    flex: 1;
    max-width: 120px;
    background: var(--glass);
    border: 1px solid rgba(253,245,238,.08);
    border-radius: 14px;
    padding: 12px 10px;
    text-align: center;
    backdrop-filter: blur(10px);
    transition: all .25s;
  }
  .stat-card:hover {
    background: rgba(212,80,10,.12);
    border-color: rgba(212,80,10,.25);
    transform: translateY(-2px);
  }

  .stat-icon { font-size: 20px; margin-bottom: 4px; }
  .stat-val  {
    font-family: 'Playfair Display', serif;
    font-size: 18px;
    font-weight: 700;
    color: var(--cream);
    line-height: 1;
  }
  .stat-lbl  { font-size: 9px; color: rgba(253,245,238,.35); letter-spacing:.06em; text-transform:uppercase; margin-top:2px; }

  /* ─── FORM CARD ─── */
  .form-card {
    position: relative;
    z-index: 10;
    margin: 24px 16px 0;
    background: var(--cream);
    border-radius: 28px 28px 0 0;
    padding: 32px 24px 40px;
    flex: 1;
    /* pull-up handle */
  }

  /* subtle handle line */
  .form-card::before {
    content: '';
    display: block;
    width: 36px; height: 3px;
    background: rgba(28,16,8,.12);
    border-radius: 2px;
    margin: 0 auto 28px;
  }

  .card-title {
    font-family: 'Playfair Display', serif;
    font-size: 22px;
    font-weight: 700;
    color: var(--dark);
    margin-bottom: 4px;
  }
  .card-title span { color: var(--accent); }

  .card-sub {
    font-size: 12px;
    color: rgba(28,16,8,.45);
    margin-bottom: 26px;
    line-height: 1.5;
  }

  /* ─── FORM ELEMENTS ─── */
  .field { margin-bottom: 16px; }

  .field-label {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: var(--dark);
    opacity: .55;
    margin-bottom: 7px;
  }
  .field-label span { font-size: 13px; }

  .inp-wrap { position: relative; }

  .inp {
    width: 100%;
    padding: 15px 16px 15px 46px;
    background: white;
    border: 2px solid rgba(28,16,8,.09);
    border-radius: 14px;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    color: var(--dark);
    outline: none;
    transition: all .22s;
    -webkit-tap-highlight-color: transparent;
    /* prevents iOS zoom */
    font-size: 16px;
  }
  .inp::placeholder { color: rgba(28,16,8,.28); font-size: 14px; }
  .inp:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 4px rgba(212,80,10,.1);
  }

  .inp-prefix {
    position: absolute;
    left: 14px; top: 50%;
    transform: translateY(-50%);
    font-size: 16px;
    pointer-events: none;
    opacity: .38;
    transition: opacity .2s;
  }
  .inp-wrap:focus-within .inp-prefix { opacity: .85; }

  .pw-toggle {
    position: absolute;
    right: 14px; top: 50%;
    transform: translateY(-50%);
    background: none; border: none;
    cursor: pointer; font-size: 18px;
    opacity: .35; transition: opacity .2s;
    padding: 4px;
    -webkit-tap-highlight-color: transparent;
  }
  .pw-toggle:hover { opacity: .75; }

  /* ─── OPTIONS ROW ─── */
  .options-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 6px 0 24px;
  }

  .remem {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 13px;
    color: rgba(28,16,8,.55);
    cursor: pointer;
    user-select: none;
  }
  .remem input { accent-color: var(--accent); width: 15px; height: 15px; }

  .forg {
    font-size: 13px;
    color: var(--accent);
    text-decoration: none;
    font-weight: 500;
  }

  /* ─── SUBMIT BUTTON ─── */
  .submit {
    width: 100%;
    padding: 17px;
    background: linear-gradient(135deg, var(--accent) 0%, var(--amber) 100%);
    color: var(--cream);
    border: none;
    border-radius: 16px;
    font-size: 15px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    letter-spacing: .03em;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    box-shadow: 0 10px 28px rgba(212,80,10,.38);
    transition: all .28s;
    -webkit-tap-highlight-color: transparent;
  }
  .submit::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,.15) 0%, transparent 55%);
    opacity: 0;
    transition: opacity .25s;
  }
  .submit:hover  { transform: translateY(-2px); box-shadow: 0 14px 36px rgba(212,80,10,.48); }
  .submit:hover::after { opacity: 1; }
  .submit:active { transform: translateY(0); box-shadow: 0 5px 14px rgba(212,80,10,.3); }
  .submit:disabled { opacity: .68; cursor: not-allowed; transform: none; }

  .btn-inner {
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }

  .spinner {
    width: 18px; height: 18px;
    border: 2px solid rgba(253,245,238,.3);
    border-top-color: var(--cream);
    border-radius: 50%;
    animation: spin .7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ─── ALERT ─── */
  .alert {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 18px;
    animation: slideIn .28s ease;
  }
  @keyframes slideIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
  .alert-err { background: rgba(212,80,10,.09); border: 1px solid rgba(212,80,10,.22); color: var(--accent); }
  .alert-ok  { background: rgba(34,139,34,.08);  border: 1px solid rgba(34,139,34,.2);  color: #1e7b1e; }

  /* ─── DIVIDER ─── */
  .divider {
    display: flex; align-items: center; gap: 12px;
    margin: 22px 0 18px;
  }
  .divider::before, .divider::after {
    content: ''; flex: 1;
    height: 1px; background: rgba(28,16,8,.1);
  }
  .divider span { font-size: 11px; color: rgba(28,16,8,.3); white-space: nowrap; }

  /* ─── QUICK LOGIN CHIPS ─── */
  .quick-row {
    display: flex; gap: 10px;
  }
  .quick-btn {
    flex: 1;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    padding: 12px 10px;
    background: white;
    border: 1.5px solid rgba(28,16,8,.1);
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    color: rgba(28,16,8,.65);
    cursor: pointer;
    transition: all .2s;
  }
  .quick-btn:hover { border-color: var(--accent); color: var(--accent); }

  /* ─── FOOTER ─── */
  .card-footer {
    margin-top: 26px;
    text-align: center;
    padding-top: 18px;
    border-top: 1px solid rgba(28,16,8,.08);
    font-size: 10px;
    color: rgba(28,16,8,.28);
    letter-spacing: .03em;
  }

  /* ─── DESKTOP BREAKPOINT (50:50 LAYOUT) ─── */
  @media (min-width: 768px) {
    .page { 
      flex-direction: row; 
      align-items: stretch;
    }

    /* left dark panel - 50% width */
    .left-desktop {
      display: flex;
      flex: 1;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 48px;
      position: relative;
      z-index: 10;
      background: var(--dark);
    }

    /* right cream panel - 50% width */
    .right-desktop {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--cream);
      padding: 60px 48px;
      position: relative;
      overflow-y: auto;
    }

    /* decorative element on right panel */
    .right-desktop::before {
      content: '';
      position: absolute;
      width: 400px;
      height: 400px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(212,80,10,.04) 0%, transparent 70%);
      top: -120px;
      right: -120px;
      pointer-events: none;
    }

    .right-desktop::after {
      content: '';
      position: absolute;
      width: 250px;
      height: 250px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(212,80,10,.03) 0%, transparent 70%);
      bottom: -80px;
      left: -80px;
      pointer-events: none;
    }

    /* hide mobile-only */
    .header, .hero, .stats-row { display: none; }

    /* reset form card for desktop */
    .form-card {
      margin: 0;
      border-radius: 0;
      background: transparent;
      padding: 0;
      max-width: 420px;
      width: 100%;
    }
    .form-card::before { display: none; }

    /* desktop left content - enhanced */
    .desk-logo { 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      width: 100%;
      max-width: 380px;
    }
    
    .desk-icon {
      width: 100px;
      height: 100px;
      background: linear-gradient(135deg, var(--accent), var(--amber));
      border-radius: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
      box-shadow: 0 20px 50px rgba(212,80,10,.35);
      margin-bottom: 28px;
      animation: float 3.5s ease-in-out infinite;
    }
    
    .desk-brand {
      font-family: 'Playfair Display', serif;
      font-size: 44px;
      font-weight: 900;
      color: var(--cream);
      line-height: 1.1;
      margin-bottom: 8px;
      text-align: center;
    }
    .desk-brand span { color: var(--accent); }
    
    .desk-sub {
      font-size: 12px;
      letter-spacing: .2em;
      text-transform: uppercase;
      color: rgba(253,245,238,.35);
      margin-bottom: 42px;
      text-align: center;
    }
    
    .desk-div {
      width: 60px;
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--accent), transparent);
      margin: 0 auto 36px;
    }
    
    .desk-feats { 
      display: flex; 
      flex-direction: column; 
      gap: 14px; 
      width: 100%; 
      margin-bottom: 40px;
    }
    
    .desk-feat {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 18px;
      background: rgba(253,245,238,.04);
      border: 1px solid rgba(253,245,238,.08);
      border-radius: 14px;
      transition: all .25s;
      cursor: default;
    }
    .desk-feat:hover { 
      background: rgba(212,80,10,.12); 
      border-color: rgba(212,80,10,.3); 
      transform: translateX(6px); 
    }
    
    .desk-fi {
      width: 38px;
      height: 38px;
      background: rgba(212,80,10,.2);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
    }
    
    .desk-ft p { 
      font-size: 13px; 
      font-weight: 600; 
      color: var(--cream); 
      margin-bottom: 2px;
    }
    .desk-ft span { 
      font-size: 11px; 
      color: rgba(253,245,238,.4); 
    }
    
    .desk-ver { 
      margin-top: 20px;
      font-size: 10px; 
      color: rgba(253,245,238,.2); 
      letter-spacing: .1em;
      text-align: center;
    }

    /* desktop form adjustments */
    .card-title { 
      font-size: 32px; 
      margin-bottom: 8px;
    }
    
    .card-sub { 
      font-size: 14px; 
      margin-bottom: 32px;
    }
    
    .inp { 
      font-size: 14px !important; 
      padding: 14px 16px 14px 46px;
    }
    .inp::placeholder { font-size: 13px !important; }
    
    .field-label { font-size: 11px; }
    
    .submit { padding: 16px; font-size: 14px; }
    
    .quick-btn { padding: 11px 10px; font-size: 12px; }
    
    .card-footer { font-size: 11px; }
  }

  /* untuk layar yang lebih kecil dari desktop (mobile/tablet) */
  @media (max-width: 767px) {
    .left-desktop { display: none !important; }
    .right-desktop { 
      flex-direction: column; 
      padding: 0;
      background: transparent;
    }
    .right-desktop::before,
    .right-desktop::after {
      display: none;
    }
  }
`;

const features = [
  { icon: "📦", title: "Manajemen Stok", desc: "Pantau stok real-time" },
  { icon: "💰", title: "Rekap Penjualan", desc: "Laporan harian & bulanan" },
  { icon: "📊", title: "Analitik Data", desc: "Grafik & statistik" },
  { icon: "🔔", title: "Notifikasi Stok", desc: "Peringatan stok menipis" },
];

export default function LoginPageMobile() {
  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    if (alert) setAlert(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setAlert({ type: "err", msg: "Email dan password wajib diisi." });
      return;
    }
    setLoading(true);
    setAlert(null);
    await new Promise(r => setTimeout(r, 1800));
    setAlert({ type: "ok", msg: "Login berhasil! Mengalihkan ke dashboard..." });
    setLoading(false);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="page" style={{ opacity: mounted ? 1 : 0, transition: "opacity .45s ease" }}>

        {/* Decorative orbs */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        {/* ── DESKTOP LEFT PANEL (50% width) ── */}
        <aside className="left-desktop">
          <div className="desk-logo">
            <div className="desk-icon">🍫</div>
            <h1 className="desk-brand">Choco<span>Celuv</span></h1>
            <p className="desk-sub">Manajemen Stok & Penjualan</p>
            <div className="desk-div" />
            <div className="desk-feats">
              {features.map((f, i) => (
                <div className="desk-feat" key={i}>
                  <div className="desk-fi">{f.icon}</div>
                  <div className="desk-ft">
                    <p>{f.title}</p>
                    <span>{f.desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="desk-ver">v1.0.0 — Choco Celuv System</p>
          </div>
        </aside>

        {/* ── DESKTOP RIGHT PANEL (50% width) / MOBILE FULL ── */}
        <div className="right-desktop">

          {/* MOBILE: header strip (hidden on desktop) */}
          <header className="header">
            <div className="logo-pill">
              <div className="logo-icon">🍫</div>
              <span className="logo-name">Choco<span>Celuv</span></span>
            </div>
            <span className="header-badge">v1.0</span>
          </header>

          {/* MOBILE: hero (hidden on desktop) */}
          <section className="hero">
            <div className="welcome-chip">
              <div className="pulse-dot" />
              Sistem Aktif
            </div>
            <h2 className="hero-title">
              Selamat<br />Datang<br /><span>Kembali</span>
            </h2>
            <p className="hero-sub">
              Platform manajemen stok & penjualan minuman Choco Celuv.
            </p>
          </section>

          {/* MOBILE: stats row (hidden on desktop) */}
          <div className="stats-row">
            {[
              { icon: "📦", val: "1.2k", lbl: "Produk" },
              { icon: "💰", val: "98%", lbl: "Akurasi" },
              { icon: "📊", val: "Real", lbl: "Time" },
            ].map((s, i) => (
              <div className="stat-card" key={i}>
                <div className="stat-icon">{s.icon}</div>
                <div className="stat-val">{s.val}</div>
                <div className="stat-lbl">{s.lbl}</div>
              </div>
            ))}
          </div>

          {/* FORM CARD — shared mobile + desktop */}
          <div className="form-card">

            <div>
              <h3 className="card-title">Masuk ke <span>Dashboard</span></h3>
              <p className="card-sub">Masukkan kredensial Anda untuk melanjutkan.</p>
            </div>

            {alert && (
              <div className={`alert alert-${alert.type}`}>
                <span>{alert.type === "err" ? "⚠️" : "✅"}</span>
                {alert.msg}
              </div>
            )}

            <form onSubmit={onSubmit} noValidate>

              <div className="field">
                <label className="field-label">
                  <span>✉️</span> Email / Username
                </label>
                <div className="inp-wrap">
                  <span className="inp-prefix">✉️</span>
                  <input
                    className="inp"
                    type="text"
                    name="email"
                    placeholder="admin@chococeluv.com"
                    value={form.email}
                    onChange={onChange}
                    autoCapitalize="none"
                    autoCorrect="off"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label">
                  <span>🔒</span> Password
                </label>
                <div className="inp-wrap">
                  <span className="inp-prefix">🔒</span>
                  <input
                    className="inp"
                    type={showPw ? "text" : "password"}
                    name="password"
                    placeholder="Masukkan password Anda"
                    value={form.password}
                    onChange={onChange}
                    autoComplete="current-password"
                    style={{ paddingRight: "46px" }}
                  />
                  <button
                    type="button"
                    className="pw-toggle"
                    onClick={() => setShowPw(p => !p)}
                    aria-label={showPw ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPw ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div className="options-row">
                <label className="remem">
                  <input type="checkbox" name="remember" checked={form.remember} onChange={onChange} />
                  Ingat saya
                </label>
                <a href="#" className="forg">Lupa password?</a>
              </div>

              <button type="submit" className="submit" disabled={loading}>
                <span className="btn-inner">
                  {loading
                    ? <><span className="spinner" /> Memverifikasi...</>
                    : <>Masuk ke Dashboard →</>
                  }
                </span>
              </button>
            </form>

            <div className="divider"><span>atau masuk dengan</span></div>

            <div className="quick-row">
              <button className="quick-btn" type="button">
                <span>🏢</span> SSO Perusahaan
              </button>
              <button className="quick-btn" type="button">
                <span>📱</span> OTP Mobile
              </button>
            </div>

            <div className="card-footer">
              © 2025 Choco Celuv Management System · Semua hak dilindungi
            </div>
          </div>

        </div>{/* end right-desktop */}

      </div>
    </>
  );
}