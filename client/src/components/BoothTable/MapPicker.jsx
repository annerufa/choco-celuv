// src/components/BoothTable/MapPicker.jsx
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix icon default Leaflet yang hilang saat pakai bundler
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Klik di map → set koordinat
function ClickHandler({ onSelect }) {
    useMapEvents({
        click(e) {
            onSelect({
                latitude: e.latlng.lat.toFixed(6),
                longitude: e.latlng.lng.toFixed(6),
            });
        },
    });
    return null;
}

// Saat marker sudah ada, geser peta ke sana
function Recenter({ position }) {
    const map = useMap();
    useEffect(() => {
        if (position) map.setView(position, map.getZoom());
    }, [position]);
    return null;
}

export default function MapPicker({ latitude, longitude, onChange }) {
    // Default center: Pasuruan, Jawa Timur
    const defaultCenter = [-8.100000, 112.150002];
    const hasPin = latitude && longitude;
    const position = hasPin ? [parseFloat(latitude), parseFloat(longitude)] : null;

    return (
        <div>
            <MapContainer
                center={position ?? defaultCenter}
                zoom={18}
                style={{ height: '200px', width: '100%', borderRadius: '8px', zIndex: 0 }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ClickHandler onSelect={onChange} />
                {position && (
                    <>
                        <Marker position={position} />
                        <Recenter position={position} />
                    </>
                )}
            </MapContainer>

            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <div style={{ flex: 1, fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    {hasPin
                        ? `📍 ${latitude}, ${longitude}`
                        : '🗺️ Klik peta untuk menentukan lokasi booth'}
                </div>
                {hasPin && (
                    <button
                        type="button"
                        onClick={() => onChange({ latitude: '', longitude: '' })}
                        style={{ fontSize: '11px', color: '#999', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                        Hapus pin
                    </button>
                )}
            </div>
        </div>
    );
}
