import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { authApi } from '../api/index.js';
import Button from '../components/common/Button.jsx';
import Logo from '../components/common/Logo.jsx';
import Spinner from '../components/common/Spinner.jsx';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8"><Logo size={40} /></div>
        <div className="card shadow-xl">
          <h1 className="text-2xl font-bold mb-1">Reset password</h1>
          {sent ? (
            <div className="text-center py-6">
              <p className="text-green-600 dark:text-green-400 font-medium mb-2">Reset link sent</p>
              <p className="text-sm text-gray-500 mb-4">Check your inbox at <strong>{email}</strong> for a reset link.</p>
              <Button variant="secondary" onClick={() => setSent(false)}>Send again</Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Enter your email and we'll send you a password reset link.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label" htmlFor="email">Email</label>
                  <input id="email" type="email" className="input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Spinner size={18} /> : 'Send Reset Link'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
