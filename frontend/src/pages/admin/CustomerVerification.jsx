import { useState, useEffect } from 'react';
import { ShieldCheck, XCircle, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function CustomerVerification() {
  const { token } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/pending-customers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers);
      }
    } catch (err) {
      toast.error('Failed to load pending customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const verifyCustomer = async (id) => {
    try {
      // Optimistic update
      setCustomers(prev => prev.filter(c => c.id !== id));
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-customer/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Customer Verified Successfully!');
      } else {
        toast.error('Verification failed');
        fetchCustomers(); // Revert on failure
      }
    } catch (err) {
      toast.error('Network error');
      fetchCustomers(); // Revert on failure
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Customer Verification</h1>
          <p className="text-muted-foreground mt-2">Approve new B2B customer registrations to grant ordering access.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex items-center bg-muted/30">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search by Company Name or GST..." 
              className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground text-xs uppercase font-semibold border-b border-border">
              <tr>
                <th className="px-6 py-4">Company Details</th>
                <th className="px-6 py-4">GST Number</th>
                <th className="px-6 py-4">Date Applied</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-48 mb-2"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-32"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
                        <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-muted-foreground">
                    No pending customer verifications.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">{customer.company}</p>
                      <p className="text-muted-foreground">{customer.email}</p>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{customer.gst}</td>
                    <td className="px-6 py-4">{customer.appliedAt}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => verifyCustomer(customer.id)}
                        className="inline-flex items-center justify-center p-2 bg-success/10 text-success rounded-md hover:bg-success hover:text-white transition-colors"
                        title="Approve Customer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                      </button>
                      <button 
                        className="inline-flex items-center justify-center p-2 bg-destructive/10 text-destructive rounded-md hover:bg-destructive hover:text-white transition-colors"
                        title="Reject Customer"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
