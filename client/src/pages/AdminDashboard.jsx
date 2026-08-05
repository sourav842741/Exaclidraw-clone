import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import Layout from '../components/layout/Layout.jsx';
import Button from '../components/common/Button.jsx';
import Modal from '../components/common/Modal.jsx';
import { adminApi } from '../api/index.js';

export default function AdminDashboard() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState(null);

  const { data: stats } = useQuery({ queryKey: ['admin-stats'], queryFn: () => adminApi.stats() });
  const { data: analytics } = useQuery({ queryKey: ['admin-analytics'], queryFn: () => adminApi.analytics(30) });
  const { data: users } = useQuery({ queryKey: ['admin-users', search], queryFn: () => adminApi.users({ search }), enabled: tab === 'users' });
  const { data: boards } = useQuery({ queryKey: ['admin-boards'], queryFn: () => adminApi.boards(), enabled: tab === 'boards' });
  const { data: subs } = useQuery({ queryKey: ['admin-subs'], queryFn: () => adminApi.subscriptions(), enabled: tab === 'subscriptions' });

  const updateUser = useMutation({
    mutationFn: ({ id, payload }) => adminApi.updateUser(id, payload),
    onSuccess: () => { toast.success('User updated'); qc.invalidateQueries(['admin-users']); qc.invalidateQueries(['admin-stats']); setEditUser(null); },
    onError: (err) => toast.error(err.response?.data?.message),
  });

  const deleteUser = useMutation({
    mutationFn: (id) => adminApi.deleteUser(id),
    onSuccess: () => { toast.success('User deleted'); qc.invalidateQueries(['admin-users']); },
  });

  const statCards = [
    { label: 'Total Users', value: stats?.users || 0, icon: '👤' },
    { label: 'Boards', value: stats?.boards || 0, icon: '📊' },
    { label: 'Teams', value: stats?.teams || 0, icon: '👥' },
    { label: 'Subscribers', value: stats?.subscribers || 0, icon: '💳' },
    { label: 'AI Requests', value: analytics?.aiUsage || 0, icon: '🤖' },
    { label: 'Active Users', value: analytics?.activeUsers || 0, icon: '🟢' },
  ];

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['overview', 'users', 'boards', 'subscriptions'].map((t) => (
          <Button key={t} variant={tab === t ? 'primary' : 'secondary'} onClick={() => setTab(t)} className="capitalize">{t}</Button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
            {statCards.map((s) => (
              <div key={s.label} className="card text-center">
                <div className="text-2xl mb-2">{s.icon}</div>
                <p className="text-2xl font-bold">{s.value.toLocaleString()}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card">
              <h3 className="font-semibold mb-4">Recent Signups</h3>
              <div className="space-y-3">
                {(stats?.recentUsers || []).map((u) => (
                  <div key={u._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold">{u.name?.charAt(0)?.toUpperCase()}</div>
                      <div><p className="text-sm">{u.name}</p><p className="text-xs text-gray-400">{u.email}</p></div>
                    </div>
                    <span className="text-xs capitalize px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800">{u.plan}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 className="font-semibold mb-4">Recent Boards</h3>
              <div className="space-y-3">
                {(stats?.recentBoards || []).map((b) => (
                  <div key={b._id} className="flex items-center justify-between">
                    <div><p className="text-sm">{b.name}</p><p className="text-xs text-gray-400">{b.type} · by {b.owner?.name}</p></div>
                    <span className="text-xs text-gray-400">{new Date(b.updatedAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'users' && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Users</h3>
            <input className="input !w-64" placeholder="Search name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2">User</th><th className="pb-2">Role</th><th className="pb-2">Plan</th><th className="pb-2">Verified</th><th className="pb-2">AI Used</th><th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(users?.users || []).map((u) => (
                  <tr key={u._id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2.5"><p className="font-medium">{u.name}</p><p className="text-xs text-gray-400">{u.email}</p></td>
                    <td className="capitalize">{u.role}</td>
                    <td className="capitalize">{u.plan}</td>
                    <td>{u.isEmailVerified ? '✅' : '❌'}</td>
                    <td>{u.aiUsage?.requests}/{u.aiUsage?.quota}</td>
                    <td>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setEditUser(u)}>Edit</Button>
                        <Button size="sm" variant="danger" onClick={() => deleteUser.mutate(u._id)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'boards' && (
        <div className="card">
          <h3 className="font-semibold mb-4">All Boards</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2">Name</th><th className="pb-2">Type</th><th className="pb-2">Owner</th><th className="pb-2">Elements</th><th className="pb-2">Updated</th>
                </tr>
              </thead>
              <tbody>
                {(boards?.boards || []).map((b) => (
                  <tr key={b._id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2.5 font-medium">{b.name}</td>
                    <td className="capitalize">{b.type}</td>
                    <td>{b.owner?.email}</td>
                    <td>{b.stats?.elementCount || 0}</td>
                    <td>{new Date(b.updatedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'subscriptions' && (
        <div className="card">
          <h3 className="font-semibold mb-4">Subscriptions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {(subs?.totals || []).map((t) => (
              <div key={t._id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-center">
                <p className="text-xl font-bold">{t.count}</p>
                <p className="text-xs text-gray-400 capitalize">{t._id}</p>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-400 border-b border-gray-200 dark:border-gray-700"><th className="pb-2">User</th><th className="pb-2">Plan</th><th className="pb-2">Status</th><th className="pb-2">Period End</th></tr></thead>
              <tbody>
                {(subs?.subscriptions || []).map((s) => (
                  <tr key={s._id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2.5">{s.user?.email}</td>
                    <td className="capitalize">{s.plan}</td>
                    <td><span className={`px-2 py-0.5 rounded-full text-xs ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{s.status}</span></td>
                    <td>{s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title="Edit user">
        {editUser && (
          <div className="space-y-4">
            <div><label className="label">Role</label>
              <select className="input" defaultValue={editUser.role} onChange={(e) => updateUser.mutate({ id: editUser._id, payload: { role: e.target.value } })}>
                <option value="user">user</option><option value="admin">admin</option><option value="moderator">moderator</option>
              </select>
            </div>
            <div><label className="label">Plan</label>
              <select className="input" defaultValue={editUser.plan} onChange={(e) => updateUser.mutate({ id: editUser._id, payload: { plan: e.target.value } })}>
                <option value="free">free</option><option value="pro">pro</option><option value="team">team</option><option value="enterprise">enterprise</option>
              </select>
            </div>
            <Button variant="secondary" className="w-full" onClick={() => updateUser.mutate({ id: editUser._id, payload: { isActive: !editUser.isActive } })}>
              {editUser.isActive ? 'Deactivate' : 'Activate'} account
            </Button>
          </div>
        )}
      </Modal>
    </Layout>
  );
}
