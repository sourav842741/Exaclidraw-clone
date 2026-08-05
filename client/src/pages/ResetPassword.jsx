import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { authApi } from '../api/index.js';
import Button from '../components/common/Button.jsx';
import Logo from '../components/common/Logo.jsx';
import Spinner from '../components/common/Spinner.jsx';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
      toast.success('Password reset successfully');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8"><Logo size={40} /></div>
        <div className="card shadow-xl">
          <h1 className="text-2xl font-bold mb-1">Set a new password</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{done ? 'Redirecting to login...' : 'Choose a strong password for your account.'}</p>
          {!done && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label" htmlFor="password">New password</label>
                <input id="password" type="password" className="input" placeholder="8+ characters" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div>
                <label className="label" htmlFor="confirm">Confirm password</label>
                <input id="confirm" type="password" className="input" placeholder="Repeat password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Spinner size={18} /> : 'Reset Password'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
