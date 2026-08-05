import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore.js';
import { authApi } from '../api/index.js';
import Button from '../components/common/Button.jsx';
import Logo from '../components/common/Logo.jsx';
import Spinner from '../components/common/Spinner.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await login({ email, password });
    if (res.ok) {
      toast.success('Welcome back!');
      navigate('/dashboard');
    } else {
      toast.error(res.error);
    }
  };

  const handleGoogle = async () => {
    try {
      const { url } = await authApi.googleUrl();
      window.location.href = url;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google login unavailable');
    }
  };

  // OAuth callback
  const params = new URLSearchParams(window.location.search);
  const oauthToken = params.get('accessToken');
  if (oauthToken) {
    const refreshToken = params.get('refreshToken');
    const user = JSON.parse(decodeURIComponent(params.get('user')));
    useAuthStore.getState().setTokens(oauthToken, refreshToken);
    useAuthStore.getState().setUser(user);
    navigate('/dashboard', { replace: true });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8"><Logo size={40} /></div>
        <div className="card shadow-xl animate-slide-up">
          <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Sign in to continue to your whiteboards</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" type="email" className="input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" type="password" className="input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-primary-600 hover:underline">Forgot password?</Link>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Spinner size={18} /> : 'Sign In'}
            </Button>
          </form>

          <div className="flex items-center my-5">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="px-3 text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          <Button variant="secondary" className="w-full" onClick={handleGoogle}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5.04c1.62 0 3.06.56 4.2 1.66l3.12-3.12C17.46 1.8 14.96.75 12 .75 7.44.75 3.51 3.34 1.62 7.02l3.66 2.84C6.24 7.1 8.88 5.04 12 5.04z"/><path fill="#4285F4" d="M23.25 12.25c0-.83-.08-1.63-.22-2.4H12v4.55h6.3c-.27 1.46-1.1 2.7-2.34 3.53l3.63 2.81c2.12-1.96 3.66-4.85 3.66-8.49z"/><path fill="#FBBC05" d="M5.28 14.14a6.9 6.9 0 0 1 0-4.28L1.62 7.02A11.2 11.2 0 0 0 .75 12c0 1.78.43 3.47 1.2 4.98l3.33-2.84z"/><path fill="#34A853" d="M12 23.25c3.04 0 5.6-1 7.47-2.72l-3.63-2.81c-1 .68-2.3 1.07-3.84 1.07-3.12 0-5.76-2.06-6.72-4.65l-3.66 2.84C3.51 20.66 7.44 23.25 12 23.25z"/></svg>
            Continue with Google
          </Button>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 hover:underline font-medium">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
