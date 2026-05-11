
function HomePage({ role, setPage }) {
    const r = ROLES[role];
    return (
        <div className="page">
            <div className="phead">
                <div className="phead-row">
                    <div>
                        <div className="ptitle">Hai, {r.name.split(" ")[0]} 👋</div>
                        <div className="psub">{r.sub}</div>
                    </div>
                    <div className="ava" style={{ background: r.avaGrad, color: "#0e0a07" }}>{r.init}</div>
                </div>
            </div>
            <div className="pbody">
                {/* HERO */}
                {role === "kurir" ? (
                    <div className="hero">
                        <div className="hero-lbl">Pengiriman Hari Ini</div>
                        <div className="hero-val">18 Order</div>
                        <div className="hero-tag">
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                            6 terkirim · 12 pending
                        </div>
                        <div className="hero-minis">
                            <div className="hmini"><div className="hmini-lbl">Jarak Tempuh</div><div className="hmini-val">34 km</div></div>
                            <div className="hmini"><div className="hmini-lbl">Avg. Waktu</div><div className="hmini-val">22 mnt</div></div>
                            <div className="hmini"><div className="hmini-lbl">Status</div><div className="hmini-val" style={{ color: "var(--green)" }}>Aktif</div></div>
                        </div>
                    </div>
                ) : (
                    <div className="hero">
                        <div className="hero-lbl">Penjualan Hari Ini</div>
                        <div className="hero-val">Rp 3,85jt</div>
                        <div className="hero-tag">
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                            +9.3% vs kemarin
                        </div>
                        <div className="hero-minis">
                            <div className="hmini"><div className="hmini-lbl">Transaksi</div><div className="hmini-val">31</div></div>
                            <div className="hmini"><div className="hmini-lbl">Avg. Order</div><div className="hmini-val">124rb</div></div>
                            <div className="hmini"><div className="hmini-lbl">QRIS</div><div className="hmini-val">68%</div></div>
                        </div>
                    </div>
                )}

                {/* STAT CARDS */}
                {role === "kurir" ? (
                    <div className="sgrid">
                        <div className="scard" onClick={() => setPage("stok")}>
                            <div className="sicon" style={{ background: "var(--bluesoft)", color: "var(--blue)" }}><IconStok /></div>
                            <div className="sval">47</div>
                            <div className="slbl">Stok Barang</div>
                            <div className="sbadge" style={{ background: "var(--accentsoft)", color: "var(--accent)" }}>3 menipis</div>
                        </div>
                        <div className="scard" onClick={() => setPage("absensi")}>
                            <div className="sicon" style={{ background: "var(--greensoft)", color: "var(--green)" }}><IconAbsensi /></div>
                            <div className="sval">Hadir</div>
                            <div className="slbl">Status Hari Ini</div>
                            <div className="sbadge" style={{ background: "var(--greensoft)", color: "var(--green)" }}>07:52 masuk</div>
                        </div>
                    </div>
                ) : (
                    <div className="sgrid">
                        <div className="scard" onClick={() => setPage("kasir")}>
                            <div className="sicon" style={{ background: "var(--accentsoft)", color: "var(--accent)" }}><IconKasir /></div>
                            <div className="sval">31</div>
                            <div className="slbl">Transaksi</div>
                            <div className="sbadge" style={{ background: "var(--greensoft)", color: "var(--green)" }}>aktif</div>
                        </div>
                        <div className="scard" onClick={() => setPage("stok")}>
                            <div className="sicon" style={{ background: "var(--bluesoft)", color: "var(--blue)" }}><IconStok /></div>
                            <div className="sval">142</div>
                            <div className="slbl">Produk</div>
                            <div className="sbadge" style={{ background: "var(--accentsoft)", color: "var(--accent)" }}>8 menipis</div>
                        </div>
                    </div>
                )}

                {/* AKTIVITAS */}
                <div className="sec-title">Aktivitas Terbaru</div>
                <div className="act-list">
                    {role === "kurir" ? (
                        <>
                            <div className="act-item">
                                <div className="act-ic" style={{ background: "var(--greensoft)" }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                </div>
                                <div><div className="act-ttl">Order #ORD-2841 Terkirim</div><div className="act-sub">Jl. Merdeka No.12</div></div>
                                <div className="act-r"><div className="act-amt" style={{ color: "var(--green)" }}>Selesai</div><div className="act-time">09:22</div></div>
                            </div>
                            <div className="act-item">
                                <div className="act-ic" style={{ background: "var(--accentsoft)" }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><circle cx="12" cy="10" r="3" /><path d="M12 2a8 8 0 0 1 8 8c0 5.5-8 12-8 12S4 15.5 4 10a8 8 0 0 1 8-8z" /></svg>
                                </div>
                                <div><div className="act-ttl">Order #ORD-2842 Dalam Perjalanan</div><div className="act-sub">Jl. Pahlawan No.5</div></div>
                                <div className="act-r"><div className="act-amt" style={{ color: "var(--accent)" }}>Proses</div><div className="act-time">09:35</div></div>
                            </div>
                            <div className="act-item">
                                <div className="act-ic" style={{ background: "var(--bluesoft)" }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                </div>
                                <div><div className="act-ttl">Order #ORD-2843 Pending</div><div className="act-sub">Jl. Sudirman No.88</div></div>
                                <div className="act-r"><div className="act-amt" style={{ color: "var(--blue)" }}>Antri</div><div className="act-time">09:40</div></div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="act-item">
                                <div className="act-ic" style={{ background: "var(--greensoft)" }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                                </div>
                                <div><div className="act-ttl">Transaksi #INV-0312</div><div className="act-sub">QRIS · 3 item</div></div>
                                <div className="act-r"><div className="act-amt" style={{ color: "var(--green)" }}>+Rp 95.000</div><div className="act-time">09:38</div></div>
                            </div>
                            <div className="act-item">
                                <div className="act-ic" style={{ background: "var(--accentsoft)" }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                                </div>
                                <div><div className="act-ttl">Stok Menipis</div><div className="act-sub">Coklat Bubuk — sisa 2 kg</div></div>
                                <div className="act-r"><div className="act-amt" style={{ color: "var(--accent)" }}>Peringatan</div><div className="act-time">09:15</div></div>
                            </div>
                            <div className="act-item">
                                <div className="act-ic" style={{ background: "var(--greensoft)" }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                                </div>
                                <div><div className="act-ttl">Transaksi #INV-0311</div><div className="act-sub">Tunai · 2 item</div></div>
                                <div className="act-r"><div className="act-amt" style={{ color: "var(--green)" }}>+Rp 50.000</div><div className="act-time">09:02</div></div>
                            </div>
                        </>
                    )}
                </div>
                <div style={{ height: 20 }} />
            </div>
        </div>
    );
}