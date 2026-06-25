'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { FiPhone, FiMapPin } from 'react-icons/fi';

export default function SchoolPage() {
  const { data: schools } = useQuery({ queryKey: ['schools'], queryFn: () => api.get('/api/schools').then(r => r.data.data) });

  const TYPE_ICONS: Record<string, string> = { GOVERNMENT: '🏫', PRIVATE: '🏢', MADRASA: '📖', COACHING: '✏️' };
  const TYPE_COLORS: Record<string, string> = { GOVERNMENT: 'badge-blue', PRIVATE: 'badge-gold', MADRASA: 'badge-green', COACHING: 'badge-gray' };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="card p-4 bg-gradient-to-r from-violet-700 to-violet-800 text-white">
        <h2 className="font-bold text-lg">📚 Education in Village</h2>
        <p className="text-violet-200 text-sm">Schools, Madrasas & Coaching Centers</p>
      </div>

      {(schools || []).length === 0 ? (
        <div className="text-center py-12 text-gray-400"><span className="text-4xl block mb-2">🏫</span>No schools listed yet</div>
      ) : (
        <div className="space-y-3">
          {(schools || []).map((s: any) => (
            <div key={s.id} className="card p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  {TYPE_ICONS[s.type] || '🏫'}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{s.name}</h3>
                    <span className={`badge flex-shrink-0 ${TYPE_COLORS[s.type] || 'badge-gray'}`}>{s.type}</span>
                  </div>
                  {s.classRange && <div className="text-xs text-gray-500 mt-1">Classes: {s.classRange}</div>}
                  {s.address && <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5"><FiMapPin className="w-3 h-3" />{s.address}</div>}
                  {s.principal && <div className="text-xs text-gray-400">Principal: {s.principal}</div>}
                  {s.fees && <div className="text-xs text-emerald-600 dark:text-emerald-400">Fees: {s.fees}</div>}
                  {s.admissionInfo && <div className="text-xs text-blue-500 mt-1">ℹ️ {s.admissionInfo}</div>}
                  {s.phone && (
                    <a href={`tel:${s.phone}`} className="inline-flex items-center gap-1.5 mt-2 text-xs text-primary-600 dark:text-primary-400 font-medium">
                      <FiPhone className="w-3 h-3" /> {s.phone}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
