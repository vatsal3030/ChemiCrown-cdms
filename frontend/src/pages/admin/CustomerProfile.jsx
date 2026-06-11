import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { ArrowLeft, Building2, Mail, Phone, MapPin, User, FileText, Ban, CheckCircle, Package, Clock, DollarSign, Activity, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function CustomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user: currentUser } = useAuth();
  const [processing, setProcessing] = useState(false);

  const fetcher = async (url) => {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json;
  };

  const { data, error, mutate } = useSWR(
    token ? `${import.meta.env.VITE_API_URL}/api/auth/customers/${id}` : null,
    fetcher
  );

  const customer = data?.data;
  const loading = !data && !error;

  const toggleCustomerStatus = async (action) => {
    if (!window.confirm(`Are you sure you want to ${action} this customer?`)) return;
    setProcessing(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/customer/${id}/toggle-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Customer ${action}ed`);
        mutate();
      } else {
        toast.error('Action failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-6 animate-pulse">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="p-8 text-center text-slate-500">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2">Customer Not Found</h2>
        <Button onClick={() => navigate('/dashboard/verify')}>Back to Customers</Button>
      </div>
    );
  }

  const { user } = customer;
  const isBlocked = !!user.deletedAt;
  const isVerified = customer.isVerified;

  const totalOrders = customer.orders?.length || 0;
  const completedOrders = customer.orders?.filter(o => o.status === 'DELIVERED').length || 0;
  const totalSpent = customer.orders?.filter(o => o.status !== 'CANCELLED' && o.status !== 'RETURNED').reduce((acc, o) => acc + o.total, 0) || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard/verify')}
            className="p-2 -ml-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Customer Profile</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isBlocked ? (
            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-rose-100 text-rose-700">Blocked</span>
          ) : isVerified ? (
            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-700">Active</span>
          ) : (
            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 text-amber-700">Pending</span>
          )}
          
          {['SUPER_ADMIN', 'OWNER'].includes(currentUser?.role) && (isVerified || isBlocked) && (
            <div className="flex flex-wrap items-center gap-2">
              {!isBlocked && (
                <Button 
                  variant="outline" 
                  className="bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 border-amber-200"
                  size="sm" 
                  onClick={() => toggleCustomerStatus('warn')}
                  disabled={processing}
                >
                  <AlertTriangle size={14} className="mr-2" /> Warn
                </Button>
              )}
              <Button 
                variant={isBlocked ? "outline" : "destructive"} 
                size="sm" 
                onClick={() => toggleCustomerStatus(isBlocked ? 'unblock' : 'block')}
                disabled={processing}
              >
                {isBlocked ? <><CheckCircle size={14} className="mr-2" /> Unblock</> : <><Ban size={14} className="mr-2" /> Block</>}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-primary"></div>
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl">
                {customer.companyName?.[0] || user.firstName[0]}
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{customer.companyName || `${user.firstName} ${user.lastName}`}</h2>
                <p className="text-sm text-muted-foreground">Customer ID: #{customer.id.substring(0, 8)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0"><User size={14} /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Contact Person</p>
                  <p className="font-medium text-foreground">{user.firstName} {user.lastName}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0"><Mail size={14} /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">{user.email}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0"><Phone size={14} /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium text-foreground">{user.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0"><FileText size={14} /></div>
                <div>
                  <p className="text-xs text-muted-foreground">GST Number</p>
                  <p className="font-medium text-foreground font-mono">{customer.gstNumber || 'N/A'}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0"><MapPin size={14} /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Billing Address</p>
                  <p className="font-medium text-foreground">{customer.billingAddress || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
             <h3 className="text-sm font-bold text-foreground mb-4">Customer Stats</h3>
             <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2 text-muted-foreground"><Package size={16} /> Total Orders</div>
                  <div className="font-bold">{totalOrders}</div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2 text-emerald-600"><CheckCircle size={16} /> Completed</div>
                  <div className="font-bold">{completedOrders}</div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2 text-primary"><DollarSign size={16} /> Total Spent</div>
                  <div className="font-bold">₹{totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2 text-muted-foreground"><Clock size={16} /> Joined</div>
                  <div className="font-medium text-sm">{new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</div>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: Order History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-4 flex flex-wrap items-center gap-2">
              <Activity size={18} className="text-primary" /> Order History
            </h3>
            
            {customer.orders?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package size={32} className="mx-auto mb-2 opacity-30" />
                <p>No orders placed yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/50">
                    <tr className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-left">
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Items</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {customer.orders?.map(order => (
                      <tr key={order.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(`/dashboard/orders/${order.id}`)}>
                        <td className="py-3 px-4 font-mono font-medium">#{order.id.substring(0,8).toUpperCase()}</td>
                        <td className="py-3 px-4 text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                        <td className="py-3 px-4">{order.items?.length || 0}</td>
                        <td className="py-3 px-4 font-semibold">₹{order.total?.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                            order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700' :
                            order.status === 'CANCELLED' ? 'bg-rose-100 text-rose-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
