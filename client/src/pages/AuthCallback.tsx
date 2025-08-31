import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '@/services/api';

function parseHash(hash: string): Record<string, string> {
  const out: Record<string, string> = {};
  const raw = hash.startsWith('#') ? hash.substring(1) : hash;
  for (const part of raw.split('&')) {
    const [k, v] = part.split('=');
    if (k) out[decodeURIComponent(k)] = decodeURIComponent(v || '');
  }
  return out;
}

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const params = parseHash(window.location.hash || '');
      const access = params['access'];
      const refresh = params['refresh'];
      const userB64 = params['user'];

      if (!access || !refresh) {
        // Missing tokens; go back to /auth
        navigate('/auth', { replace: true });
        return;
      }

      // Save tokens
      apiService.setTokens({ accessToken: access, refreshToken: refresh });

      // Save user if present
      if (userB64) {
        try {
          const userJson = atob(userB64);
          const user = JSON.parse(userJson);
          localStorage.setItem('user_data', JSON.stringify(user));
        } catch (_) {
          // ignore user parse errors
        }
      }

      // Navigate to dashboard
      navigate('/dashboard', { replace: true });
    } catch (e) {
      navigate('/auth', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-600">Signing you in with Google…</div>
    </div>
  );
};

export default AuthCallback;
