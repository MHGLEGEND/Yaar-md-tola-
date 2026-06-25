'use client';
import { useQuery } from '@tanstack/react-query';
import { familyApi, mosqueApi, marketApi, newsApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { FiUsers, FiGitBranch, FiHome, FiTrendingUp, FiAlertCircle } from 'react-icons/fi';
import type { TabId } from '@/app/page';

const BADGE_COLORS: Record<string, string> = {
  VILLAGE_NEWS: 'badge-blue', BIRTH_ANNOUNCEMENT: 'badge-green', DEATH_ANNOUNCEMENT: 'badge-gray',
  NIKAH_ANNOUNCEMENT: 'badge-gold', EMERGENCY_ALERT: 'badge-red', PANCHAYAT_NEWS: 'badge-blue',
};

export default function HomePage({ setTab }: { setTab: (t: TabId) => void }) {
  const { user } = useAuthStore();
  const { data: stats } = useQuery({ queryKey: ['family-stats'], queryFn: () => familyApi.getStats().then(r => r.data.data) });
  const { data: mosques } = useQuery({ queryKey: ['mosques'], queryFn: () => mosqueApi.getAll().then(r => r.data.data) });
  const { data: prices } = useQuery({ queryKey: ['market-prices'], queryFn: () => marketApi.getPrices().then(r => r.data.data) });
  const { data: newsData } = useQuery({ queryKey: ['news-latest'], queryFn: () => newsApi.getAll({ limit: 5 }).then(r => r.data.data) });
  const mosque = mosques?.[0];

  const namazTiming = useQuery({
    queryKey: ['namaz', mosque?.id],
    queryFn: () => mosque ? mosqueApi.getNamaz(mosque.id).then(r => r.data.data) : null,
    enabled: !!mosque,
  });

  const fuelPrices = prices?.filter((p: any) => p.category === 'FUEL').slice(0, 2) || [];
  const vegPrices = prices?.filter((p: any) => p.category === 'VEGETABLE').slice(0, 4) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <div className="relative bg-hero-gradient rounded-2xl p-6 overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '30px 30px' }} />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🕌</span>
            <span className="text-gold-300 text-xs font-medium uppercase tracking-wider">Official Village App</span>
          </div>
          <h1 className="text-2xl font-bold text-white leading-tight mb-2">
            One family, many generations —<br />preserving history, faith & unity.
          </h1>
          <p className="text-primary-200 text-sm urdu text-right">ایک خاندان، کئی نسلیں — تاریخ، ایمان اور اتحاد کا تحفظ</p>
          <div className="mt-4 flex gap-2">
            <button onClick={() => setTab('family')} className="bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-4 py-2 rounded-xl backdrop-blur-sm transition-all">
              View Family Tree
            </button>
            <button onClick={() => setTab('news')} className="bg-gold-500/80 hover:bg-gold-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all">
              Latest News
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Members', value: stats?.totalMembers || '—', Icon: FiUsers, color: 'text-primary-600 bg-primary-50 dark:bg-primary-900/30' },
          { label: 'Branches', value: stats?.totalBranches || '—', Icon: FiGitBranch, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' },
          { label: 'Families', value: stats?.totalBranches || '—', Icon: FiHome, color: 'text-gold-600 bg-gold-50 dark:bg-gold-900/30' },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} className="card p-4 text-center">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-2 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Namaz Timing */}
      {namazTiming.data && (
        <div className="card overflow-hidden">
          <div className="bg-primary-700 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🕌</span>
              <div>
                <div className="text-white font-semibold text-sm">{mosque?.name}</div>
                <div className="text-primary-200 text-xs">Today's Namaz Timings</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-5 divide-x divide-gray-100 dark:divide-gray-700">
            {[
              { name: 'Fajr', time: namazTiming.data?.fajr, arabic: 'فجر' },
              { name: 'Zuhr', time: namazTiming.data?.zuhr, arabic: 'ظہر' },
              { name: 'Asr', time: namazTiming.data?.asr, arabic: 'عصر' },
              { name: 'Maghrib', time: namazTiming.data?.maghrib, arabic: 'مغرب' },
              { name: 'Isha', time: namazTiming.data?.isha, arabic: 'عشاء' },
            ].map(p => (
              <div key={p.name} className="flex flex-col items-center py-3 px-1">
                <span className="text-xs text-gray-400 font-arabic">{p.arabic}</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white mt-1">{p.time || '—'}</span>
                <span className="text-[10px] text-gray-400">{p.name}</span>
              </div>
            ))}
          </div>
          {namazTiming.data?.jummah && (
            <div className="px-4 py-2 bg-gold-50 dark:bg-gold-900/20 text-center text-xs text-gold-700 dark:text-gold-300 font-medium">
              🕌 Jummah Prayer: {namazTiming.data.jummah}
            </div>
          )}
        </div>
      )}

      {/* Market Prices Quick View */}
      {vegPrices.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FiTrendingUp className="text-emerald-500 w-4 h-4" />
              <span className="font-semibold text-gray-900 dark:text-white text-sm">Today's Market</span>
            </div>
            <button onClick={() => setTab('market')} className="text-xs text-primary-600 dark:text-primary-400 font-medium">See all →</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {vegPrices.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">{p.item}</span>
                <span className="text-sm font-bold text-emerald-600">₹{p.price}/{p.unit}</span>
              </div>
            ))}
          </div>
          {fuelPrices.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 flex gap-2">
              {fuelPrices.map((p: any) => (
                <div key={p.id} className="flex-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2 flex justify-between">
                  <span className="text-xs text-amber-700 dark:text-amber-300">{p.item.split(' ')[0]}</span>
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-300">₹{p.price}/L</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Latest News */}
      {newsData && newsData.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 dark:text-white">Latest Updates</h2>
            <button onClick={() => setTab('news')} className="text-xs text-primary-600 dark:text-primary-400 font-medium">See all →</button>
          </div>
          <div className="space-y-2">
            {newsData.map((item: any) => (
              <div key={item.id} className="card-hover p-4">
                <div className="flex items-start gap-3">
                  {item.isPinned && <FiAlertCircle className="text-red-500 w-4 h-4 mt-0.5 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={BADGE_COLORS[item.category] || 'badge-gray'}>{item.category.replace(/_/g, ' ')}</span>
                      {item.isPinned && <span className="badge-red">📌 Pinned</span>}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">{item.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Village History */}
      <div className="card overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-primary-600 via-gold-500 to-emerald-500" />
        <div className="p-5">
          <h2 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <span className="text-xl">📜</span> Village History
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            Yaar Mohammad Tola is a historic village with deep roots in Islamic tradition and community values.
            Founded by Mohammad Nogordi Sheikh, the village has grown across generations through the branches
            of Abu Sheikh, Gumani Sheikh, and Kalimuddin Haji families.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mt-2">
            The village maintains strong ties of brotherhood, religious practice, and cultural heritage,
            with the Jama Masjid serving as the spiritual center of the community.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {['Founded: ~1850s', 'Bihar, India', '8+ Generations', '3+ Main Branches'].map(tag => (
              <span key={tag} className="badge-blue text-xs">{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
