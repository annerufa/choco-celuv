import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';

function IconBack() {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>;
}
function IconTunai() {
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="3" /></svg>;
}
function IconQris() {
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><line x1="14" y1="14" x2="14" y2="14" /><line x1="17" y1="14" x2="21" y2="14" /><line x1="14" y1="17" x2="14" y2="21" /><line x1="17" y1="20" x2="21" y2="20" /><line x1="21" y1="17" x2="21" y2="17" /></svg>;
}

function fmt(val) {
    return Number(val ?? 0).toLocaleString('id-ID');
}

function formatJam(dt) {
    if (!dt) return '–';
    return new Date(dt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function formatTanggal() {
    return new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function RekapShift({ setPage, prevPage = 'home' }) {
    const { user } = useAuth();
    const { data, loading, error } = useApi('/sales/shift-summary');

    const summary = data?.summary ?? {};
    const transaksi = Array.isArray(data?.transaksi) ? data.transaksi : [];

    return (
        <div className="page">
            {/* HEADER */}
            <div className="phead">
                <div className="phead-row">
                    <button className="btnBack" onClick={() => setPage(prevPage)}><IconBack /></button>

                    <div style={{ flex: 1 }}>
                        <div className="ptitle">Laporan Shift</div>
                        <div className="psub">{formatTanggal()}</div>
                    </div>
                </div>
            </div>

            <div className="pbody" style={{ paddingBottom: 24 }}>

                {/* HERO total penjualan */}
                <div className="hero" style={{ marginBottom: 14 }}>
                    <div className="hero-lbl">Total Penjualan Hari Ini</div>
                    <div className="hero-val">Rp {fmt(summary.total_penjualan)}</div>
                    <div className="hero-minis">
                        <div className="hmini">
                            <div className="hmini-lbl">Transaksi</div>
                            <div className="hmini-val">{summary.total_transaksi ?? 0}</div>
                        </div>
                        <div className="hmini">
                            <div className="hmini-lbl">Avg. Order</div>
                            <div className="hmini-val">Rp {fmt(summary.avg_order)}</div>
                        </div>
                    </div>
                </div>

                {/* Metode Pembayaran */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
                    {[
                        { label: 'Tunai', val: summary.tunai ?? 0, icon: <IconTunai />, bg: 'var(--greensoft)', color: 'var(--green)' },
                        { label: 'QRIS', val: summary.qris ?? 0, icon: <IconQris />, bg: 'var(--bluesoft)', color: 'var(--blue)' },
                    ].map(({ label, val, icon, bg, color }) => (
                        <div key={label} style={{
                            flex: 1, background: 'var(--bg0)', borderRadius: 14,
                            border: '1px solid var(--border)', padding: '13px 14px',
                            boxShadow: '0 1px 4px rgba(100,70,20,0.06)',
                        }}>
                            <div style={{
                                width: 30, height: 30, borderRadius: 9,
                                background: bg, color, display: 'flex',
                                alignItems: 'center', justifyContent: 'center', marginBottom: 8,
                            }}>
                                {icon}
                            </div>
                            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text1)' }}>{val}</div>
                            <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{label}</div>
                        </div>
                    ))}
                </div>

                {/* Daftar Transaksi */}
                <div className="sec-title">Riwayat Transaksi</div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)', fontSize: 13 }}>
                        Memuat data...
                    </div>
                ) : error ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--red)', fontSize: 13 }}>{error}</div>
                ) : transaksi.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>🧾</div>
                        <div style={{ fontSize: 13, color: 'var(--text3)' }}>Belum ada transaksi hari ini</div>
                    </div>
                ) : (
                    <div className="act-list">
                        {transaksi.map((trx) => (
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
                                    <div style={{ marginTop: 3 }}>
                                        <span style={{
                                            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                                            background: trx.payment_method === 'qris' ? 'var(--bluesoft)' : 'var(--greensoft)',
                                            color: trx.payment_method === 'qris' ? 'var(--blue)' : 'var(--green)',
                                        }}>
                                            {trx.payment_method === 'qris' ? 'QRIS' : 'Tunai'}
                                        </span>
                                    </div>
                                </div>
                                <div className="act-r">
                                    <div className="act-amt" style={{ color: 'var(--green)' }}>+Rp {fmt(trx.grand_total)}</div>
                                    <div className="act-time">{formatJam(trx.created_at)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}