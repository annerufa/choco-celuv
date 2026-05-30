import { useState } from "react";
import { useApi } from '../../hooks/useApi';

function IconBack() {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>;
}
function IconChevron() {
    return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>;
}

function fmt(val) {
    return Number(val ?? 0).toLocaleString('id-ID');
}
function formatTgl(dt) {
    if (!dt) return '–';
    return new Date(dt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatJam(dt) {
    if (!dt) return '–';
    return new Date(dt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}
function defaultRange() {
    const end = new Date().toISOString().slice(0, 10);
    const start = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
    return { start, end };
}

// ── Sub-pages ─────────────────────────────────────────────────

function RekapPenjualan({ onBack }) {
    const [range, setRange] = useState(defaultRange());
    const { data, loading } = useApi(`/sales/rekap/penjualan?start=${range.start}&end=${range.end}`);
    const summary = data?.summary ?? {};
    const list = Array.isArray(data?.list) ? data.list : [];

    return (
        <div className="page">
            <div className="phead">
                <div className="phead-row">
                    <button className="btnBack" onClick={onBack}><IconBack /></button>
                    <div style={{ flex: 1 }}>
                        <div className="ptitle">Rekap Penjualan</div>
                        <div className="psub">Riwayat transaksi saya</div>
                    </div>
                </div>
            </div>

            <div className="pbody" style={{ paddingBottom: 24 }}>
                {/* Filter tanggal */}
                <DateRangeFilter range={range} onChange={setRange} />

                {/* Summary */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                    {[
                        { label: 'Total Penjualan', val: `Rp ${fmt(summary.total_penjualan)}`, bg: 'var(--greensoft)', color: 'var(--green)' },
                        { label: 'Transaksi', val: summary.total_transaksi ?? 0, bg: 'var(--bluesoft)', color: 'var(--blue)' },
                    ].map(({ label, val, bg, color }) => (
                        <div key={label} style={{ flex: 1, background: 'var(--bg0)', borderRadius: 14, border: '1px solid var(--border)', padding: '13px 14px' }}>
                            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{label}</div>
                            <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text1)' }}>{val}</div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'var(--greensoft)', color: 'var(--green)' }}>
                                    Tunai {summary.tunai ?? 0}
                                </span>
                                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'var(--bluesoft)', color: 'var(--blue)' }}>
                                    QRIS {summary.qris ?? 0}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* List */}
                <div className="sec-title">Transaksi</div>
                <ListState loading={loading} empty={list.length === 0} emptyText="Tidak ada transaksi di rentang ini">
                    <div className="act-list">
                        {list.map(trx => (
                            <div key={trx.id} className="act-item">
                                <div className="act-ic" style={{ background: 'var(--greensoft)' }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" style={{ width: 15, height: 15 }}>
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="act-ttl">#{String(trx.id).padStart(4, '0')}</div>
                                    <div className="act-sub" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{trx.items_label}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                                        <span style={{
                                            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                                            background: trx.payment_method === 'qris' ? 'var(--bluesoft)' : 'var(--greensoft)',
                                            color: trx.payment_method === 'qris' ? 'var(--blue)' : 'var(--green)',
                                        }}>{trx.payment_method === 'qris' ? 'QRIS' : 'Tunai'}</span>
                                        <span style={{ fontSize: 10, color: 'var(--text3)' }}>{trx.booth_name}</span>
                                    </div>
                                </div>
                                <div className="act-r">
                                    <div className="act-amt" style={{ color: 'var(--green)' }}>+Rp {fmt(trx.grand_total)}</div>
                                    <div className="act-time">{formatTgl(trx.created_at)} {formatJam(trx.created_at)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ListState>
            </div>
        </div>
    );
}

function RekapPembelian({ onBack }) {
    const [range, setRange] = useState(defaultRange());
    const { data, loading } = useApi(`/purchases/rekap/pembelian?start=${range.start}&end=${range.end}`);
    const summary = data?.summary ?? {};
    const list = Array.isArray(data?.list) ? data.list : [];

    return (
        <div className="page">
            <div className="phead">
                <div className="phead-row">
                    <button className="btnBack" onClick={onBack}><IconBack /></button>
                    <div style={{ flex: 1 }}>
                        <div className="ptitle">Rekap Pembelian</div>
                        <div className="psub">Riwayat pembelian saya</div>
                    </div>
                </div>
            </div>

            <div className="pbody" style={{ paddingBottom: 24 }}>
                <DateRangeFilter range={range} onChange={setRange} />

                <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                    {[
                        { label: 'Total Pembelian', val: summary.total_pembelian ?? 0 },
                        { label: 'Total Nilai', val: `Rp ${fmt(summary.total_nilai)}` },
                    ].map(({ label, val }) => (
                        <div key={label} style={{ flex: 1, background: 'var(--bg0)', borderRadius: 14, border: '1px solid var(--border)', padding: '13px 14px' }}>
                            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{label}</div>
                            <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text1)' }}>{val}</div>
                        </div>
                    ))}
                </div>

                <div className="sec-title">Pembelian</div>
                <ListState loading={loading} empty={list.length === 0} emptyText="Tidak ada pembelian di rentang ini">
                    <div className="act-list">
                        {list.map(p => (
                            <div key={p.id} className="act-item">
                                <div className="act-ic" style={{ background: 'var(--accentsoft)' }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" style={{ width: 15, height: 15 }}>
                                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
                                    </svg>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="act-ttl">{p.supplier}</div>
                                    <div className="act-sub">{formatTgl(p.date)}</div>
                                </div>
                                <div className="act-r">
                                    <div className="act-amt" style={{ color: 'var(--accent)' }}>Rp {fmt(p.total)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ListState>
            </div>
        </div>
    );
}

function RekapDistribusi({ onBack }) {
    const [range, setRange] = useState(defaultRange());
    const { data, loading } = useApi(`/distributions/rekap/distribusi?start=${range.start}&end=${range.end}`);
    const summary = data?.summary ?? {};
    const list = Array.isArray(data?.list) ? data.list : [];

    const statusStyle = {
        sesuai: { bg: 'var(--greensoft)', color: 'var(--green)' },
        kurang: { bg: 'var(--accentsoft)', color: 'var(--accent)' },
        diterima: { bg: 'var(--bluesoft)', color: 'var(--blue)' },
    };

    return (
        <div className="page">
            <div className="phead">
                <div className="phead-row">
                    <button className="btnBack" onClick={onBack}><IconBack /></button>
                    <div style={{ flex: 1 }}>
                        <div className="ptitle">Rekap Distribusi</div>
                        <div className="psub">Distribusi yang saya konfirmasi</div>
                    </div>
                </div>
            </div>

            <div className="pbody" style={{ paddingBottom: 24 }}>
                <DateRangeFilter range={range} onChange={setRange} />

                <div style={{ background: 'var(--bg0)', borderRadius: 14, border: '1px solid var(--border)', padding: '13px 14px', marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Total Dikonfirmasi</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text1)' }}>{summary.total_distribusi ?? 0}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>distribusi</div>
                </div>

                <div className="sec-title">Distribusi</div>
                <ListState loading={loading} empty={list.length === 0} emptyText="Tidak ada distribusi di rentang ini">
                    <div className="act-list">
                        {list.map(d => {
                            const ss = statusStyle[d.status] ?? { bg: 'var(--bg2)', color: 'var(--text3)' };
                            return (
                                <div key={d.id} className="act-item">
                                    <div className="act-ic" style={{ background: ss.bg }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke={ss.color} strokeWidth="2" style={{ width: 15, height: 15 }}>
                                            <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
                                        </svg>
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className="act-ttl">Distribusi #{d.id}</div>
                                        <div className="act-sub">{d.dari} → {d.ke}</div>
                                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, marginTop: 3, display: 'inline-block', background: ss.bg, color: ss.color }}>
                                            {d.status}
                                        </span>
                                    </div>
                                    <div className="act-r">
                                        <div className="act-time">{formatTgl(d.confirmed_at_booth)}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ListState>
            </div>
        </div>
    );
}

// ── Shared helpers ────────────────────────────────────────────

function DateRangeFilter({ range, onChange }) {
    return (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
            <input
                type="date"
                value={range.start}
                onChange={e => onChange(r => ({ ...r, start: e.target.value }))}
                style={dateInputStyle}
            />
            <span style={{ fontSize: 12, color: 'var(--text3)', flexShrink: 0 }}>–</span>
            <input
                type="date"
                value={range.end}
                onChange={e => onChange(r => ({ ...r, end: e.target.value }))}
                style={dateInputStyle}
            />
        </div>
    );
}

function ListState({ loading, empty, emptyText, children }) {
    if (loading) return (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)', fontSize: 13 }}>Memuat...</div>
    );
    if (empty) return (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>📋</div>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>{emptyText}</div>
        </div>
    );
    return children;
}

const dateInputStyle = {
    flex: 1, padding: '9px 12px', borderRadius: 11,
    border: '1px solid var(--border2)', background: 'var(--bg0)',
    fontSize: 12, fontWeight: 600, color: 'var(--text1)',
    fontFamily: 'inherit', outline: 'none',
};

// ── Main RekapPage ────────────────────────────────────────────

export default function RekapPage({ setPage }) {
    const [sub, setSub] = useState(null); // null | 'penjualan' | 'pembelian' | 'distribusi'

    if (sub === 'penjualan') return <RekapPenjualan onBack={() => setSub(null)} />;
    if (sub === 'pembelian') return <RekapPembelian onBack={() => setSub(null)} />;
    if (sub === 'distribusi') return <RekapDistribusi onBack={() => setSub(null)} />;

    return (
        <div className="page">
            <div className="phead">
                <div className="phead-row">
                    <div style={{ flex: 1 }}>
                        <div className="ptitle">Rekap</div>
                        <div className="psub">Riwayat aktivitas saya</div>
                    </div>
                </div>
            </div>

            <div className="pbody">
                <div className="mgrp">
                    <div className="mgrp-title">Pilih Rekap</div>
                    <div className="mitems">
                        {[
                            { id: 'penjualan', label: 'Rekap Penjualan', sub: 'Semua transaksi kasir saya', bg: 'var(--greensoft)', color: 'var(--green)' },
                            { id: 'pembelian', label: 'Rekap Pembelian', sub: 'Pembelian yang saya buat', bg: 'var(--accentsoft)', color: 'var(--accent)' },
                            { id: 'distribusi', label: 'Rekap Distribusi', sub: 'Distribusi yang saya konfirmasi', bg: 'var(--bluesoft)', color: 'var(--blue)' },
                        ].map(({ id, label, sub, bg, color }) => (
                            <div key={id} className="mrow" onClick={() => setSub(id)} style={{ cursor: 'pointer' }}>
                                <div className="mic" style={{ background: bg, color }}>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="mtitle">{label}</div>
                                    <div className="msub">{sub}</div>
                                </div>
                                <div className="mchev"><IconChevron /></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}