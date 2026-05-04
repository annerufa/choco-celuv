import { useState, useEffect } from 'react';
import styles from './Login.module.css';

const features = [
  { icon: '📦', title: 'Manajemen Stok', desc: 'Pantau stok minuman real-time' },
  { icon: '💰', title: 'Rekap Penjualan', desc: 'Laporan harian & bulanan' },
  { icon: '📊', title: 'Analitik Data', desc: 'Grafik & statistik penjualan' },
];

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '', remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (alert) setAlert(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setAlert({ type: 'error', msg: 'Email dan password wajib diisi.' });
      return;
    }
    setLoading(true);
    setAlert(null);

    // Simulate API call
    await new Promise(r => setTimeout(r, 1800));

    setAlert({ type: 'success', msg: 'Login berhasil! Mengalihkan ke dashboard...' });
    setLoading(false);
  }

  return (
    <div
      className={styles.loginWrapper}
      style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease' }}
    >

      {/* ── LEFT PANEL ── */}
      <div className={styles.leftPanel}>
        <div className={styles.brandArea}>

          {/* <div className={styles.chocoIconWrapper}>
            <div className={styles.chocoIconBg}>🍫</div>
            <span className={styles.badge}>ADMIN</span>
          </div> */}

          <h1 className={styles.brandName}>Choco<span>Celuv</span></h1>
          <p className={styles.brandSub}>Manajemen Stok & Penjualan</p>
          <div className={styles.dividerLine} />

          <div className={styles.featureList}>
            {features.map((f, i) => (
              <div
                key={i}
                className={styles.featureItem}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className={styles.featureIcon}>{f.icon}</div>
                <div className={styles.featureText}>
                  <p>{f.title}</p>
                  <span>{f.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <p className={styles.versionTag}>v1.0.0 — Choco Celuv Management System</p>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className={styles.rightPanel}>
        <div className={styles.formContainer}>

          {/* Mobile brand — hanya muncul di layar kecil */}
          <div className={styles.mobileBrand}>
            <div className={styles.mobileIcon}>🍫</div>
            <div className={styles.mobileBrandText}>
              <h2>Choco<span>Celuv</span></h2>
              <p>Manajemen Stok & Penjualan</p>
            </div>
          </div>

          {/* Form header */}
          <div className={styles.formHeader}>
            <div className={styles.welcomeTag}>Selamat Datang</div>
            <h2 className={styles.formTitle}>
              Masuk ke <span>Dashboard</span>
            </h2>
            <p className={styles.formSubtitle}>
              Silakan masukkan kredensial Anda untuk mengakses sistem manajemen Choco Celuv.
            </p>
          </div>

          {/* Alert */}
          {alert && (
            <div className={`${styles.alert} ${alert.type === 'error' ? styles.alertError : styles.alertSuccess}`}>
              <span>{alert.type === 'error' ? '⚠️' : '✅'}</span>
              {alert.msg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>

            {/* Email */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="email">
                Email / Username
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>✉️</span>
                <input
                  className={styles.formInput}
                  id="email"
                  type="text"
                  name="email"
                  placeholder="admin@chocoçeluv.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="password">
                Password
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>🔒</span>
                <input
                  className={styles.formInput}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Masukkan password Anda"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  style={{ paddingRight: '48px' }}
                />
                <button
                  type="button"
                  className={styles.togglePw}
                  onClick={() => setShowPassword(p => !p)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className={styles.optionsRow}>
              <label className={styles.rememberLabel}>
                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                />
                Ingat saya
              </label>
              <a href="#" className={styles.forgotLink}>Lupa password?</a>
            </div>

            {/* Submit */}
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              <span className={styles.btnInner}>
                {loading ? (
                  <>
                    <span className={styles.spinner} />
                    Memverifikasi...
                  </>
                ) : (
                  <>Masuk ke Dashboard →</>
                )}
              </span>
            </button>

          </form>

          {/* Footer — uncomment kalau mau dipakai */}
          {/* <div className={styles.formFooter}>
            <p className={styles.footerText}>
              © 2025 Choco Celuv Management System · Semua hak dilindungi
            </p>
          </div> */}

        </div>
      </div>

    </div>
  );
}
