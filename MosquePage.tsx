'use client';
import { useQuery } from '@tanstack/react-query';
import { mosqueApi } from '@/lib/api';

const PRAYER_TIMES = [
  { name: 'Fajr', key: 'fajr', arabic: 'فجر', icon: '🌅' },
  { name: 'Zuhr', key: 'zuhr', arabic: 'ظہر', icon: '☀️' },
  { name: 'Asr', key: 'asr', arabic: 'عصر', icon: '🌤️' },
  { name: 'Maghrib', key: 'maghrib', arabic: 'مغرب', icon: '🌇' },
  { name: 'Isha', key: 'isha', arabic: 'عشاء', icon: '🌙' },
];

export default function MosquePage() {
  const { data: mosques } = useQuery({ queryKey: ['mosques'], queryFn: () => mosqueApi.getAll().then(r => r.data.data) });
  const { data: announcements } = useQuery({ queryKey: ['announcements'], queryFn: () => mosqueApi.getAnnouncements().then(r => r.data.data) });
  const mosque = mosques?.[0];
  const { data: namaz } = useQuery({
    queryKey: ['namaz', mosque?.id],
    queryFn: () => mosqueApi.getNamaz(mosque!.id).then(r => r.data.data),
    enabled: !!mosque?.id,
  });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-800 to-indigo-900 rounded-2xl p-5 text-white">
        <div className="text-center mb-4">
          <div className="text-5xl mb-2">🕌</div>
          <h1 className="text-xl font-bold">{mosque?.name || 'Village Mosque'}</h1>
          {mosque?.nameUrdu && <p className="text-indigo-200 urdu text-sm mt-1">{mosque.nameUrdu}</p>}
          <p className="text-indigo-200 text-xs mt-1">{mosque?.address}</p>
        </div>
        {namaz && (
          <div className="grid grid-cols-5 gap-1">
            {PRAYER_TIMES.map(p => (
              <div key={p.key} className="bg-white/10 backdrop-blur-sm rounded-xl p-2 text-center">
                <div className="text-lg mb-0.5">{p.icon}</div>
                <div className="text-[10px] text-indigo-200 font-arabic">{p.arabic}</div>
                <div className="text-sm font-bold">{(namaz as any)[p.key] || '—'}</div>
                <div className="text-[9px] text-indigo-300">{p.name}</div>
              </div>
            ))}
          </div>
        )}
        {namaz?.jummah && (
          <div className="mt-3 bg-gold-500/20 rounded-xl p-2.5 text-center">
            <span className="text-gold-200 text-sm font-medium">🕌 Jummah: {namaz.jummah}</span>
          </div>
        )}
      </div>

      {/* Mosque Details */}
      {mosque && (
        <div className="card p-4 space-y-3">
          <h2 className="font-bold text-gray-900 dark:text-white">Mosque Details</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Imam', value: mosque.imamName, icon: '👳' },
              { label: 'Mozzim', value: mosque.mozzimName, icon: '📢' },
              { label: 'Established', value: mosque.established ? `~${mosque.established}` : 'N/A', icon: '📅' },
              { label: 'Status', value: 'Active', icon: '✅' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <div className="text-xl mb-1">{icon}</div>
                <div className="text-xs text-gray-400">{label}</div>
                <div className="font-semibold text-gray-900 dark:text-white text-sm">{value || 'N/A'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Committee */}
      {mosque?.committee && mosque.committee.length > 0 && (
        <div className="card p-4">
          <h2 className="font-bold text-gray-900 dark:text-white mb-3">Masjid Committee</h2>
          <div className="space-y-2">
            {mosque.committee.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
                <div>
                  <div className="font-medium text-sm text-gray-900 dark:text-white">{m.name}</div>
                  <div className="text-xs text-gray-400">{m.role}</div>
                </div>
                {m.phone && <a href={`tel:${m.phone}`} className="text-xs text-primary-600 dark:text-primary-400 font-medium">📞 Call</a>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ramadan / Islamic Calendar */}
      <div className="card p-4">
        <h2 className="font-bold text-gray-900 dark:text-white mb-3">🌙 Islamic Calendar</h2>
        <div className="space-y-2">
          {[
            { event: 'Jummah Prayers', time: `Every Friday at ${namaz?.jummah || '1:00 PM'}`, type: 'weekly' },
            { event: 'Eid ul-Fitr', time: 'End of Ramadan', type: 'annual' },
            { event: 'Eid ul-Adha', time: '10 Dhul Hijjah', type: 'annual' },
            { event: 'Shab-e-Qadr', time: '27th Ramadan', type: 'annual' },
            { event: 'Milad un Nabi', time: '12 Rabi ul Awwal', type: 'annual' },
          ].map(e => (
            <div key={e.event} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">{e.event}</div>
                <div className="text-xs text-gray-400">{e.time}</div>
              </div>
              <span className={`badge ${e.type === 'weekly' ? 'badge-blue' : 'badge-gold'}`}>{e.type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Announcements */}
      {announcements && announcements.length > 0 && (
        <div className="card p-4">
          <h2 className="font-bold text-gray-900 dark:text-white mb-3">📢 Announcements</h2>
          <div className="space-y-3">
            {announcements.map((a: any) => (
              <div key={a.id} className={`p-3 rounded-xl ${a.isPinned ? 'bg-gold-50 dark:bg-gold-900/20 border border-gold-200 dark:border-gold-700' : 'bg-gray-50 dark:bg-gray-800'}`}>
                {a.isPinned && <span className="text-xs text-gold-600 font-medium">📌 Pinned</span>}
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{a.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{a.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
