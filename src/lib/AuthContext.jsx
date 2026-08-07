import React, { createContext, useState, useContext, useCallback } from 'react';
import { Auth } from '@/api/auth';

// ─────────────────────────────────────────────────────────────────────────
// Local admin-only auth context.
//
// The public site (Home, Books, Videos, ReadBook, Favorites, About,
// Contact...) never requires a login. Only the admin area (/admin,
// /settings, /dev) is protected — see <ProtectedRoute />.
// ─────────────────────────────────────────────────────────────────────────

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState(null);

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      const currentUser = await Auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      if (Auth.isLoggedIn()) {
        // Had a token but it's no longer valid
        setAuthError({ type: 'auth_required', message: 'انتهت صلاحية الجلسة، الرجاء تسجيل الدخول مرة أخرى' });
      } else {
        setAuthError({ type: 'auth_required', message: 'الرجاء تسجيل الدخول' });
      }
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, []);

  const login = async (username, password) => {
    const loggedInUser = await Auth.login(username, password);
    setUser(loggedInUser);
    setIsAuthenticated(true);
    setAuthError(null);
    setAuthChecked(true);
    return loggedInUser;
  };

  const logout = () => {
    Auth.logout();
    setUser(null);
    setIsAuthenticated(false);
    setAuthChecked(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        authChecked,
        authError,
        login,
        logout,
        checkUserAuth,
        // Kept for backward compatibility with components/pages written
        // against the old public-settings loading flow.
        isLoadingPublicSettings: false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
