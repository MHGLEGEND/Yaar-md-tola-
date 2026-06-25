'use client';
import { FiHome, FiUsers, FiFileText, FiShoppingCart, FiMoreHorizontal } from 'react-icons/fi';
import { MdOutlineMosque } from 'react-icons/md';
import type { TabId } from '@/app/page';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', Icon: FiHome },
  { id: 'family', label: 'Family', Icon: FiUsers },
  { id: 'news', label: 'News', Icon: FiFileText },
  { id: 'mosque', label: 'Mosque', Icon: MdOutlineMosque },
  { id: 'market', label: 'Market', Icon: FiShoppingCart },
];

export default function BottomNav({ activeTab, setTab }: { activeTab: TabId; setTab: (t: TabId) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-stretch pb-safe md:hidden z-40">
      {NAV_ITEMS.map(({ id, label, Icon }) => (
        <button key={id} onClick={() => setTab(id as TabId)}
          className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${activeTab === id ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'}`}>
          <Icon className="w-5 h-5" />
          <span className="text-[10px] font-medium">{label}</span>
          {activeTab === id && <span className="w-1 h-1 bg-primary-600 dark:bg-primary-400 rounded-full" />}
        </button>
      ))}
    </nav>
  );
}
