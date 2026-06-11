import { useParams, Link } from 'react-router-dom';
import useSWR from 'swr';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Package, User, Building, Calendar, Info, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

export default function StockHistoryDetails() {
  const { id } = useParams();
  const { token } = useAuth();

  const fetcher = async (url) => {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data;
  };

  const { data: transaction, error, isLoading } = useSWR(
    token ? `${import.meta.env.VITE_API_URL}/api/inventory/logs/${id}` : null,
    fetcher
  );

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl pb-20">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-foreground">Transaction not found</h2>
        <p className="text-muted-foreground mt-2">The record you are looking for does not exist or has been deleted.</p>
        <Link to="/dashboard/stock-history" className="text-primary hover:underline mt-4 inline-block font-semibold">
          &larr; Back to Stock History
        </Link>
      </div>
    );
  }

  const product = transaction.inventory?.product;
  const supplier = transaction.supplier;
  const user = transaction.user;
  const isStockIn = transaction.type === 'IN';

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in duration-500 pb-20">
      <div className="flex flex-wrap items-center gap-4">
        <Link to="/dashboard/stock-history" className="p-2 bg-card border border-border rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transaction Details</h1>
          <p className="text-slate-500 mt-1 flex flex-wrap items-center gap-2">
            Record ID: <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-foreground">{transaction.id}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-2xl shadow-sm p-6 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full -mr-16 -mt-16 opacity-10 ${isStockIn ? 'bg-emerald-500' : 'bg-red-500'}`} />
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 relative">
              <div>
                <h2 className="text-lg font-bold">Transaction Overview</h2>
                <p className="text-sm text-muted-foreground mt-1">Key details of the inventory movement.</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${isStockIn ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                {isStockIn ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                {isStockIn ? 'STOCK IN' : 'STOCK OUT'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Quantity {isStockIn ? 'Added' : 'Removed'}</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-5xl font-black tracking-tight ${isStockIn ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {isStockIn ? '+' : '-'}{transaction.quantity}
                  </span>
                  <span className="text-lg font-semibold text-muted-foreground">{product?.unit || 'Units'}</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex flex-wrap items-center gap-1.5"><Calendar size={14} /> Date & Time</p>
                <p className="text-base font-semibold text-foreground">{new Date(transaction.createdAt).toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p className="text-sm text-muted-foreground">{new Date(transaction.createdAt).toLocaleTimeString('en-US')}</p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex flex-wrap items-center gap-1.5"><Package size={14} /> Product</p>
                <p className="text-lg font-bold text-primary">{product?.name || 'Unknown Product'}</p>
                <p className="text-sm text-muted-foreground">SKU: {product?.sku || 'N/A'}</p>
                {product && (
                  <Link to={`/dashboard/inventory/product/${product.id}`} className="text-sm text-blue-600 hover:underline mt-2 inline-block">
                    View product catalog &rarr;
                  </Link>
                )}
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex flex-wrap items-center gap-1.5"><User size={14} /> Executed By</p>
                {user ? (
                  <div>
                    <p className="text-base font-bold text-foreground">{user.firstName} {user.lastName}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    {user.employeeProfile && (
                      <Link to={`/dashboard/hr/employee/${user.employeeProfile.id}`} className="text-sm text-blue-600 hover:underline mt-1 inline-block">
                        View employee profile &rarr;
                      </Link>
                    )}
                  </div>
                ) : (
                  <p className="text-base font-bold text-foreground">{transaction.createdBy || 'System Admin'}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex flex-wrap items-center gap-2"><FileText size={16} /> Remarks & Notes</h3>
            {transaction.remarks ? (
              <div className="p-4 bg-muted/50 rounded-xl border border-border text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                {transaction.remarks}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No remarks provided for this transaction.</p>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {supplier && (
            <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex flex-wrap items-center gap-2"><Building size={16} /> Supplier Info</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Company</p>
                  <p className="font-semibold text-foreground">{supplier.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Contact Person</p>
                  <p className="text-sm text-foreground">{supplier.contactPerson || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm text-foreground">{supplier.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm text-foreground">{supplier.phone || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex flex-wrap items-center gap-2"><Info size={16} /> Meta Data</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Transaction ID</p>
                <p className="text-xs font-mono text-foreground break-all">{transaction.id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Inventory ID</p>
                <p className="text-xs font-mono text-foreground break-all">{transaction.inventoryId}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created At</p>
                <p className="text-sm text-foreground">{new Date(transaction.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
