import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { authService } from '../../services/authService';
import { getErrorMessage } from '../../utils/axiosInstance';
import Button from '../../components/ui/Button';

export default function VerifyEmailPage() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function verify() {
      try {
        const res = await authService.verifyEmail(token);
        if (!cancelled) {
          setStatus('success');
          // authService.verifyEmail returns the 'data' field of ApiResponse, which is null for this endpoint.
          // We can just show a default success message.
          setMessage('Email verified successfully. You now have full access to your account.');
        }
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setMessage(getErrorMessage(err, 'This verification link is invalid or has expired.'));
        }
      }
    }
    verify();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-[calc(100vh-73px)] flex items-center justify-center px-6 py-16 bg-gradient-to-b from-brand-50/60 to-ink-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md surface p-8 text-center"
      >
        {status === 'loading' && (
          <>
            <Loader2 className="w-10 h-10 mx-auto animate-spin text-brand-500" />
            <p className="mt-4 text-sm text-ink-500">Verifying your email…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="w-12 h-12 mx-auto text-glow-emerald" />
            <h1 className="mt-4 text-xl font-display font-bold text-ink-900">Email verified!</h1>
            <p className="mt-2 text-sm text-ink-500">{message}</p>
            <Link to="/login">
              <Button className="mt-6">Continue to log in</Button>
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 mx-auto text-rose-500" />
            <h1 className="mt-4 text-xl font-display font-bold text-ink-900">Verification failed</h1>
            <p className="mt-2 text-sm text-ink-500">{message}</p>
            <Link to="/login">
              <Button variant="secondary" className="mt-6">
                Back to log in
              </Button>
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
}
