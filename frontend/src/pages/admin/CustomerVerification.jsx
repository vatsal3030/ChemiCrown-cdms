import { useState, useEffect } from 'react';
import { ShieldCheck, XCircle, Search, UserCheck, Building2, Clock, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function CustomerVerification() {
  const { token } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [rejecting, setRejecting] = useState(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/pending-customers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setCustomers(data.customers);
    } catch {
      toast.error('Failed to load pending customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const verifyCustomer = async (id) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-customer/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) toast.success('Customer verified & activated!');
      else { toast.error('Verification failed'); fetchCustomers(); }
    } catch {
      toast.error('Network error'); fetchCustomers();
    }
  };

  const rejectCustomer = async (id) => {
    if (!window.confirm('Reject and remove this customer account?')) return;
    setRejecting(id);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-customer/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success || res.ok) {
        setCustomers(prev => prev.filter(c => c.id !== id));
        toast.success('Customer rejected');
      } else {
        toast.error(data.error || 'Failed to reject');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setRejecting(null);
    }
  };

  const filtered = customers.filter(c =>
    !search ||
    c.company?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.gst?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-icon bg-primary/10 text-primary">
          <UserCheck size={22} />
        </div>
        <div>
          <h1 className="page-title">Customer Verification</h1>
          <p className="page-subtitle">Review and approve new B2B customer registrations.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="kpi-card">
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <Clock size={16} /> <span className="text-xs font-semibold uppercase tracking-wider">Pending</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{customers.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Awaiting verification</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <ShieldCheck size={16} /> <span className="text-xs font-semibold uppercase tracking-wider">Approved Today</span>
          </div>
          <p className="text-3xl font-bold text-foreground">—</p>
          <p className="text-xs text-muted-foreground mt-1">Real-time data</p>
        </div>
        <div className="kpi-card">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Users size={16} /> <span className="text-xs font-semibold uppercase tracking-wider">Process</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Verify company GST and approve to grant portal access.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="data-table-wrapper">
        <div className="data-table-header">
          <h3 className="font-bold text-foreground">Pending Registrations</h3>
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
                    <ShieldCheck size={40} className="mx-auto mb-3 text-muted-foreground/30" />
                    <p className="font-semibold text-foreground">
                      {search ? 'No results found' : 'No pending verifications'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {search ? 'Try a different search term.' : 'All customer registrations are up to date.'}
                    </p>
                  </td>
                </tr>
              ) : filtered.map((customer) => (
                <tr key={customer.id} className="data-table-row">
                  <td className="data-table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                        {customer.company?.[0] || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{customer.company || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">{customer.email}</p>
                      </div>
                    </div>
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
                      <button
                        onClick={() => verifyCustomer(customer.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition-colors border border-emerald-200"
                      >
                        <ShieldCheck size={13} /> Approve
                      </button>
                      <button
                        onClick={() => rejectCustomer(customer.id)}
                        disabled={rejecting === customer.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-xl text-xs font-semibold hover:bg-red-100 transition-colors border border-red-200 disabled:opacity-50"
                      >
                        <XCircle size={13} /> Reject
                      </button>
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
