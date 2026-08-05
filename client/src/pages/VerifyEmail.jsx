import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore.js';
import Button from '../components/common/Button.jsx';
import Logo from '../components/common/Logo.jsx';
import Spinner from '../components/common/Spinner.jsx';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const verifyEmail = useAuthStore((s) => s.verifyEmail);
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token');
      return;
    }
    verifyEmail(token)
      .then(() => {
        setStatus('success');
        toast.success('Email verified!');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed');
      });
  }, [token, verifyEmail]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-6"><Logo size={40} /></div>
        <div className="card shadow-xl py-10">
          {status === 'verifying' && (
            <div className="flex flex-col items-center gap-4">
              <Spinner size={32} />
              <p className="text-gray-500">Verifying your email...</p>
            </div>
          )}
          {status === 'success' && (
            <div>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
              </div>
              <h2 className="text-xl font-bold mb-2">Email verified!</h2>
              <p className="text-sm text-gray-500 mb-6">Your account is now active.</p>
              <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
            </div>
          )}
          {status === 'error' && (
            <div>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </div>
              <h2 className="text-xl font-bold mb-2">Verification failed</h2>
              <p className="text-sm text-gray-500 mb-6">{message}</p>
              <Button variant="secondary" onClick={() => navigate('/login')}>Back to Login</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
