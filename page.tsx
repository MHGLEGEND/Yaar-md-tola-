'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, familyApi, marketApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FiUsers, FiCheckCircle, FiXCircle, FiAlertTriangle, FiGitBranch, FiFileText, FiTrendingUp, FiList, FiHome, FiLogOut } from 'react-icons/fi';

type AdminTab = 'dashboard' | 'users' | 'family' | 'market' | 'news' | 'analytics';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

export default function AdminPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') { router.push('/'); }
  }, [user, router]);

  if (!user || user.role !== 'ADMIN') return null;

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', Icon: FiHome },
    { id: 'users', label: 'Users', Icon: FiUsers },
    { id: 'family', label: 'Family Tree', Icon: FiGitBranch },
    { id: 'market', label: 'Market', Icon: FiTrendingUp },
    { id: 'analytics', label: 'Analytics', Icon: FiList },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {/* Admin Sidebar */}
      <aside className="w-56 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            <div>
              <div className="font-bold text-sm">Admin Panel</div>
              <div className="text-xs text-gray-400">YMT Official App</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {tabs.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setActiveTab(id as AdminTab)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all
                ${activeTab === id ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-700 space-y-1">
          <button onClick={() => router.push('/')} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-gray-800">
            <FiHome className="w-4 h-4" /> View App
          </button>
          <button onClick={() => { logout(); router.push('/login'); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-900/20">
            <FiLogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-6xl">
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'family' && <FamilyTab />}
          {activeTab === 'market' && <MarketTab />}
          {activeTab === 'analytics' && <AnalyticsTab />}
        </div>
      </div>
    </div>
  );
}

function DashboardTab() {
  const { data: dashboard } = useQuery({ queryKey: ['admin-dashboard'], queryFn: () => adminApi.getDashboard().then(r => r.data.data) });

  const stats = [
    { label: 'Total Users', value: dashboard?.totalUsers || 0, Icon: FiUsers, color: 'bg-blue-500' },
    { label: 'Pending Approval', value: dashboard?.pendingUsers || 0, Icon: FiAlertTriangle, color: 'bg-amber-500' },
    { label: 'Family Members', value: dashboard?.totalMembers || 0, Icon: FiGitBranch, color: 'bg-emerald-500' },
    { label: 'Member Requests', value: dashboard?.pendingRequests || 0, Icon: FiFileText, color: 'bg-purple-500' },
    { label: 'News Posts', value: dashboard?.totalNews || 0, Icon: FiFileText, color: 'bg-indigo-500' },
    { label: 'Open Complaints', value: dashboard?.openComplaints || 0, Icon: FiAlertTriangle, color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map(({ label, value, Icon, color }) => (
          <div key={label} className="card p-4">
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      {dashboard?.recentActivity && (
        <div className="card p-4">
          <h2 className="font-bold text-gray-900 dark:text-white mb-3">Recent Activity</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {dashboard.recentActivity.slice(0, 15).map((log: any) => (
              <div key={log.id} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-gray-700 last:border-0 text-sm">
                <div className="w-2 h-2 bg-primary-400 rounded-full flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-400 font-mono text-xs">{log.action}</span>
                <span className="text-gray-400 text-xs ml-auto flex-shrink-0">{new Date(log.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UsersTab() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'pending' | 'all'>('pending');

  const { data: pendingUsers } = useQuery({ queryKey: ['pending-users'], queryFn: () => adminApi.getPendingUsers().then(r => r.data.data) });
  const { data: allUsers } = useQuery({ queryKey: ['all-users'], queryFn: () => adminApi.getAllUsers().then(r => r.data.data), enabled: tab === 'all' });

  const approveMut = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) => adminApi.approveUser(id, approved),
    onSuccess: (_, { approved }) => {
      qc.invalidateQueries({ queryKey: ['pending-users'] });
      qc.invalidateQueries({ queryKey: ['all-users'] });
      toast.success(approved ? 'User approved!' : 'User rejected');
    },
  });

  const displayUsers = tab === 'pending' ? (pendingUsers || []) : (allUsers || []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <div className="flex gap-2">
          <button onClick={() => setTab('pending')} className={`px-4 py-1.5 rounded-lg text-sm font-medium ${tab === 'pending' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
            Pending ({pendingUsers?.length || 0})
          </button>
          <button onClick={() => setTab('all')} className={`px-4 py-1.5 rounded-lg text-sm font-medium ${tab === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
            All Users
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Contact</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Role</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Branch</th>
              {tab === 'pending' && <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {displayUsers.map((u: any) => (
              <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 dark:text-white">{u.name}</div>
                  <div className="text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</div>
                </td>
                <td className="px-4 py-3 text-gray-500">{u.phone || u.email || '—'}</td>
                <td className="px-4 py-3"><span className="badge-blue">{u.role?.replace(/_/g, ' ')}</span></td>
                <td className="px-4 py-3 text-gray-500 text-xs">{u.branch?.replace(/_/g, ' ')}</td>
                {tab === 'pending' && (
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => approveMut.mutate({ id: u.id, approved: true })}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-200">
                        <FiCheckCircle className="w-3 h-3" /> Approve
                      </button>
                      <button onClick={() => approveMut.mutate({ id: u.id, approved: false })}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-xs font-medium hover:bg-red-200">
                        <FiXCircle className="w-3 h-3" /> Reject
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {displayUsers.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FamilyTab() {
  const qc = useQueryClient();
  const { data: requests } = useQuery({ queryKey: ['member-requests'], queryFn: () => familyApi.getPendingRequests().then(r => r.data.data) });

  const reviewMut = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) =>
      familyApi.reviewRequest(id, { status, adminNote: note }),
    onSuccess: (_, { status }) => {
      qc.invalidateQueries({ queryKey: ['member-requests'] });
      toast.success(status === 'APPROVED' ? 'Member added to tree!' : 'Request rejected');
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">Family Tree Management</h1>
      <div className="card p-4">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Pending Member Requests ({(requests || []).length})</h2>
        {(requests || []).length === 0 ? (
          <div className="text-center py-8 text-gray-400">No pending requests</div>
        ) : (
          <div className="space-y-3">
            {(requests || []).map((req: any) => (
              <div key={req.id} className="border border-gray-100 dark:border-gray-700 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="badge-blue text-xs">{req.relationType}</span>
                      <span className="text-xs text-gray-400">→ {req.member?.name || 'Root'}</span>
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      New: {(req.newMemberData as any)?.name}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Requested by: {req.requester?.name} · {new Date(req.createdAt).toLocaleDateString()}
                    </div>
                    {(req.newMemberData as any)?.profession && (
                      <div className="text-xs text-gray-400">Profession: {(req.newMemberData as any).profession}</div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => reviewMut.mutate({ id: req.id, status: 'APPROVED' })}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 text-xs font-medium rounded-lg hover:bg-emerald-200">
                      <FiCheckCircle className="w-3 h-3" /> Approve
                    </button>
                    <button onClick={() => reviewMut.mutate({ id: req.id, status: 'REJECTED', note: 'Insufficient information' })}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 text-xs font-medium rounded-lg hover:bg-red-200">
                      <FiXCircle className="w-3 h-3" /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MarketTab() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ item: '', category: 'VEGETABLE', price: '', unit: 'kg' });
  const [loading, setLoading] = useState(false);
  const { data: prices } = useQuery({ queryKey: ['market-prices'], queryFn: () => marketApi.getPrices().then(r => r.data.data) });

  const submit = async () => {
    if (!form.item || !form.price) { toast.error('Item and price required'); return; }
    setLoading(true);
    try {
      await marketApi.update({ ...form, price: parseFloat(form.price) });
      toast.success('Price updated!');
      qc.invalidateQueries({ queryKey: ['market-prices'] });
      setForm(f => ({ ...f, item: '', price: '' }));
    } catch { toast.error('Failed'); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">Market Price Management</h1>
      <div className="card p-4">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Update Price</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <input className="input text-sm" value={form.item} onChange={e => setForm(f => ({ ...f, item: e.target.value }))} placeholder="Item name" />
          <select className="input text-sm" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            {['VEGETABLE','FRUIT','GRAIN','PULSE','FISH','MEAT','FUEL'].map(c => <option key={c}>{c}</option>)}
          </select>
          <input className="input text-sm" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="Price (₹)" />
          <select className="input text-sm" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
            {['kg','litre','dozen','piece','quintal'].map(u => <option key={u}>{u}</option>)}
          </select>
        </div>
        <button onClick={submit} disabled={loading} className="btn-primary mt-3 px-6">{loading ? 'Updating...' : 'Update Price'}</button>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              {['Item','Category','Price','Unit','Updated'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {(prices || []).map((p: any) => (
              <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">{p.item}</td>
                <td className="px-4 py-2 text-gray-500">{p.category}</td>
                <td className="px-4 py-2 font-bold text-emerald-600">₹{p.price}</td>
                <td className="px-4 py-2 text-gray-500">{p.unit}</td>
                <td className="px-4 py-2 text-xs text-gray-400">{new Date(p.updatedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AnalyticsTab() {
  const { data: analytics } = useQuery({ queryKey: ['analytics'], queryFn: () => adminApi.getAnalytics().then(r => r.data.data) });

  const roleData = (analytics?.usersByRole || []).map((r: any) => ({ name: r.role.replace(/_/g,' '), value: r._count.id }));
  const branchData = (analytics?.usersByBranch || []).filter((b: any) => b.branch !== 'UNASSIGNED').map((b: any) => ({ name: b.branch.replace(/_/g,' '), value: b._count.id }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">Analytics</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-4">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">New Users (30 days)</h3>
          <div className="text-3xl font-bold text-primary-600">{analytics?.newUsersThisMonth || 0}</div>
        </div>
        <div className="card p-4">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">News This Month</h3>
          <div className="text-3xl font-bold text-emerald-600">{analytics?.newsThisMonth || 0}</div>
        </div>
      </div>
      <div className="card p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Users by Role</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={roleData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="card p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Users by Branch</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={branchData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
              {branchData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316'];
