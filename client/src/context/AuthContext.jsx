import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import { setAccessToken, clearAccessToken, setOnAuthFailure } from '../utils/tokenStore';
import { getErrorMessage } from '../utils/axiosInstance';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    clearAccessToken();
    setUser(null);
  }, []);

  // On first mount, try to silently derive a fresh access token from the
  // httpOnly refresh cookie (present if the user has an existing session).
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const { accessToken } = await authService.refreshToken();
        setAccessToken(accessToken);
        const { user: me } = await authService.getMe();
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) clearSession();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    bootstrap();
    setOnAuthFailure(() => {
      clearSession();
    });

    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  const login = useCallback(async (payload) => {
    const { user: loggedInUser, accessToken } = await authService.login(payload);
    setAccessToken(accessToken);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(async (payload) => {
    const { user: newUser, accessToken } = await authService.register(payload);
    setAccessToken(accessToken);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (err) {
      // Non-fatal — clear local session regardless of server response.
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const refreshCurrentUser = useCallback(async () => {
    try {
      const { user: freshUser } = await authService.getMe();
      setUser(freshUser);
      return freshUser;
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not refresh your account details.'));
      return null;
    }
  }, []);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    role: user?.role || null,
    login,
    register,
    logout,
    refreshCurrentUser,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
