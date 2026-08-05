import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import Layout from '../components/layout/Layout.jsx';
import Button from '../components/common/Button.jsx';
import { userApi } from '../api/index.js';
import { useAuthStore } from '../stores/authStore.js';
import { useUIStore, applyTheme } from '../stores/uiStore.js';

export default function Settings() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => userApi.me() });

  const updateProfile = useMutation({
    mutationFn: () => userApi.updateProfile({ name, settings: { theme } }),
    onSuccess: (data) => { setUser({ ...user, ...data.user }); toast.success('Profile updated'); },
    onError: (err) => toast.error(err.response?.data?.message),
  });

  const updatePassword = useMutation({
    mutationFn: () => userApi.updatePassword({ currentPassword, newPassword }),
    onSuccess: () => { toast.success('Password updated'); setCurrentPassword(''); setNewPassword(''); },
    onError: (err) => toast.error(err.response?.data?.message),
  });

  const changeEmail = useMutation({
    mutationFn: () => userApi.changeEmail(newEmail),
    onSuccess: () => { toast.success('Email updated'); setNewEmail(''); },
    onError: (err) => toast.error(err.response?.data?.message),
  });

  const uploadAvatar = useMutation({
    mutationFn: (file) => {
      const fd = new FormData();
      fd.append('avatar', file);
      return userApi.uploadAvatar(fd);
    },
    onSuccess: (data) => { setUser({ ...user, avatar: data.avatar }); toast.success('Avatar updated'); },
    onError: (err) => toast.error(err.response?.data?.message),
  });

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="font-semibold mb-4">Profile</h2>
          <div className="flex items-center gap-4 mb-6">
            {user?.avatar ? <img src={user.avatar} className="w-16 h-16 rounded-full object-cover" alt="" /> : (
              <div className="w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center text-white text-2xl font-bold">{user?.name?.charAt(0)?.toUpperCase()}</div>
            )}
            <label className="btn-secondary cursor-pointer">
              Upload Avatar
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadAvatar.mutate(e.target.files[0])} />
            </label>
          </div>
          <div className="space-y-4">
            <div><label className="label">Name</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><label className="label">Email</label><input className="input" value={user?.email || ''} disabled /></div>
            <Button onClick={() => updateProfile.mutate()}>Save Profile</Button>
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4">Preferences</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Theme</label>
              <div className="flex gap-2">
                {['light', 'dark', 'system'].map((t) => (
                  <Button key={t} variant={theme === t ? 'primary' : 'secondary'} onClick={() => { setTheme(t); applyTheme(t, window.matchMedia('(prefers-color-scheme: dark)').matches); }}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Plan</label>
              <div className="p-3 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-between">
                <span className="font-medium capitalize">{user?.plan} plan</span>
                <span className="text-xs text-primary-600">AI quota: {user?.aiUsage?.requests}/{user?.aiUsage?.quota}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4">Change Password</h2>
          <div className="space-y-4">
            <div><label className="label">Current password</label><input type="password" className="input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></div>
            <div><label className="label">New password</label><input type="password" className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
            <Button onClick={() => updatePassword.mutate()} disabled={!currentPassword || !newPassword}>Update Password</Button>
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4">Change Email</h2>
          <div className="space-y-4">
            <div><label className="label">New email</label><input type="email" className="input" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} /></div>
            <Button onClick={() => changeEmail.mutate()} disabled={!newEmail}>Change Email</Button>
            <p className="text-xs text-gray-400">You'll need to verify the new email address.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
