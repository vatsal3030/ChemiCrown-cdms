import { useState, useEffect } from 'react';
import { ShieldCheck, XCircle, Search, UserCheck, Building2, Clock, Users, AlertTriangle, Ban, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function CustomerManagement() {
  const { token } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // pending, active, blocked
  const [processing, setProcessing] = useState(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/customers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setCustomers(data.customers);
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const verifyCustomer = async (id) => {
    setProcessing(id);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-customer/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Customer verified & activated!');
        fetchCustomers();
      }
      else { toast.error('Verification failed'); }
    } catch {
      toast.error('Network error');
    } finally {
      setProcessing(null);
    }
  };

  const rejectCustomer = async (id) => {
    if (!window.confirm('Reject and remove this customer account?')) return;
    setProcessing(id);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-customer/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success || res.ok) {
        toast.success('Customer rejected');
        fetchCustomers();
      } else {
        toast.error(data.error || 'Failed to reject');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setProcessing(null);
    }
  };

  const toggleCustomerStatus = async (id, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this customer?`)) return;
    setProcessing(id);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/customer/${id}/toggle-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Customer ${action}ed`);
        fetchCustomers();
      } else {
        toast.error('Action failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setProcessing(null);
    }
  };

  const filtered = customers.filter(c => {
    const matchesSearch = !search ||
      c.company?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.gst?.toLowerCase().includes(search.toLowerCase());
      
    if (!matchesSearch) return false;
    
    if (activeTab === 'pending') return !c.isVerified && !c.isBlocked;
    if (activeTab === 'active') return c.isVerified && !c.isBlocked;
    if (activeTab === 'blocked') return c.isBlocked;
    
    return true;
  });

  const pendingCount = customers.filter(c => !c.isVerified && !c.isBlocked).length;
  const activeCount = customers.filter(c => c.isVerified && !c.isBlocked).length;
  const blockedCount = customers.filter(c => c.isBlocked).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-icon bg-primary/10 text-primary">
          <Users size={22} />
        </div>
        <div>
          <h1 className="page-title">Customer Management</h1>
          <p className="page-subtitle">Verify, warn, and manage customer access to the portal.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'pending' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Pending <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 text-[10px] leading-none">{pendingCount}</span>
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'active' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Active <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 text-[10px] leading-none">{activeCount}</span>
        </button>
        <button
          onClick={() => setActiveTab('blocked')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'blocked' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Blocked <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-600 text-[10px] leading-none">{blockedCount}</span>
        </button>
      </div>

      {/* Table */}
      <div className="data-table-wrapper">
        <div className="data-table-header">
          <h3 className="font-bold text-foreground">
            {activeTab === 'pending' ? 'Pending Verifications' : activeTab === 'active' ? 'Active Customers' : 'Blocked Customers'}
          </h3>
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by company, GST or email..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <th className="data-table-cell text-left">Company</th>
                <th className="data-table-cell text-left">GST Number</th>
                <th className="data-table-cell text-left">Registered</th>
                <th className="data-table-cell text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="data-table-cell">
                      <div className="h-4 bg-muted rounded-lg w-40 animate-pulse mb-2" />
                      <div className="h-3 bg-muted rounded-lg w-28 animate-pulse" />
                    </td>
                    <td className="data-table-cell"><div className="h-4 bg-muted rounded-lg w-32 animate-pulse" /></td>
                    <td className="data-table-cell"><div className="h-4 bg-muted rounded-lg w-24 animate-pulse" /></td>
                    <td className="data-table-cell text-right"><div className="h-8 bg-muted rounded-lg w-32 animate-pulse ml-auto" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-16 text-center">
                    <UserCheck size={40} className="mx-auto mb-3 text-muted-foreground/30" />
                    <p className="font-semibold text-foreground">
                      {search ? 'No results found' : 'No customers in this status'}
                    </p>
                  </td>
                </tr>
              ) : filtered.map((customer) => (
                <tr key={customer.id} className="data-table-row">
                  <td className="data-table-cell">
                    <a href={`/dashboard/customers/${customer.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${customer.isBlocked ? 'bg-rose-100 text-rose-700' : 'bg-primary/10 text-primary'}`}>
                        {customer.company?.[0] || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-primary hover:underline">{customer.company || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">{customer.email}</p>
                      </div>
                    </a>
                  </td>
                  <td className="data-table-cell">
                    <code className="text-xs bg-muted px-2 py-1 rounded-lg font-mono">
                      {customer.gst || '—'}
                    </code>
                  </td>
                  <td className="data-table-cell text-muted-foreground">
                    {customer.appliedAt ? new Date(customer.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="data-table-cell text-right">
                    <div className="flex items-center justify-end gap-2">
                      {activeTab === 'pending' && (
                        <>
                          <button
                            onClick={() => verifyCustomer(customer.id)}
                            disabled={processing === customer.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition-colors border border-emerald-200"
                          >
                            <ShieldCheck size={13} /> Approve
                          </button>
                          <button
                            onClick={() => rejectCustomer(customer.id)}
                            disabled={processing === customer.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-xl text-xs font-semibold hover:bg-red-100 transition-colors border border-red-200 disabled:opacity-50"
                          >
                            <XCircle size={13} /> Reject
                          </button>
                        </>
                      )}
                      {activeTab === 'active' && (
                        <>
                          <button
                            onClick={() => toggleCustomerStatus(customer.id, 'block')}
                            disabled={processing === customer.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-xl text-xs font-semibold hover:bg-rose-100 transition-colors border border-rose-200 disabled:opacity-50"
                          >
                            <Ban size={13} /> Block
                          </button>
                        </>
                      )}
                      {activeTab === 'blocked' && (
                        <button
                          onClick={() => toggleCustomerStatus(customer.id, 'unblock')}
                          disabled={processing === customer.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition-colors border border-emerald-200 disabled:opacity-50"
                        >
                          <CheckCircle size={13} /> Unblock
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
