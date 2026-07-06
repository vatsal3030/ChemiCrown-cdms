import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { AlertCircle, Box, Users, TrendingUp, RefreshCw, BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatINRFull } from '@/lib/utils';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function AnalyticsHub() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        toast.error('Failed to fetch analytics');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { topCustomers, orderStatusDistribution, inventoryValuation, expiringLotsCount, stockOutCount } = data;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-foreground">
            <BarChart2 className="text-primary" /> Advanced Analytics Hub
          </h1>
          <p className="text-muted-foreground mt-1">Deep dive into sales performance, inventory health, and fulfillment metrics.</p>
        </div>
        <button onClick={fetchReports} className="p-2 border border-border rounded-lg hover:bg-muted transition-colors">
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Top Customers Chart */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Users size={18} className="text-blue-500" /> Top Customers by Revenue
          </h3>
          {topCustomers.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No customer data</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topCustomers} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="customerGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#1e3a8a" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} opacity={0.15} stroke="var(--border)" />
                <XAxis type="number" tickFormatter={(v) => `₹${v/1000}k`} axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.15)' }}
                  formatter={(value) => [formatINRFull(value), 'Revenue']}
                  cursor={{ fill: 'var(--muted)', radius: 4 }}
                  labelStyle={{ fontWeight: 600, color: 'var(--foreground)' }}
                />
                <Bar dataKey="revenue" fill="url(#customerGrad)" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Order Fulfillment Distribution */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-500" /> Order Fulfillment Status
          </h3>
          {orderStatusDistribution.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No order data</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={orderStatusDistribution} cx="50%" cy="40%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                  {orderStatusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.15)' }}
                  labelStyle={{ fontWeight: 600, color: 'var(--foreground)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Inventory Stock Levels */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Box size={18} className="text-indigo-500" /> Top Inventory Stock Levels
          </h3>
          {inventoryValuation.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No inventory data</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={inventoryValuation} margin={{ top: 10, right: 10, left: -25, bottom: 25 }}>
                <defs>
                  <linearGradient id="invValGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#c084fc" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} stroke="var(--border)" />
                <XAxis dataKey="name" angle={-30} textAnchor="end" tick={{ fontSize: 9, fill: '#94A3B8' }} interval={0} height={60} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.15)' }}
                  cursor={{ fill: 'var(--muted)', radius: 4 }}
                  labelStyle={{ fontWeight: 600, color: 'var(--foreground)' }}
                />
                <Bar dataKey="stock" fill="url(#invValGrad)" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Actionable Health Alerts */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-center gap-6">
          <h3 className="font-bold flex items-center gap-2 mb-2">
            <AlertCircle size={18} className="text-rose-500" /> Inventory Health Alerts
          </h3>
          
          <div className="flex items-center justify-between p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl">
            <div>
              <p className="font-bold text-rose-700 dark:text-rose-400 text-lg">{stockOutCount}</p>
              <p className="text-sm text-rose-600 dark:text-rose-500 font-medium">Products completely out of stock</p>
            </div>
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/40 rounded-full flex items-center justify-center">
              <Box className="text-rose-600" />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <div>
              <p className="font-bold text-amber-700 dark:text-amber-400 text-lg">{expiringLotsCount}</p>
              <p className="text-sm text-amber-600 dark:text-amber-500 font-medium">Lots expiring in the next 30 days</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center">
              <AlertCircle className="text-amber-600" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
