'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { governanceApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { FiPhone, FiPlus, FiX } from 'react-icons/fi';

const DESIGNATION_ICONS: Record<string, string> = {
  MUKHIYA: '👑', WARD_MEMBER: '🏘️', PANCHAYAT_SAMITI: '🏛️', MLA: '⚖️', MP: '🇮🇳',
};

export default function GovernancePage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [showComplaint, setShowComplaint] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'ROAD' });
  const [loading, setLoading] = useState(false);

  const { data: officials } = useQuery({ queryKey: ['officials'], queryFn: () => governanceApi.getOfficials().then(r => r.data.data) });
  const { data: myComplaints } = useQuery({ queryKey: ['my-complaints'], queryFn: () => governanceApi.getMyComplaints().then(r => r.data.data) });

  const submitComplaint = async () => {
    if (!form.title || !form.description) { toast.error('All fields required'); return; }
    setLoading(true);
    try {
      await governanceApi.createComplaint(form);
      toast.success('Complaint submitted!');
      qc.invalidateQueries({ queryKey: ['my-complaints'] });
      setShowComplaint(false);
      setForm({ title: '', description: '', category: 'ROAD' });
    } catch { toast.error('Failed'); } finally { setLoading(false); }
  };

  const STATUS_COLORS: Record<string, string> = {
    OPEN: 'badge-red', IN_PROGRESS: 'badge-gold', RESOLVED: 'badge-green', CLOSED: 'badge-gray',
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="card p-4 bg-gradient-to-r from-blue-700 to-blue-800 text-white">
        <h2 className="font-bold text-lg mb-1">🏛️ Village Governance</h2>
        <p className="text-blue-100 text-sm">Contact your elected representatives and submit complaints</p>
      </div>

      {/* Officials */}
      <div className="card p-4">
        <h2 className="font-bold text-gray-900 dark:text-white mb-3">Elected Representatives</h2>
        <div className="space-y-3">
          {(officials || []).map((o: any) => (
            <div key={o.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                {DESIGNATION_ICONS[o.designation] || '👤'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 dark:text-white">{o.name}</div>
                <div className="text-xs text-gray-400">{o.designation?.replace(/_/g, ' ')} {o.ward ? `· ${o.ward}` : ''}</div>
              </div>
              {o.phone && (
                <a href={`tel:${o.phone}`} className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg">
                  <FiPhone className="w-3 h-3" /> Call
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Complaint button */}
      <button onClick={() => setShowComplaint(true)} className="w-full btn-primary flex items-center justify-center gap-2">
        <FiPlus className="w-4 h-4" /> Submit Complaint / Request
      </button>

      {/* My complaints */}
      {myComplaints && myComplaints.length > 0 && (
        <div className="card p-4">
          <h2 className="font-bold text-gray-900 dark:text-white mb-3">My Complaints</h2>
          <div className="space-y-2">
            {myComplaints.map((c: any) => (
              <div key={c.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-sm text-gray-900 dark:text-white">{c.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{c.category} · {new Date(c.createdAt).toLocaleDateString()}</div>
                    {c.resolution && <div className="text-xs text-emerald-600 mt-1">✓ {c.resolution}</div>}
                  </div>
                  <span className={`badge flex-shrink-0 ${STATUS_COLORS[c.status] || 'badge-gray'}`}>{c.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complaint modal */}
      {showComplaint && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="card w-full max-w-md p-5 animate-slide-up">
            <div className="flex justify-between mb-4">
              <h2 className="font-bold text-gray-900 dark:text-white">New Complaint</h2>
              <button onClick={() => setShowComplaint(false)}><FiX className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Category</label>
                <select className="input text-sm" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {['ROAD','WATER','ELECTRICITY','SANITATION','EDUCATION','HEALTH','OTHER'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Title *</label>
                <input className="input text-sm" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Brief issue description" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Details *</label>
                <textarea className="input text-sm min-h-[100px] resize-none" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the issue in detail..." />
              </div>
              <button onClick={submitComplaint} disabled={loading} className="btn-primary w-full">{loading ? 'Submitting...' : 'Submit Complaint'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
