import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // token lives in React STATE (not read live from storage on every render)
  // Initialised from sessionStorage so it's tab-isolated
  const [token, setToken] = useState(() => sessionStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // storedAccounts stays in localStorage — shared so the account switcher
  // can see all previously signed-in accounts from any tab
  const [storedAccounts, setStoredAccounts] = useState([]);

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
        // Token invalid / expired — clear THIS tab only
        sessionStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Bootstrap ────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Load the shared accounts list for the switcher
    try {
      const saved = localStorage.getItem('chemicrown_accounts');
      if (saved) setStoredAccounts(JSON.parse(saved));
    } catch {}

    // Validate this tab's token (sessionStorage → tab-isolated)
    const tkn = sessionStorage.getItem('token');
    if (tkn) {
      fetchUser(tkn);
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

  // ── Cross-tab account-list sync ──────────────────────────────────────────────
  // When another tab adds/removes an account, keep the switcher in sync.
  // We listen to 'storage' events which fire in all tabs EXCEPT the one that wrote.
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'chemicrown_accounts') {
        try {
          const updated = e.newValue ? JSON.parse(e.newValue) : [];
          setStoredAccounts(updated);
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // ── Public API ───────────────────────────────────────────────────────────────
  const login = (userData, tkn) => {
    setUser(userData);
    setToken(tkn);
    sessionStorage.setItem('token', tkn);           // tab-isolated ✅

    setStoredAccounts(prev => {
      const updated = [
        ...prev.filter(a => a.id !== userData.id),
        { ...userData, token: tkn }
      ];
      _saveAccounts(updated);
      return updated;
    });
  };

  /** Logs out the current tab only. Other tabs keep their own sessions. */
  const logout = () => {
    const userId = user?.id;
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('token');             // tab-isolated ✅

    if (userId) {
      setStoredAccounts(prev => {
        const updated = prev.filter(a => a.id !== userId);
        _saveAccounts(updated);
        return updated;
      });
    }
  };

  /** Logs out everywhere — wipes shared accounts list AND this tab's session. */
  const logoutAll = () => {
    setUser(null);
    setToken(null);
    setStoredAccounts([]);
    sessionStorage.removeItem('token');
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
   * Switch the current tab to a different stored account.
   * Only THIS tab changes — other tabs are unaffected. ✅
   */
  const switchAccount = (accountId) => {
    const account = storedAccounts.find(a => a.id === accountId);
    if (!account) return;
    setUser(account);
    setToken(account.token);
    sessionStorage.setItem('token', account.token); // tab-isolated ✅
    fetchUser(account.token);
  };

  return (
    <AuthContext.Provider
      value={{
        user, token, loading,
        storedAccounts,
        login, logout, logoutAll,
        removeStoredAccount, switchAccount,
        setUser,
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
