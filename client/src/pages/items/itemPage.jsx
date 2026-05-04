import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Pill from '../../components/ui/Pill';
import { getAllItems, createItems, updateItems, deleteItems } from '../../services/itemService';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const KATEGORI_PILL = {
    'Bahan Baku': 'accent',
    'Hasil Mixing': 'brown',
    'Perlengkapan': 'warning',
    'Consumable': 'brown',
};

const STATUS_PILL = {
    'Aktif': 'success',
    'Stok Kritis': 'warning',
    'Nonaktif': 'danger',
};

const EMPTY_FORM = { nam: '', kategori: 'Bahan Baku', satuan: 'gram', hpp: '', status: 'Aktif' };

// ─── Sub-komponen: Stat Card ───────────────────────────────────────────────────
function StatCard({ icon, iconType, value, label, change, changeType }) {
    return (
        <div className="stat-card">
            <div className={`stat-icon ${iconType}`}>{icon}</div>
            <div className="stat-info">
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
                {change && (
                    <div className={`stat-change ${changeType}`}>
                        {changeType === 'up'
                            ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15" /></svg>
                            : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                        }
                        {change}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Sub-komponen: Modal Form ──────────────────────────────────────────────────
function ProductModal({ form, onChange, onSubmit, onClose, isEdit }) {
    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                <div className="modal-header">
                    <span className="modal-title">{isEdit ? 'Edit Barang' : 'Tambah Barang Baru'}</span>
                    <button className="icon-btn" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                </div>

                <div className="modal-body">
                    <div className="form-group">
                        <label className="form-label">Nama Barang *</label>
                        <input className="form-input" value={form.nama} onChange={e => onChange('nama', e.target.value)} placeholder="cth: Bubuk Coklat Premium" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label className="form-label">Kategori *</label>
                            <select className="form-select" value={form.kategori} onChange={e => onChange('kategori', e.target.value)}>
                                <option>Bahan Baku</option>
                                <option>Hasil Mixing</option>
                                <option>Perlengkapan</option>
                                <option>Consumable</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Satuan *</label>
                            <select className="form-select" value={form.satuan} onChange={e => onChange('satuan', e.target.value)}>
                                <option>gram</option>
                                <option>ml</option>
                                <option>pcs</option>
                                <option>kg</option>
                                <option>liter</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label className="form-label">HPP per satuan (Rp)</label>
                            <input className="form-input" type="number" value={form.hpp} onChange={e => onChange('hpp', e.target.value)} placeholder="cth: 150" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select className="form-select" value={form.status} onChange={e => onChange('status', e.target.value)}>
                                <option>Aktif</option>
                                <option>Stok Kritis</option>
                                <option>Nonaktif</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-ghost" onClick={onClose}>Batal</button>
                    <button className="btn btn-primary" onClick={onSubmit}>
                        {isEdit ? 'Simpan Perubahan' : 'Tambah Barang'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Halaman utama ─────────────────────────────────────────────────────────────
export default function ItemPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [page, setPage] = useState(1);
    const PER_PAGE = 5;

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const data = await getAllItems();
            setProducts(data);
        } catch (err) {
            console.error(err);
            // fallback data sementara kalau API belum jalan
            setProducts([
                { id: 1, nama: 'Bubuk Coklat Premium', kategori: 'Bahan Baku', satuan: 'gram', hpp: 150, status: 'Aktif' },
                { id: 2, nama: 'Susu Full Cream', kategori: 'Bahan Baku', satuan: 'ml', hpp: 20, status: 'Aktif' },
                { id: 3, nama: 'Base Coklat Mix', kategori: 'Hasil Mixing', satuan: 'gram', hpp: 90, status: 'Aktif' },
                { id: 4, nama: 'Cup Plastik 16oz', kategori: 'Perlengkapan', satuan: 'pcs', hpp: 800, status: 'Aktif' },
                { id: 5, nama: 'Es Batu', kategori: 'Consumable', satuan: 'gram', hpp: 5, status: 'Stok Kritis' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProducts(); }, []);

    // Filter & pagination
    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.kategori.toLowerCase().includes(search.toLowerCase())
    );
    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    // Stats
    const totalAktif = products.filter(p => p.status === 'Aktif').length;
    const bahanBaku = products.filter(p => p.kategori === 'Bahan Baku').length;
    const perlengkapan = products.filter(p => p.kategori === 'Perlengkapan').length;
    const stokKritis = products.filter(p => p.status === 'Stok Kritis').length;

    // Form handlers
    const handleOpenAdd = () => { setForm(EMPTY_FORM); setEditId(null); setModalOpen(true); };
    const handleEdit = (p) => {
        setForm({ nama: p.nama, kategori: p.kategori, satuan: p.satuan, hpp: p.hpp, status: p.status });
        setEditId(p.id);
        setModalOpen(true);
    };
    const handleChange = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

    const handleSubmit = async () => {
        try {
            if (editId) {
                await updateProduct(editId, form);
            } else {
                await createProduct(form);
            }
            setModalOpen(false);
            fetchProducts();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id, nama) => {
        if (!window.confirm(`Yakin nonaktifkan "${nama}"?`)) return;
        try {
            await deleteProduct(id);
            fetchProducts();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <>
            {/* ── Page header ── */}
            <div className="page-header">
                <div className="breadcrumb">
                    <span>Data Master</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                    Data Barang
                </div>
                <h1 className="page-title">Data Barang</h1>
                <p className="page-subtitle">Kelola semua barang, bahan baku, dan perlengkapan</p>
            </div>

            {/* ── Stat cards ── */}
            <div className="stats-grid">
                <StatCard
                    iconType="brown" value={totalAktif} label="Total barang aktif"
                    change="+2 bulan ini" changeType="up"
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>}
                />
                <StatCard
                    iconType="accent" value={bahanBaku} label="Bahan baku"
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>}
                />
                <StatCard
                    iconType="success" value={perlengkapan} label="Perlengkapan & packing"
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>}
                />
                <StatCard
                    iconType="warning" value={stokKritis} label="Stok kritis"
                    change="Perlu restock" changeType="down"
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>}
                />
            </div>

            {/* ── Tabel card ── */}
            <div className="card">
                <div className="card-header">
                    <span className="card-title">Daftar Barang</span>
                    <div className="card-actions">
                        <div className="search-box">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="text" placeholder="Cari barang..."
                                value={search}
                                onChange={e => { setSearch(e.target.value); setPage(1); }}
                            />
                        </div>
                        <button className="btn btn-ghost">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                            Filter
                        </button>
                        {/* Tombol Tambah hanya muncul untuk admin */}
                        {isAdmin && (
                            <button className="btn btn-primary" onClick={handleOpenAdd}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                Tambah Barang
                            </button>
                        )}
                    </div>
                </div>

                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Nama Barang</th>
                                <th>Kategori</th>
                                <th>Satuan</th>
                                <th>HPP Rata-rata</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr className="loading-row">
                                    <td colSpan="7">Memuat data...</td>
                                </tr>
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td colSpan="7">
                                        <div className="empty-state">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
                                            <p>Tidak ada barang ditemukan</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((p, i) => (
                                    <tr key={p.id}>
                                        <td style={{ color: 'var(--brown-400)', fontFamily: 'var(--mono)', fontSize: 11 }}>
                                            {String(p.id).padStart(3, '0')}
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                                        <td>
                                            <Pill variant={KATEGORI_PILL[p.category] || 'brown'}>{p.kategori}</Pill>
                                        </td>
                                        <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{p.satuan}</td>
                                        <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>
                                            Rp {Number(p.hpp).toLocaleString('id-ID')}/{p.satuan}
                                        </td>
                                        <td>
                                            <Pill variant={STATUS_PILL[p.status] || 'brown'}>{p.status}</Pill>
                                        </td>
                                        <td>
                                            <div className="action-btns">
                                                {/* Detail — semua role bisa lihat */}
                                                <button className="icon-btn" title="Detail">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                </button>

                                                {/* Edit — hanya admin & gudang */}
                                                {(isAdmin || user?.role === 'gudang') && (
                                                    <button className="icon-btn" title="Edit" onClick={() => handleEdit(p)}>
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                        </svg>
                                                    </button>
                                                )}

                                                {/* Nonaktifkan — hanya admin */}
                                                {isAdmin && (
                                                    <button className="icon-btn danger" title="Nonaktifkan" onClick={() => handleDelete(p.id, p.nama)}>
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                            <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="table-footer">
                    <span>
                        Menampilkan {Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–{Math.min(page * PER_PAGE, filtered.length)} dari {filtered.length} barang
                    </span>
                    <div className="pagination">
                        <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                            <button key={n} className={`page-btn ${page === n ? 'active' : ''}`} onClick={() => setPage(n)}>{n}</button>
                        ))}
                        <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal form */}
            {modalOpen && (
                <ProductModal
                    form={form}
                    onChange={handleChange}
                    onSubmit={handleSubmit}
                    onClose={() => setModalOpen(false)}
                    isEdit={!!editId}
                />
            )}
        </>
    );
}
