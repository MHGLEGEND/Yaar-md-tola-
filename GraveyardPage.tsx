'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { FiSearch } from 'react-icons/fi';

export default function GraveyardPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: graveyards } = useQuery({ queryKey: ['graveyards'], queryFn: () => api.get('/api/graveyard').then(r => r.data.data) });
  const { data: searchResults } = useQuery({
    queryKey: ['grave-search', searchTerm],
    queryFn: () => api.get(`/api/graveyard/search?q=${searchTerm}`).then(r => r.data.data),
    enabled: searchTerm.length >= 2,
  });

  const graveyard = graveyards?.[0];
  const allDeceased = graveyard?.graves?.flatMap((g: any) => g.members) || [];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="card p-4 bg-gradient-to-r from-gray-700 to-gray-800 text-white">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🕊️</span>
          <div>
            <h2 className="font-bold text-lg">{graveyard?.name || 'Village Qabristan'}</h2>
            <p className="text-gray-300 text-sm">{graveyard?.address}</p>
            <p className="text-gray-400 text-xs mt-0.5">Total plots: {graveyard?.totalPlots || 0}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input className="input pl-9 text-sm" placeholder="Search by name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      {/* Results */}
      {searchTerm.length >= 2 ? (
        <div className="card p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Search Results</h3>
          {(searchResults || []).length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No records found for "{searchTerm}"</p>
          ) : (
            <div className="space-y-2">
              {(searchResults || []).map((m: any) => (
                <div key={m.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 font-bold">{m.name?.[0]}</div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white text-sm">{m.name}</div>
                    <div className="text-xs text-gray-400">{m.branch?.replace(/_/g,' ')} {m.dod ? `· Died: ${new Date(m.dod).getFullYear()}` : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="card p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Deceased Family Members ({allDeceased.length})</h3>
          {allDeceased.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No records linked yet. Admin can link grave records from the admin panel.</p>
          ) : (
            <div className="space-y-2">
              {allDeceased.slice(0, 20).map((m: any) => (
                <div key={m.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 dark:border-gray-700 last:border-0">
                  <div>
                    <div className="font-medium text-sm text-gray-900 dark:text-white">{m.name}</div>
                    <div className="text-xs text-gray-400">{m.branch?.replace(/_/g,' ')}</div>
                  </div>
                  {m.dod && <span className="text-xs text-gray-400">{new Date(m.dod).getFullYear()}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dua */}
      <div className="card p-5 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100 dark:border-emerald-800">
        <p className="text-center font-arabic text-2xl text-gray-700 dark:text-gray-300 mb-2">إِنَّا لِلَّٰهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ</p>
        <p className="text-center text-xs text-gray-500">Inna lillahi wa inna ilayhi raji'un</p>
        <p className="text-center text-xs text-gray-400 mt-1">Indeed, to Allah we belong and to Him we shall return.</p>
      </div>
    </div>
  );
}
