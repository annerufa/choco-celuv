import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { login as loginApi } from "../../services/authService";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :root {
    --dark: #1c1008;
    --cream: #fdf5ee;
    --accent: #d4500a;
    --dark2: #1c1008;
    --amber: #b8420a;
    --light-cream: #fef9f4;
  }

  body {
    font-family: 'DM Sans', sans-serif;
    background: var(--dark);
    min-height: 100vh;
  }

  .login-wrapper {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 1fr 1fr;
    position: relative;
    overflow: hidden;
  }

  /* === LEFT PANEL === */
  .left-panel {
    background: var(--dark);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 50px;
    position: relative;
    overflow: hidden;
  }

  .left-panel::before {
    content: '';
    position: absolute;
    width: 500px;
    height: 500px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(212, 80, 10, 0.18) 0%, transparent 70%);
    top: -100px;
    left: -100px;
    pointer-events: none;
  }

  .left-panel::after {
    content: '';
    position: absolute;
    width: 350px;
    height: 350px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(212, 80, 10, 0.10) 0%, transparent 70%);
    bottom: -80px;
    right: -60px;
    pointer-events: none;
  }

  .brand-area {
    text-align: center;
    position: relative;
    z-index: 2;
  }

  .choco-icon-wrapper {
    width: 110px;
    height: 110px;
    margin: 0 auto 32px;
    position: relative;
  }

  .choco-icon-bg {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, var(--accent) 0%, var(--amber) 100%);
    border-radius: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 52px;
    box-shadow: 0 20px 60px rgba(212, 80, 10, 0.45), 0 0 0 1px rgba(212, 80, 10, 0.2);
    animation: float 4s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  .badge {
    position: absolute;
    bottom: -10px;
    right: -10px;
    background: var(--cream);
    color: var(--dark);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    padding: 4px 10px;
    border-radius: 20px;
    font-family: 'DM Sans', sans-serif;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }

  .brand-name {
    font-family: 'Playfair Display', serif;
    font-size: 46px;
    font-weight: 900;
    color: var(--cream);
    line-height: 1;
    letter-spacing: -0.02em;
    margin-bottom: 6px;
  }

  .brand-name span {
    color: var(--accent);
  }

  .brand-sub {
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: rgba(253, 245, 238, 0.45);
    margin-bottom: 48px;
  }

  .divider-line {
    width: 60px;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--accent), transparent);
    margin: 0 auto 48px;
  }

  .feature-list {
    display: flex;
    flex-direction: column;
    gap: 18px;
    width: 100%;
    max-width: 320px;
  }

  .feature-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 20px;
    background: rgba(253, 245, 238, 0.04);
    border: 1px solid rgba(253, 245, 238, 0.08);
    border-radius: 14px;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
  }

  .feature-item:hover {
    background: rgba(212, 80, 10, 0.1);
    border-color: rgba(212, 80, 10, 0.3);
    transform: translateX(4px);
  }

  .feature-icon {
    width: 38px;
    height: 38px;
    background: linear-gradient(135deg, rgba(212,80,10,0.25), rgba(212,80,10,0.10));
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
  }

  .feature-text p {
    font-size: 13px;
    font-weight: 600;
    color: var(--cream);
    line-height: 1.3;
  }

  .feature-text span {
    font-size: 11px;
    color: rgba(253,245,238,0.4);
  }

  .version-tag {
    margin-top: 48px;
    font-size: 11px;
    color: rgba(253,245,238,0.2);
    letter-spacing: 0.1em;
    font-weight: 400;
  }

  /* === RIGHT PANEL === */
  .right-panel {
    background: var(--cream);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px 50px;
    position: relative;
    overflow: hidden;
  }

  .right-panel::before {
    content: '';
    position: absolute;
    width: 400px;
    height: 400px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(212, 80, 10, 0.06) 0%, transparent 70%);
    top: -100px;
    right: -100px;
    pointer-events: none;
  }

  .right-panel::after {
    content: '';
    position: absolute;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(28, 16, 8, 0.04) 0%, transparent 70%);
    bottom: -80px;
    left: -60px;
    pointer-events: none;
  }

  .form-container {
    width: 100%;
    max-width: 400px;
    position: relative;
    z-index: 2;
  }

  .form-header {
    margin-bottom: 40px;
  }

  .welcome-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(212, 80, 10, 0.1);
    border: 1px solid rgba(212, 80, 10, 0.2);
    border-radius: 20px;
    padding: 5px 14px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 18px;
  }

  .welcome-tag::before {
    content: '●';
    font-size: 7px;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  .form-title {
    font-family: 'Playfair Display', serif;
    font-size: 38px;
    font-weight: 700;
    color: var(--dark);
    line-height: 1.15;
    margin-bottom: 10px;
  }

  .form-title span {
    color: var(--accent);
  }

  .form-subtitle {
    font-size: 14px;
    color: rgba(28, 16, 8, 0.5);
    font-weight: 400;
    line-height: 1.6;
  }

  /* Form Fields */
  .form-group {
    margin-bottom: 22px;
  }

  .form-label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--dark);
    margin-bottom: 8px;
    opacity: 0.7;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-icon {
    position: absolute;
    left: 16px;
    font-size: 17px;
    pointer-events: none;
    z-index: 2;
    opacity: 0.5;
    transition: opacity 0.2s;
  }

  .form-input {
    width: 100%;
    padding: 15px 16px 15px 48px;
    background: white;
    border: 2px solid rgba(28, 16, 8, 0.1);
    border-radius: 14px;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    color: var(--dark);
    outline: none;
    transition: all 0.25s ease;
    box-shadow: 0 2px 8px rgba(28, 16, 8, 0.04);
  }

  .form-input::placeholder {
    color: rgba(28, 16, 8, 0.3);
    font-weight: 300;
  }

  .form-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 4px rgba(212, 80, 10, 0.10), 0 2px 8px rgba(28,16,8,0.05);
  }

  .form-input:focus + .input-icon,
  .input-wrapper:focus-within .input-icon {
    opacity: 1;
    color: var(--accent);
  }

  .toggle-pw {
    position: absolute;
    right: 16px;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 18px;
    opacity: 0.4;
    transition: opacity 0.2s;
    padding: 0;
    line-height: 1;
  }

  .toggle-pw:hover { opacity: 0.8; }

  /* Options row */
  .options-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28px;
  }

  .remember-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 13px;
    color: rgba(28,16,8,0.6);
    font-weight: 400;
    user-select: none;
  }

  .remember-label input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: var(--accent);
    cursor: pointer;
    border-radius: 4px;
  }

  .forgot-link {
    font-size: 13px;
    color: var(--accent);
    text-decoration: none;
    font-weight: 500;
    transition: opacity 0.2s;
  }

  .forgot-link:hover { opacity: 0.7; }

  /* Submit button */
  .submit-btn {
    width: 100%;
    padding: 16px;
    background: linear-gradient(135deg, var(--accent) 0%, #b8420a 100%);
    color: var(--cream);
    border: none;
    border-radius: 14px;
    font-size: 15px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    letter-spacing: 0.04em;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(212, 80, 10, 0.35);
  }

  .submit-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
    opacity: 0;
    transition: opacity 0.3s;
  }

  .submit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(212, 80, 10, 0.45);
  }

  .submit-btn:hover::before { opacity: 1; }

  .submit-btn:active {
    transform: translateY(0px);
    box-shadow: 0 4px 12px rgba(212, 80, 10, 0.30);
  }

  .submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .btn-inner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(253,245,238,0.3);
    border-top-color: var(--cream);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* Error / Success Messages */
  .alert {
    padding: 13px 16px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 22px;
    display: flex;
    align-items: center;
    gap: 10px;
    animation: slideIn 0.3s ease;
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .alert-error {
    background: rgba(212, 80, 10, 0.08);
    border: 1px solid rgba(212, 80, 10, 0.25);
    color: var(--accent);
  }

  .alert-success {
    background: rgba(34, 139, 34, 0.07);
    border: 1px solid rgba(34, 139, 34, 0.2);
    color: #1e7b1e;
  }

  /* Footer */
  .form-footer {
    margin-top: 32px;
    text-align: center;
    padding-top: 24px;
    border-top: 1px solid rgba(28,16,8,0.08);
  }

  .footer-text {
    font-size: 12px;
    color: rgba(28,16,8,0.35);
    letter-spacing: 0.03em;
  }

  /* Mobile divider */
  .mobile-brand {
    display: none;
  }

  /* === RESPONSIVE === */
  @media (max-width: 900px) {
    .login-wrapper {
      grid-template-columns: 1fr;
      grid-template-rows: auto 1fr;
    }

    .left-panel {
      display: none;
    }

    .mobile-brand {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 14px;
      margin-bottom: 36px;
    }

    .mobile-icon {
      width: 52px;
      height: 52px;
      background: linear-gradient(135deg, var(--accent), var(--amber));
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      box-shadow: 0 8px 20px rgba(212,80,10,0.3);
      flex-shrink: 0;
    }

    .mobile-brand-text h2 {
      font-family: 'Playfair Display', serif;
      font-size: 26px;
      font-weight: 900;
      color: var(--dark);
      line-height: 1;
    }

    .mobile-brand-text h2 span { color: var(--accent); }

    .mobile-brand-text p {
      font-size: 10px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: rgba(28,16,8,0.4);
      margin-top: 2px;
    }

    .right-panel {
      padding: 40px 24px 50px;
      align-items: flex-start;
    }

    .form-container {
      max-width: 100%;
    }

    .form-title {
      font-size: 30px;
    }
  }

  @media (max-width: 480px) {
    .right-panel {
      padding: 32px 20px 44px;
    }

    .form-title { font-size: 26px; }
    .options-row { flex-direction: column; align-items: flex-start; gap: 10px; }
  }
`;


export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  // role map
  const ROLE_ROUTES = {
    pemilik: "/dashboard/pemilik",
    kurir: "/dashboard/kurir",
    penjaga_booth: "/dashboard/penjaga_booth",
  }

  const [formData, setFormData] = useState({ username: "", password: "", remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (alert) setAlert(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      setAlert({ type: "error", msg: "Username dan password wajib diisi." });
      return;
    }
    setLoading(true);
    setAlert(null);

    try {
      const data = await loginApi(formData.username, formData.password);
      login(data); // simpan ke context + localStorage

      const destination = ROLE_ROUTES[data.user.role] ?? '/dashboard';
      navigate(destination);
      console.log(destination);

    } catch (err) {
      console.log(err.response?.data);
      setAlert({
        type: 'error',
        msg: err.response?.data?.payload?.message || 'Login gagal. Periksa kredensial Anda.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="login-wrapper" style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.5s ease" }}>

        {/* LEFT PANEL */}
        <div className="left-panel">
          <div className="brand-area">
            <h1 className="brand-name">Choco<span>Celuv</span></h1>
            <p className="brand-sub">Manajemen Stok & Penjualan</p>
            <div className="divider-line" />

            <div className="feature-list">
              {[
                { icon: "📦", title: "Manajemen Stok", desc: "Pantau stok minuman real-time" },
                { icon: "💰", title: "Rekap Penjualan", desc: "Laporan harian & bulanan" },
                { icon: "📊", title: "Analitik Data", desc: "Grafik & statistik penjualan" },
                // { icon: "🔔", title: "Notifikasi Stok", desc: "Peringatan stok menipis" },
              ].map((f, i) => (
                <div className="feature-item" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="feature-icon">{f.icon}</div>
                  <div className="feature-text">
                    <p>{f.title}</p>
                    <span>{f.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <p className="version-tag">v1.0.0 — Choco Celuv Management System</p>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="right-panel">
          <div className="form-container">

            {/* Mobile brand */}
            <div className="mobile-brand">
              <div className="mobile-icon">🍫</div>
              <div className="mobile-brand-text">
                <h2>Choco<span>Celuv</span></h2>
                <p>Manajemen Stok & Penjualan</p>
              </div>
            </div>

            <div className="form-header">
              <div className="welcome-tag">Selamat Datang</div>
              <h2 className="form-title">
                Masuk ke <span>Dashboard</span>
              </h2>
              <p className="form-subtitle">
                Silakan masukkan kredensial Anda untuk mengakses sistem manajemen Choco Celuv.
              </p>
            </div>

            {alert && (
              <div className={`alert alert-${alert.type}`}>
                <span>{alert.type === "error" ? "⚠️" : "✅"}</span>
                {alert.msg}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="username"> Username</label>
                <div className="input-wrapper">
                  <span className="input-icon">✉️</span>
                  <input
                    className="form-input"
                    id="username"
                    type="text"
                    name="username"
                    placeholder="chocoçeluv"
                    value={formData.username}
                    onChange={handleChange}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    className="form-input"
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Masukkan password Anda"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    style={{ paddingRight: "48px" }}
                  />
                  <button
                    type="button"
                    className="toggle-pw"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div className="options-row">
                <label className="remember-label">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={formData.remember}
                    onChange={handleChange}
                  />
                  Ingat saya
                </label>
                <a href="#" className="forgot-link">Lupa password?</a>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                <span className="btn-inner">
                  {loading ? (
                    <>
                      <span className="spinner" />
                      Memverifikasi...
                    </>
                  ) : (
                    <>
                      Masuk ke Dashboard →
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* <div className="form-footer">
              <p className="footer-text">
                © 2025 Choco Celuv Management System · Semua hak dilindungi
              </p>
            </div> */}
          </div>
        </div>

      </div>
    </>
  );
}
