import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Still maintaining multi-account switcher capability securely
  const [storedAccounts, setStoredAccounts] = useState([]);

  useEffect(() => {
    // Load accounts from local storage
    const saved = localStorage.getItem('chemicrown_accounts');
    if (saved) {
      setStoredAccounts(JSON.parse(saved));
    }

    // Check current token
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (token) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
    
    // Manage multi-account storage
    setStoredAccounts(prev => {
      const newAccounts = [...prev.filter(a => a.id !== userData.id), { ...userData, token }];
      localStorage.setItem('chemicrown_accounts', JSON.stringify(newAccounts));
      return newAccounts;
    });
  };
  
  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  const switchAccount = (accountId) => {
    const account = storedAccounts.find(a => a.id === accountId);
    if (account) {
      login(account, account.token); // this will also set user state
    }
  };

  const token = localStorage.getItem('token');

  return (
    <AuthContext.Provider value={{ user, token, loading, storedAccounts, login, logout, switchAccount, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
