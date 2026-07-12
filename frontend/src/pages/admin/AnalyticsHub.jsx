import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  AreaChart, Area
} from 'recharts';
import { 
  AlertCircle, Box, Users, TrendingUp, RefreshCw, 
  BarChart2, Palette, Sliders, Layers, Eye, Download, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatINRFull } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const THEME_COLORS = {
  indigo: ['#6366F1', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
  emerald: ['#10B981', '#059669', '#34D399', '#047857', '#065F46'],
  cyberpunk: ['#FF007F', '#7B2CBF', '#3A0CA3', '#4361EE', '#4CC9F0']
};

export default function AnalyticsHub() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTheme, setActiveTheme] = useState('indigo');
  const [inventoryChartType, setInventoryChartType] = useState('bar'); // 'bar' | 'area'
  
  // Customization filters
  const [customerSearch, setCustomerSearch] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');

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

  // PDF print simulation
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { topCustomers, orderStatusDistribution, inventoryValuation, expiringLotsCount, stockOutCount } = data;

  // Filtered lists
  const filteredCustomers = topCustomers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const filteredInventory = inventoryValuation.filter(i => 
    i.name.toLowerCase().includes(inventorySearch.toLowerCase())
  );

  // Calculations for KPI Cards
  const totalRevenue = topCustomers.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalOrders = orderStatusDistribution.reduce((acc, curr) => acc + curr.value, 0);
  const totalStockItems = inventoryValuation.reduce((acc, curr) => acc + curr.stock, 0);
  const colors = THEME_COLORS[activeTheme];

  return (
    <div className="space-y-8 p-1 md:p-4 animate-in fade-in duration-500 print:bg-white print:text-black">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6 print:hidden">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-2 text-foreground tracking-tight">
            <BarChart2 className="text-primary animate-pulse" /> Advanced Analytics Hub
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Deep dive into sales performance, inventory health, and fulfillment metrics.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Theme Selector */}
          <div className="flex items-center gap-1.5 bg-muted/65 border border-border p-1 rounded-xl">
            <Palette size={14} className="text-muted-foreground ml-2" />
            <select 
              value={activeTheme} 
              onChange={e => setActiveTheme(e.target.value)} 
              className="text-xs bg-transparent border-0 font-bold focus:ring-0 cursor-pointer text-foreground pr-8"
            >
              <option value="indigo">Classic Indigo</option>
              <option value="emerald">Emerald Forest</option>
              <option value="cyberpunk">Cyberpunk Neon</option>
            </select>
          </div>

          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 font-bold h-9">
            <Download size={14} /> Export Report
          </Button>

          <Button variant="outline" size="sm" onClick={fetchReports} className="h-9 px-3">
            <RefreshCw size={14} />
          </Button>
        </div>
      </div>

      {/* ── KPI Dashboard Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs relative overflow-hidden transition-all hover:shadow-md hover:border-primary/20">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Top Customer Revenue</p>
              <h3 className="text-xl font-extrabold text-foreground mt-1">{formatINRFull(totalRevenue)}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-500 font-bold">
            <span>Live Sales Segment</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs relative overflow-hidden transition-all hover:shadow-md hover:border-primary/20">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Fulfillment Volume</p>
              <h3 className="text-xl font-extrabold text-foreground mt-1">{totalOrders} Orders</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-blue-500 font-bold">
            <span>Total orders captured</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs relative overflow-hidden transition-all hover:shadow-md hover:border-primary/20">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Top Stock Volume</p>
              <h3 className="text-xl font-extrabold text-foreground mt-1">{totalStockItems} Units</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <Box size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-indigo-500 font-bold">
            <span>10 high-volume items</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs relative overflow-hidden transition-all hover:shadow-md hover:border-primary/20">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Alerts & Actions</p>
              <h3 className="text-xl font-extrabold text-foreground mt-1">{stockOutCount + expiringLotsCount} Issues</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-rose-500 font-bold animate-pulse">
            <span>Requires review</span>
          </div>
        </div>
      </div>

      {/* ── Charts Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Customers Chart */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h3 className="font-bold flex items-center gap-2 text-foreground text-base">
                <Users size={18} className="text-blue-500" /> Top Customers by Revenue
              </h3>
              {/* Filter */}
              <input
                type="text"
                placeholder="Search customers..."
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
                className="text-xs border border-border bg-muted/30 rounded-lg px-2.5 py-1.5 w-full sm:w-44 focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>
            {filteredCustomers.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No matching customer data</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={filteredCustomers} layout="vertical" margin={{ top: 10, right: 35, left: 15, bottom: 10 }}>
                  <defs>
                    <linearGradient id="customerGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={colors[0]} stopOpacity={0.85} />
                      <stop offset="100%" stopColor={colors[1]} stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} opacity={0.15} stroke="var(--border)" />
                  <XAxis type="number" tickFormatter={(v) => `₹${v/1000}k`} axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.15)' }}
                    formatter={(value) => [formatINRFull(value), 'Revenue']}
                    cursor={{ fill: 'var(--muted)', radius: 4 }}
                    labelStyle={{ fontWeight: 700, color: 'var(--foreground)' }}
                  />
                  <Bar dataKey="revenue" fill="url(#customerGrad)" radius={[0, 6, 6, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-xl">
            <Info size={14} className="shrink-0 text-primary" />
            <span>Top 5 registered clients ranked by cumulative delivered orders.</span>
          </div>
        </div>

        {/* Order Fulfillment Distribution (Donut style) */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold mb-4 flex items-center gap-2 text-foreground text-base">
              <TrendingUp size={18} className="text-emerald-500" /> Order Fulfillment Status
            </h3>
            {orderStatusDistribution.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No order data</div>
            ) : (
              <div className="relative flex justify-center">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie 
                      data={orderStatusDistribution} 
                      cx="50%" 
                      cy="48%" 
                      innerRadius={65} 
                      outerRadius={90} 
                      paddingAngle={4} 
                      dataKey="value" 
                      nameKey="name"
                    >
                      {orderStatusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.15)' }}
                      labelStyle={{ fontWeight: 700, color: 'var(--foreground)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center count info overlay */}
                <div className="absolute top-[37%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <span className="text-2xl font-black text-foreground block">{totalOrders}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total</span>
                </div>
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-xl">
            <Info size={14} className="shrink-0 text-primary" />
            <span>Fulfillment pipeline status showing the share of total orders logged.</span>
          </div>
        </div>

        {/* Inventory Stock Levels (Interactive Bar vs Area) */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h3 className="font-bold flex items-center gap-2 text-foreground text-base">
                <Box size={18} className="text-indigo-500" /> Top Inventory Stock Levels
              </h3>
              
              <div className="flex flex-wrap items-center gap-2">
                {/* Chart type toggle */}
                <div className="flex items-center gap-1 bg-muted/65 p-0.5 rounded-lg border border-border text-[10px] font-bold">
                  <button 
                    onClick={() => setInventoryChartType('bar')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${inventoryChartType === 'bar' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Bar
                  </button>
                  <button 
                    onClick={() => setInventoryChartType('area')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${inventoryChartType === 'area' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Area
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Search products..."
                  value={inventorySearch}
                  onChange={e => setInventorySearch(e.target.value)}
                  className="text-xs border border-border bg-muted/30 rounded-lg px-2.5 py-1.5 w-full sm:w-36 focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>
            </div>

            {filteredInventory.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No matching inventory items</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                {inventoryChartType === 'bar' ? (
                  <BarChart data={filteredInventory} margin={{ top: 15, right: 15, left: 10, bottom: 45 }}>
                    <defs>
                      <linearGradient id="invValGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={colors[2]} stopOpacity={1} />
                        <stop offset="100%" stopColor={colors[3]} stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} stroke="var(--border)" />
                    <XAxis dataKey="name" angle={-30} textAnchor="end" tick={{ fontSize: 9, fill: '#94A3B8' }} interval={0} height={60} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.15)' }}
                      cursor={{ fill: 'var(--muted)', radius: 4 }}
                      labelStyle={{ fontWeight: 700, color: 'var(--foreground)' }}
                    />
                    <Bar dataKey="stock" fill="url(#invValGrad)" radius={[6, 6, 0, 0]} barSize={20} />
                  </BarChart>
                ) : (
                  <AreaChart data={filteredInventory} margin={{ top: 15, right: 15, left: 10, bottom: 45 }}>
                    <defs>
                      <linearGradient id="invValAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={colors[2]} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={colors[2]} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} stroke="var(--border)" />
                    <XAxis dataKey="name" angle={-30} textAnchor="end" tick={{ fontSize: 9, fill: '#94A3B8' }} interval={0} height={60} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.15)' }}
                      labelStyle={{ fontWeight: 700, color: 'var(--foreground)' }}
                    />
                    <Area type="monotone" dataKey="stock" stroke={colors[2]} strokeWidth={3} fillOpacity={1} fill="url(#invValAreaGrad)" />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-xl">
            <Info size={14} className="shrink-0 text-primary" />
            <span>Top inventory items ranked by current total stock quantities (Units) in storage.</span>
          </div>
        </div>

        {/* Actionable Health Alerts */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold flex items-center gap-2 mb-6 text-foreground text-base">
              <AlertCircle size={18} className="text-rose-500 animate-pulse" /> Inventory Health Alerts
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-2xl hover:bg-rose-100/50 dark:hover:bg-rose-900/10 transition-colors">
                <div>
                  <p className="font-black text-rose-700 dark:text-rose-400 text-2xl">{stockOutCount}</p>
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-0.5">Products completely out of stock</p>
                </div>
                <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/40 rounded-xl flex items-center justify-center">
                  <Box className="text-rose-600" size={20} />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl hover:bg-amber-100/50 dark:hover:bg-amber-900/10 transition-colors">
                <div>
                  <p className="font-black text-amber-700 dark:text-amber-400 text-2xl">{expiringLotsCount}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-0.5">Lots expiring in the next 30 days</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center">
                  <AlertCircle className="text-amber-600" size={20} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex items-start gap-1.5 text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-xl leading-relaxed">
            <Info size={14} className="shrink-0 text-primary mt-0.5" />
            <span>Immediate procurement action is recommended for out-of-stock items, and discount/sales promotions for nearing-expiry lots.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
