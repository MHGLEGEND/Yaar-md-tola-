'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { newsApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { FiPlus, FiX, FiAlertCircle, FiEdit2, FiTrash2 } from 'react-icons/fi';

const CATEGORIES = ['VILLAGE_NEWS','BIRTH_ANNOUNCEMENT','DEATH_ANNOUNCEMENT','NIKAH_ANNOUNCEMENT','LOST_AND_FOUND','PANCHAYAT_NEWS','EMERGENCY_ALERT'];
const BADGE_COLORS: Record<string, string> = {
  VILLAGE_NEWS:'bg-blue-100 text-blue-700', BIRTH_ANNOUNCEMENT:'bg-green-100 text-green-700',
  DEATH_ANNOUNCEMENT:'bg-gray-100 text-gray-700', NIKAH_ANNOUNCEMENT:'bg-yellow-100 text-yellow-700',
  LOST_AND_FOUND:'bg-purple-100 text-purple-700', PANCHAYAT_NEWS:'bg-indigo-100 text-indigo-700',
  EMERGENCY_ALERT:'bg-red-100 text-red-700',
};
const ICONS: Record<string, string> = {
  VILLAGE_NEWS:'📰', BIRTH_ANNOUNCEMENT:'👶', DEATH_ANNOUNCEMENT:'🕊️',
  NIKAH_ANNOUNCEMENT:'💍', LOST_AND_FOUND:'🔍', PANCHAYAT_NEWS:'🏛️', EMERGENCY_ALERT:'🚨',
};

export default function NewsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['news', activeCategory],
    queryFn: () => newsApi.getAll(activeCategory !== 'ALL' ? { category: activeCategory } : {}).then(r => r.data.data),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => newsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['news'] }); toast.success('Deleted'); },
  });

  const canCreate = ['ADMIN','MUKHIYA','WARD_MEMBER','IMAM'].includes(user?.role || '');

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {['ALL', ...CATEGORIES].map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0
              ${activeCategory === cat ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}>
            {cat !== 'ALL' && ICONS[cat]} {cat.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {canCreate && (
        <button onClick={() => { setEditItem(null); setShowModal(true); }} className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
          <FiPlus className="w-4 h-4" /> Post News / Announcement
        </button>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="card h-28 animate-pulse bg-gray-100 dark:bg-gray-800" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {(data || []).length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <span className="text-4xl block mb-2">📭</span>
              No news in this category
            </div>
          ) : (data || []).map((item: any) => (
            <div key={item.id} className={`card p-4 ${item.isPinned ? 'ring-2 ring-red-200 dark:ring-red-800' : ''}`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{ICONS[item.category] || '📰'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`badge ${BADGE_COLORS[item.category]}`}>{item.category.replace(/_/g,' ')}</span>
                    {item.isPinned && <span className="badge bg-red-100 text-red-600">📌 Pinned</span>}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-3">{item.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">
                      By {item.author?.name} · {new Date(item.createdAt).toLocaleDateString('en-IN')}
                    </span>
                    {(user?.role === 'ADMIN' || item.authorId === user?.id) && (
                      <div className="flex gap-2">
                        <button onClick={() => { setEditItem(item); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
                          <FiEdit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteMut.mutate(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500">
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <NewsModal onClose={() => setShowModal(false)} editItem={editItem} />}
    </div>
  );
}

function NewsModal({ onClose, editItem }: { onClose: () => void; editItem: any }) {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [form, setForm] = useState({ title: editItem?.title || '', content: editItem?.content || '', category: editItem?.category || 'VILLAGE_NEWS', isPinned: editItem?.isPinned || false });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.title || !form.content) { toast.error('Title and content required'); return; }
    setLoading(true);
    try {
      if (editItem) await newsApi.update(editItem.id, form);
      else await newsApi.create(form);
      toast.success(editItem ? 'Updated!' : 'Posted!');
      qc.invalidateQueries({ queryKey: ['news'] });
      onClose();
    } catch { toast.error('Failed'); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="card w-full max-w-lg p-5 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 dark:text-white">{editItem ? 'Edit News' : 'Post News'}</h2>
          <button onClick={onClose}><FiX className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Category</label>
            <select className="input text-sm" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{ICONS[c]} {c.replace(/_/g,' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Title *</label>
            <input className="input text-sm" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="News headline..." />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Content *</label>
            <textarea className="input text-sm min-h-[120px] resize-none" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Write the full news..." />
          </div>
          {user?.role === 'ADMIN' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isPinned} onChange={e => setForm(f => ({ ...f, isPinned: e.target.checked }))} className="rounded" />
              <span className="text-sm text-gray-700 dark:text-gray-300">📌 Pin this post</span>
            </label>
          )}
          <button onClick={submit} disabled={loading} className="btn-primary w-full">
            {loading ? 'Posting...' : (editItem ? 'Update' : 'Publish')}
          </button>
        </div>
      </div>
    </div>
  );
}
