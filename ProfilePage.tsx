'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FiUser, FiLogOut, FiEdit2, FiGitBranch, FiShield } from 'react-icons/fi';

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');

  const { data: profile } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => api.get('/api/users/me').then(r => r.data.data),
  });

  const updateMut = useMutation({
    mutationFn: (data: any) => api.patch('/api/users/me', data),
    onSuccess: (res) => {
      updateUser({ name: res.data.data.name });
      qc.invalidateQueries({ queryKey: ['my-profile'] });
      toast.success('Profile updated');
      setEditing(false);
    },
    onError: () => toast.error('Update failed'),
  });

  const handleLogout = () => { logout(); router.push('/login'); };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Profile header */}
      <div className="card p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-2xl flex items-center justify-center">
            {user?.profilePhoto
              ? <img src={user.profilePhoto} className="w-16 h-16 rounded-2xl object-cover" alt="" />
              : <FiUser className="w-8 h-8 text-primary-600 dark:text-primary-400" />}
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex gap-2">
                <input className="input text-sm py-1.5 flex-1" value={name} onChange={e => setName(e.target.value)} autoFocus />
                <button onClick={() => updateMut.mutate({ name })} className="btn-primary py-1.5 px-3 text-xs">Save</button>
                <button onClick={() => setEditing(false)} className="btn-secondary py-1.5 px-3 text-xs">Cancel</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-gray-900 dark:text-white text-lg truncate">{user?.name}</h2>
                <button onClick={() => setEditing(true)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <FiEdit2 className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>
            )}
            <div className="text-sm text-gray-500">{user?.phone || user?.email}</div>
            <div className="flex gap-2 mt-1.5 flex-wrap">
              <span className={`badge ${user?.isApproved ? 'badge-green' : 'badge-red'}`}>
                {user?.isApproved ? '✓ Approved' : '⏳ Pending'}
              </span>
              <span className="badge-blue">{user?.role?.replace(/_/g, ' ')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="card p-4 space-y-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">Account Details</h3>
        {[
          { icon: FiGitBranch, label: 'Family Branch', value: user?.branch?.replace(/_/g, ' ') || 'Not set' },
          { icon: FiShield, label: 'Role', value: user?.role?.replace(/_/g, ' ') || 'Not set' },
          { icon: FiUser, label: 'Family Member', value: profile?.familyMember?.name || 'Not linked' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <Icon className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <div className="text-xs text-gray-400">{label}</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Settings */}
      <div className="card p-4 space-y-2">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Preferences</h3>
        <label className="flex items-center justify-between py-2">
          <span className="text-sm text-gray-700 dark:text-gray-300">🌙 Dark Mode</span>
          <button onClick={() => updateUser({ darkMode: !user?.darkMode })}
            className={`relative w-11 h-6 rounded-full transition-colors ${user?.darkMode ? 'bg-primary-600' : 'bg-gray-300'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${user?.darkMode ? 'translate-x-5' : ''}`} />
          </button>
        </label>
        <label className="flex items-center justify-between py-2 border-t border-gray-50 dark:border-gray-700">
          <span className="text-sm text-gray-700 dark:text-gray-300">🌐 Language</span>
          <select className="text-sm bg-gray-100 dark:bg-gray-800 border-0 rounded-lg px-2 py-1 text-gray-700 dark:text-gray-300"
            value={user?.preferredLang || 'en'} onChange={e => updateUser({ preferredLang: e.target.value })}>
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
          </select>
        </label>
      </div>

      {/* Logout */}
      <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
        <FiLogOut className="w-4 h-4" /> Sign Out
      </button>

      <p className="text-center text-xs text-gray-400 pb-4">Yaar Mohammad Tola Official App v1.0.0</p>
    </div>
  );
}
