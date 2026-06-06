import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats: {
      revenue: 0,
      orders: 0,
      pendingOrders: 0,
      customers: 0,
      newCustomers: 0,
      inventoryAlerts: 0
    },
    revenueData: [],
    inventoryData: [],
    attendanceData: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/analytics/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const COLORS = ['#10B981', '#EF4444', '#F59E0B'];

  if (user?.role === 'CUSTOMER') {
    return <Navigate to="/dashboard/catalog" replace />;
  }

  if (loading) return <div className="p-8 text-center">Loading live dashboard data...</div>;

  const { stats, revenueData, inventoryData, attendanceData } = data;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.firstName || 'User'}!</h1>
          <p className="text-slate-500 mt-1">Here's an overview of your operations today.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass p-6 rounded-2xl border-l-4 border-l-primary flex flex-col justify-between group hover:shadow-lg transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total Revenue</p>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-50">₹{stats.revenue.toLocaleString()}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <DollarSign size={24} />
            </div>
          </div>
          <div className="flex items-center text-sm font-medium text-green-600 bg-green-50 dark:bg-green-900/20 w-fit px-2 py-1 rounded-md">
            <TrendingUp size={16} className="mr-1" /> +12.5% from last month
          </div>
        </div>

        <div className="glass p-6 rounded-2xl border-l-4 border-l-blue-500 flex flex-col justify-between group hover:shadow-lg transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Active Orders</p>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-50">{stats.orders}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
              <ShoppingCart size={24} />
            </div>
          </div>
          <div className="flex items-center text-sm font-medium text-slate-500">
            {stats.pendingOrders} pending approval
          </div>
        </div>

        <div className="glass p-6 rounded-2xl border-l-4 border-l-orange-500 flex flex-col justify-between group hover:shadow-lg transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Verified Customers</p>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-50">{stats.customers}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
              <Users size={24} />
            </div>
          </div>
          <div className="flex items-center text-sm font-medium text-slate-500">
            {stats.newCustomers} new this week
          </div>
        </div>

        <div className="glass p-6 rounded-2xl border-l-4 border-l-red-500 flex flex-col justify-between group hover:shadow-lg transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Low Inventory Alerts</p>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-50">{stats.inventoryAlerts}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
              <AlertTriangle size={24} />
            </div>
          </div>
          <div className="flex items-center text-sm font-medium text-red-500 bg-red-50 dark:bg-red-900/20 w-fit px-2 py-1 rounded-md">
            Restock required
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue Trend Line Chart */}
        <div className="glass p-6 rounded-2xl border border-border">
          <h3 className="text-lg font-bold mb-6">Revenue Trend (YTD)</h3>
          <div className="w-full">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} tickFormatter={(value) => `₹${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`₹${value}`, 'Revenue']}
                />
                <Line type="monotone" dataKey="value" stroke="#1F2E54" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Stock Bar Chart */}
        <div className="glass p-6 rounded-2xl border border-border">
          <h3 className="text-lg font-bold mb-6">Top Products Inventory</h3>
          <div className="w-full">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={inventoryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{fill: '#f1f5f9'}}
                />
                <Bar dataKey="stock" fill="#E6513A" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Pie Chart */}
        <div className="glass p-6 rounded-2xl border border-border lg:col-span-1">
          <h3 className="text-lg font-bold mb-2">Today's Attendance</h3>
          <div className="w-full flex justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={attendanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {attendanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="glass p-6 rounded-2xl border border-border lg:col-span-2">
          <h3 className="text-lg font-bold mb-4">Recent Orders</h3>
          <div className="space-y-4">
            {data.recentOrders?.length === 0 && <p className="text-sm text-slate-500">No recent orders.</p>}
            {data.recentOrders?.map((order) => (
              <div key={order.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-500">
                  <ShoppingCart size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-50">New Order placed by {order.customer?.companyName || 'Unknown Customer'}</p>
                  <p className="text-xs text-slate-500 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <Link to="/dashboard/orders">
                  <Button variant="outline" size="sm">View</Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
