'use client';
import { useState } from 'react';
import { FiMenu, FiSearch, FiBell, FiMoon, FiSun, FiX } from 'react-icons/fi';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { familyApi } from '@/lib/api';
import type { TabId } from '@/app/page';

const TAB_TITLES: Record<string, string> = {
  home: 'Yaar Mohammad Tola', family: 'Family Tree', news: 'Village News',
  market: 'Market Prices', mosque: 'Mosque & Religion', governance: 'Governance',
  graveyard: 'Graveyard', school: 'Education', map: 'Village Map', profile: 'My Profile',
};

export default function Header({ onMenuClick, activeTab }: { onMenuClick: () => void; activeTab: TabId }) {
  const { user, updateUser } = useAuthStore();
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const router = useRouter();

  const toggleDark = () => updateUser({ darkMode: !user?.darkMode });

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    try {
      const { data } = await familyApi.search(q);
      setResults(data.data || []);
    } catch { setResults([]); }
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
        {/* Menu button (mobile) */}
        <button onClick={onMenuClick} className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
          <FiMenu className="w-5 h-5" />
        </button>

        {!searching ? (
          <>
            <div className="flex-1">
              <h1 className="font-bold text-gray-900 dark:text-white text-base truncate">{TAB_TITLES[activeTab] || 'App'}</h1>
              {activeTab === 'home' && <p className="text-xs text-gray-400">یار محمد ٹولہ</p>}
            </div>
            <button onClick={() => setSearching(true)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
              <FiSearch className="w-5 h-5" />
            </button>
            <button onClick={toggleDark} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
              {user?.darkMode ? <FiSun className="w-5 h-5 text-gold-500" /> : <FiMoon className="w-5 h-5" />}
            </button>
            <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 relative">
              <FiBell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </>
        ) : (
          <div className="flex-1 relative">
            <input autoFocus value={query} onChange={e => handleSearch(e.target.value)}
              className="input pr-10 text-sm py-2" placeholder="Search family members..." />
            <button onClick={() => { setSearching(false); setQuery(''); setResults([]); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <FiX className="w-4 h-4" />
            </button>
            {results.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 max-h-72 overflow-y-auto">
                {results.map((m: any) => (
                  <button key={m.id} onClick={() => { router.push(`/family/${m.id}`); setSearching(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-left">
                    <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center text-primary-600 font-bold text-sm flex-shrink-0">
                      {m.name[0]}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white text-sm">{m.name}</div>
                      <div className="text-xs text-gray-500">{m.branch?.replace(/_/g, ' ')} · Gen {m.generation}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
