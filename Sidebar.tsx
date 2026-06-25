'use client';
import { FiHome, FiUsers, FiFileText, FiShoppingCart, FiMapPin, FiBook, FiX, FiLogOut, FiSettings, FiUser } from 'react-icons/fi';
import { MdOutlineMosque, MdOutlineAccountBalance } from 'react-icons/md';
import { GiTombstone } from 'react-icons/gi';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import type { TabId } from '@/app/page';

const NAV_GROUPS = [
  { label: 'Main',
    items: [
      { id: 'home', label: 'Home', Icon: FiHome },
      { id: 'family', label: 'Family Tree', Icon: FiUsers },
      { id: 'news', label: 'Village News', Icon: FiFileText },
    ],
  },
  { label: 'Community',
    items: [
      { id: 'mosque', label: 'Mosque & Religion', Icon: MdOutlineMosque },
      { id: 'governance', label: 'Governance', Icon: MdOutlineAccountBalance },
      { id: 'graveyard', label: 'Graveyard', Icon: GiTombstone },
    ],
  },
  { label: 'Services',
    items: [
      { id: 'market', label: 'Market Prices', Icon: FiShoppingCart },
      { id: 'school', label: 'Education', Icon: FiBook },
      { id: 'map', label: 'Village Map', Icon: FiMapPin },
    ],
  },
];

interface Props { activeTab: TabId; setTab: (t: TabId) => void; isOpen: boolean; onClose: () => void; }

export default function Sidebar({ activeTab, setTab, isOpen, onClose }: Props) {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleNav = (id: string) => { setTab(id as TabId); onClose(); };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose} />}

      <aside className={`
        fixed md:sticky top-0 left-0 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800
        flex flex-col z-50 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">🕌</span>
            </div>
            <div>
              <div className="font-bold text-gray-900 dark:text-white text-sm leading-tight">Yaar Mohammad</div>
              <div className="text-xs text-gray-400">ٹولہ Official App</div>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {NAV_GROUPS.map(group => (
            <div key={group.label}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1.5">{group.label}</p>
              {group.items.map(({ id, label, Icon }) => (
                <button key={id} onClick={() => handleNav(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 text-left
                    ${activeTab === id
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }`}>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* User profile */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
          <button onClick={() => handleNav('profile')} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center flex-shrink-0">
              {user?.profilePhoto ? <img src={user.profilePhoto} className="w-8 h-8 rounded-full object-cover" alt="" /> : <FiUser className="w-4 h-4 text-primary-600" />}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</div>
              <div className="text-xs text-gray-400 truncate">{user?.role?.replace(/_/g, ' ')}</div>
            </div>
          </button>
          {user?.role === 'ADMIN' && (
            <button onClick={() => router.push('/admin')} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
              <FiSettings className="w-4 h-4" /> Admin Panel
            </button>
          )}
          <button onClick={() => { logout(); router.push('/login'); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <FiLogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
