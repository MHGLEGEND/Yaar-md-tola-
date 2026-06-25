'use client';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

const TYPE_ICONS: Record<string, string> = { MOSQUE:'🕌', SCHOOL:'🏫', GRAVEYARD:'⬜', MARKET:'🛒', HOUSE:'🏠' };
const TYPE_COLORS: Record<string, string> = { MOSQUE:'#4f46e5', SCHOOL:'#7c3aed', GRAVEYARD:'#6b7280', MARKET:'#10b981', HOUSE:'#f59e0b' };

export default function MapPage() {
  const [activeType, setActiveType] = useState('ALL');
  const [MapComponents, setMapComponents] = useState<any>(null);

  const { data: locations } = useQuery({ queryKey: ['map-locations'], queryFn: () => api.get('/api/map').then(r => r.data.data) });

  // Dynamically import Leaflet (SSR-safe)
  useEffect(() => {
    import('leaflet').then(() => {
      Promise.all([import('react-leaflet'), import('leaflet/dist/leaflet.css' as any)]).then(([rl]) => {
        setMapComponents(rl);
      }).catch(() => {
        import('react-leaflet').then(rl => setMapComponents(rl));
      });
    });
  }, []);

  const filtered = activeType === 'ALL' ? (locations || []) : (locations || []).filter((l: any) => l.type === activeType);
  const types = ['ALL', ...new Set((locations || []).map((l: any) => l.type as string))];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="card p-4 bg-gradient-to-r from-teal-600 to-teal-700 text-white">
        <h2 className="font-bold text-lg">🗺️ Village Map</h2>
        <p className="text-teal-100 text-sm">Interactive map of Yaar Mohammad Tola</p>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {types.map(t => (
          <button key={t} onClick={() => setActiveType(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all
              ${activeType === t ? 'bg-teal-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
            {t !== 'ALL' && TYPE_ICONS[t]} {t}
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="card overflow-hidden" style={{ height: '400px' }}>
        {MapComponents ? (
          <MapComponents.MapContainer
            center={[25.5941, 85.1376]} zoom={15}
            style={{ height: '100%', width: '100%' }}>
            <MapComponents.TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© OpenStreetMap contributors' />
            {filtered.map((loc: any) => (
              <MapComponents.Marker key={loc.id} position={[loc.latitude, loc.longitude]}>
                <MapComponents.Popup>
                  <div className="text-sm">
                    <div className="font-bold">{TYPE_ICONS[loc.type]} {loc.name}</div>
                    <div className="text-gray-500">{loc.type}</div>
                    {loc.description && <div className="mt-1 text-xs">{loc.description}</div>}
                  </div>
                </MapComponents.Popup>
              </MapComponents.Marker>
            ))}
          </MapComponents.MapContainer>
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            <div className="text-center text-gray-400">
              <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm">Loading map...</p>
            </div>
          </div>
        )}
      </div>

      {/* Location list */}
      <div className="card p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Locations ({filtered.length})</h3>
        <div className="space-y-2">
          {filtered.map((loc: any) => (
            <div key={loc.id} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
              <span className="text-xl">{TYPE_ICONS[loc.type] || '📍'}</span>
              <div>
                <div className="font-medium text-sm text-gray-900 dark:text-white">{loc.name}</div>
                <div className="text-xs text-gray-400">{loc.type} · {loc.latitude?.toFixed(4)}, {loc.longitude?.toFixed(4)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
