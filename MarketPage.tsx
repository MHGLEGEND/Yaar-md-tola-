'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { marketApi } from '@/lib/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi';

const CATEGORY_ICONS: Record<string, string> = {
  VEGETABLE:'🥦', FRUIT:'🍎', GRAIN:'🌾', PULSE:'🫘', FISH:'🐟', MEAT:'🥩', FUEL:'⛽',
};
const CATEGORY_ORDER = ['GRAIN','PULSE','VEGETABLE','FRUIT','FISH','MEAT','FUEL'];

export default function MarketPage() {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('ALL');

  const { data: prices, isLoading } = useQuery({
    queryKey: ['market-prices'],
    queryFn: () => marketApi.getPrices().then(r => r.data.data),
  });

  const { data: trends } = useQuery({
    queryKey: ['price-trends', selectedItem],
    queryFn: () => marketApi.getTrends(selectedItem!, 30).then(r => r.data.data),
    enabled: !!selectedItem,
  });

  const grouped: Record<string, any[]> = {};
  (prices || []).forEach((p: any) => {
    if (!grouped[p.category]) grouped[p.category] = [];
    grouped[p.category].push(p);
  });

  const categories = ['ALL', ...CATEGORY_ORDER.filter(c => grouped[c])];

  const filteredGroups = activeCategory === 'ALL'
    ? Object.entries(grouped)
    : [[activeCategory, grouped[activeCategory] || []]];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="card p-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🛒</span>
          <div>
            <h2 className="font-bold">Today's Market Prices</h2>
            <p className="text-emerald-100 text-xs">Updated daily · Tap any item to see trend</p>
          </div>
        </div>
        <p className="text-xs text-emerald-100 mt-1">
          Last updated: {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })}
        </p>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all
              ${activeCategory === cat ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
            {cat !== 'ALL' && CATEGORY_ICONS[cat]} {cat}
          </button>
        ))}
      </div>

      {/* Trend chart */}
      {selectedItem && trends && trends.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">📈 {selectedItem} – 30 Day Trend</h3>
            <button onClick={() => setSelectedItem(null)} className="text-xs text-gray-400 hover:text-gray-600">✕ Close</button>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={trends.map((t: any) => ({ date: new Date(t.date).toLocaleDateString('en-IN', { month:'short', day:'numeric' }), price: t.price }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${v}`} />
              <Tooltip formatter={(v: any) => [`₹${v}`, 'Price']} />
              <Line type="monotone" dataKey="price" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Price tables */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card h-32 animate-pulse bg-gray-100 dark:bg-gray-800" />)}</div>
      ) : (
        filteredGroups.map(([category, items]) => (
          <div key={category} className="card overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">
                {CATEGORY_ICONS[category]} {category}
              </h3>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {(items || []).map((item: any) => (
                <button key={item.id} onClick={() => setSelectedItem(selectedItem === item.item ? null : item.item)}
                  className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left
                    ${selectedItem === item.item ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}>
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{item.item}</span>
                    <span className="text-xs text-gray-400 ml-2">per {item.unit}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">₹{item.price}</span>
                    <FiTrendingUp className="w-3.5 h-3.5 text-emerald-500 opacity-50" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))
      )}

      <p className="text-center text-xs text-gray-400 pb-2">
        Prices are indicative. Contact local market for exact rates.
      </p>
    </div>
  );
}
