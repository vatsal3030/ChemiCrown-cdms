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
              <BarChart data={topCustomers} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                <XAxis type="number" tickFormatter={(v) => `₹${v/1000}k`} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => formatINRFull(value)} cursor={{fill: 'var(--muted)'}} />
                <Bar dataKey="revenue" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} />
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
                <Pie data={orderStatusDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" nameKey="name" label>
                  {orderStatusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
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
              <BarChart data={inventoryValuation} margin={{ top: 5, right: 10, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" angle={-45} textAnchor="end" tick={{ fontSize: 10 }} interval={0} height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip cursor={{fill: 'var(--muted)'}} />
                <Bar dataKey="stock" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
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
