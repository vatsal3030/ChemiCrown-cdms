import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // token lives in React STATE (not read live from storage on every render)
  // Initialised from sessionStorage so it's tab-isolated
  // token lives in React STATE (not read live from storage on every render)
  // Initialised from localStorage so it persists across tabs
  const [token, setToken] = useState(() => localStorage.getItem('chemicrown_active_token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // storedAccounts stays in localStorage — shared so the account switcher
  // can see all previously signed-in accounts from any tab
  const [storedAccounts, setStoredAccounts] = useState([]);

  // Helper to validate token expiry
  const isTokenValid = (tkn) => {
    if (!tkn) return false;
    try {
      const payload = JSON.parse(atob(tkn.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  // ── helpers ─────────────────────────────────────────────────────────────────
  const _saveAccounts = (accounts) => {
    localStorage.setItem('chemicrown_accounts', JSON.stringify(accounts));
  };

  const fetchUser = useCallback(async (tkn) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${tkn}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        // Keep the accounts list fresh (name, role, avatar may have changed)
        setStoredAccounts(prev => {
          const updated = prev.map(a =>
            a.id === data.user.id ? { ...a, ...data.user } : a
          );
          _saveAccounts(updated);
          return updated;
        });
      } else {
        // Token invalid / expired / deleted from database — remove from storedAccounts!
        sessionStorage.removeItem('token');
        setToken(null);
        setUser(null);
        
        // Remove this token's account from storedAccounts
        setStoredAccounts(prev => {
          const updated = prev.filter(a => a.token !== tkn);
          _saveAccounts(updated);
          return updated;
        });
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Bootstrap ────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Load the shared accounts list for the switcher, filtering out expired ones
    try {
      const saved = localStorage.getItem('chemicrown_accounts');
      if (saved) {
        const parsed = JSON.parse(saved);
        const validAccounts = parsed.filter(a => isTokenValid(a.token));
        setStoredAccounts(validAccounts);
        if (validAccounts.length !== parsed.length) {
          _saveAccounts(validAccounts);
        }
      }
    } catch {}

    // Validate active token (localStorage → shared across tabs)
    const tkn = localStorage.getItem('chemicrown_active_token');
    if (tkn && isTokenValid(tkn)) {
      fetchUser(tkn);
    } else {
      if (tkn) localStorage.removeItem('chemicrown_active_token');
      setLoading(false);
    }
  }, [fetchUser]);

  // ── Cross-tab account-list & active token sync ──────────────────────────────────────────────
  // Keep multiple tabs in sync in real-time when accounts or active tokens change
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'chemicrown_accounts') {
        try {
          const updated = e.newValue ? JSON.parse(e.newValue) : [];
          setStoredAccounts(updated);
        } catch {}
      }
      if (e.key === 'chemicrown_active_token') {
        const newToken = e.newValue;
        setToken(newToken);
        if (newToken) {
          const saved = localStorage.getItem('chemicrown_accounts');
          if (saved) {
            try {
              const matched = JSON.parse(saved).find(a => a.token === newToken);
              if (matched) setUser(matched);
            } catch {}
          }
        } else {
          setUser(null);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // ── Public API ───────────────────────────────────────────────────────────────
  const login = (userData, tkn) => {
    setUser(userData);
    setToken(tkn);
    localStorage.setItem('chemicrown_active_token', tkn);

    setStoredAccounts(prev => {
      const updated = [
        ...prev.filter(a => a.id !== userData.id),
        { ...userData, token: tkn }
      ];
      _saveAccounts(updated);
      return updated;
    });
  };

  /** Logs out the current tab and deletes session. */
  const logout = () => {
    const userId = user?.id;
    setUser(null);
    setToken(null);
    localStorage.removeItem('chemicrown_active_token');

    if (userId) {
      setStoredAccounts(prev => {
        const updated = prev.filter(a => a.id !== userId);
        _saveAccounts(updated);
        return updated;
      });
    }
  };

  /** Logs out everywhere — wipes shared accounts list and active session. */
  const logoutAll = () => {
    setUser(null);
    setToken(null);
    setStoredAccounts([]);
    localStorage.removeItem('chemicrown_active_token');
    localStorage.removeItem('chemicrown_accounts');
  };

  const removeStoredAccount = (accountId) => {
    setStoredAccounts(prev => {
      const updated = prev.filter(a => a.id !== accountId);
      _saveAccounts(updated);
      return updated;
    });
  };

  /**
   * Switch the active account in the browser.
   * Performs an API check first to verify the session. If the session has expired
   * or been deleted (e.g., database reset), it removes it and returns false.
   */
  const switchAccount = async (accountId) => {
    const account = storedAccounts.find(a => a.id === accountId);
    if (!account) return false;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${account.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setToken(account.token);
        localStorage.setItem('chemicrown_active_token', account.token);
        
        // Keep the accounts list fresh
        setStoredAccounts(prev => {
          const updated = prev.map(a =>
            a.id === data.user.id ? { ...a, ...data.user } : a
          );
          _saveAccounts(updated);
          return updated;
        });
        return true;
      } else {
        // Token invalid / expired / deleted from database — remove from storedAccounts!
        removeStoredAccount(accountId);
        return false;
      }
    } catch (err) {
      console.warn('Network error during quick login validation. Falling back to offline switch.', err);
      // Offline fallback: switch using cached data
      setUser(account);
      setToken(account.token);
      localStorage.setItem('chemicrown_active_token', account.token);
      return true;
    }
  };

  // Custom setUser wrapper that syncs user details inside storedAccounts (for profile updates)
  const updateUserData = useCallback((updatedUser) => {
    setUser(updatedUser);
    if (updatedUser) {
      setStoredAccounts(prev => {
        const updated = prev.map(a =>
          a.id === updatedUser.id ? { ...a, ...updatedUser } : a
        );
        _saveAccounts(updated);
        return updated;
      });
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user, token, loading,
        storedAccounts,
        login, logout, logoutAll,
        removeStoredAccount, switchAccount,
        setUser: updateUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
