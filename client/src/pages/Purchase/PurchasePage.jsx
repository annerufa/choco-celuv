// src/pages/Purchase/PurchasePage.jsx
import { useState, useEffect } from 'react';
import { usePurchase } from '../../hooks/usePurchase';
import TambahPurchaseModal from '../../components/Purchase/TambahPurchaseModal';
// import BarangTable from '../../components/BarangTable/BarangTable';

export default function PurchasePage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [purchaseList, setPurchaseList] = useState([]);
    const [itemList, setItemList] = useState([]);
    const { getPurchases, loading } = usePurchase();

    // Fetch purchases
    async function fetchPurchases() {
        const data = await getPurchases();
        setPurchaseList(data);
    }

    // Fetch items untuk dropdown
    async function fetchItems() {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/items`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        setItemList(data);
    }

    useEffect(() => {
        fetchPurchases();
        fetchItems();
    }, []);

    return (
        <div>
            <div>
                <h1>Data Purchase</h1>
                <button onClick={() => setIsModalOpen(true)}>
                    + Tambah Purchase
                </button>
            </div>

            {/* Tabel purchase list */}
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Supplier</th>
                        <th>Lokasi</th>
                        <th>Tanggal</th>
                        <th>Total</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {purchaseList.map(p => (
                        <tr key={p.id}>
                            <td>{p.id}</td>
                            <td>{p.supplier}</td>
                            <td>{p.location_name}</td>
                            <td>{new Date(p.date).toLocaleDateString('id-ID')}</td>
                            <td>Rp {Number(p.total).toLocaleString('id')}</td>
                            <td>{p.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <TambahPurchaseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchPurchases}  // ← refresh tabel setelah tambah
                itemList={itemList}
            />
        </div>
    );
}