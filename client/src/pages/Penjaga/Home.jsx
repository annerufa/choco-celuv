import styles from './Home.module.css'

const STATS = [
  { label: 'Penjualan Hari Ini', value: 'Rp 482K', sub: '+12% dari kemarin', icon: 'ti-trending-up', mod: 'accent' },
  { label: 'Cup Terjual',         value: '38',       sub: 'Target: 50 cup',    icon: 'ti-cup',        mod: 'success' },
  { label: 'Stok Bahan',          value: '72%',      sub: '3 bahan perlu beli',icon: 'ti-package',    mod: 'warning' },
  { label: 'Produksi',            value: '4×',       sub: '48 cup dibuat',     icon: 'ti-tool',       mod: 'neutral' },
]

const RECENT = [
  { name: 'Kopi Susu Gula Aren ×2', time: '14:32 — Tunai',     amount: 'Rp 34K' },
  { name: 'Matcha Latte ×1',        time: '14:10 — QRIS',      amount: 'Rp 22K' },
  { name: 'Es Cokelat ×3',          time: '13:55 — Transfer',  amount: 'Rp 51K' },
  { name: 'Taro Latte ×1',          time: '13:30 — Tunai',     amount: 'Rp 20K' },
]

export default function Home({ navigate }) {
  return (
    <div className={styles.page}>
      {/* Hero Header */}
      <div className={styles.hero}>
        <div className={styles.heroOrb1} aria-hidden="true" />
        <div className={styles.heroOrb2} aria-hidden="true" />
        <div className={styles.heroContent}>
          <p className={styles.greeting}>Selamat datang kembali 👋</p>
          <h2 className={styles.heroName}>Ahmad Fauzi</h2>
          <div className={styles.boothChip}>
            <i className="ti ti-map-pin" aria-hidden="true" />
            Booth Utama — Mall X, Lt.1
          </div>
        </div>

        <div className={styles.dateChip}>
          <i className="ti ti-calendar" aria-hidden="true" />
          Senin, 11 Mei 2026
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        {STATS.map((s) => (
          <div key={s.label} className={`${styles.statCard} ${styles[s.mod]}`}>
            <i className={`ti ${s.icon} ${styles.statIcon}`} aria-hidden="true" />
            <p className={styles.statLabel}>{s.label}</p>
            <p className={styles.statValue}>{s.value}</p>
            <p className={styles.statSub}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick Menu */}
      <p className={styles.sectionTitle}>Menu Cepat</p>
      <div className={styles.quickGrid}>
        <button className={styles.quickCard} onClick={() => navigate?.('distribusi')}>
          <div className={`${styles.quickIcon} ${styles.deliveryIcon}`}>
            <i className="ti ti-truck" aria-hidden="true" />
          </div>
          <div className={styles.quickInfo}>
            <p className={styles.quickLabel}>Verifikasi Kiriman</p>
            <p className={styles.quickSub}>Dari gudang pusat</p>
          </div>
          <span className={`${styles.quickBadge} ${styles.badgeAccent}`}>2 pending</span>
        </button>

        <button className={styles.quickCard} onClick={() => navigate?.('pembelian')}>
          <div className={`${styles.quickIcon} ${styles.purchaseIcon}`}>
            <i className="ti ti-shopping-cart" aria-hidden="true" />
          </div>
          <div className={styles.quickInfo}>
            <p className={styles.quickLabel}>Pembelian</p>
            <p className={styles.quickSub}>Catat bahan baku</p>
          </div>
          <span className={`${styles.quickBadge} ${styles.badgeSuccess}`}>Rp 320K</span>
        </button>
      </div>

      {/* Recent Transactions */}
      <p className={styles.sectionTitle}>Transaksi Terkini</p>
      <div className={styles.recentList}>
        {RECENT.map((r, i) => (
          <div key={i} className={styles.recentItem}>
            <div className={styles.recentIco}>
              <i className="ti ti-receipt" aria-hidden="true" />
            </div>
            <div className={styles.recentInfo}>
              <p className={styles.recentName}>{r.name}</p>
              <p className={styles.recentTime}>{r.time}</p>
            </div>
            <p className={styles.recentAmount}>{r.amount}</p>
          </div>
        ))}
      </div>

      <div className={styles.bottomSpace} />
    </div>
  )
}
