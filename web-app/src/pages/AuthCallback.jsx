import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * OAuth callback page
 * Receives token from backend after OAuth flow and logs user in
 */
const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setToken } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        navigate('/login?error=oauth_failed');
        return;
      }

      if (token) {
        // Store token
        localStorage.setItem('token', token);
        setToken(token);

        // Redirect to dashboard
        navigate('/');
      } else {
        // No token, redirect to login
        navigate('/login');
      }
    };

    handleCallback();
  }, [searchParams, navigate, setToken]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Completing sign in...</h2>
        <p className="text-muted-foreground">Please wait a moment</p>
      </div>
    </div>
  );
};

export default AuthCallback;
