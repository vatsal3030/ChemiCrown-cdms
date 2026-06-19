import { useParams, Link } from 'react-router-dom';
import useSWR from 'swr';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Package, User, Building, Calendar, Info, FileText, History } from 'lucide-react';
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

  const product = transaction?.inventory?.product;
  const { data: relatedLogs, isLoading: relatedLoading } = useSWR(
    token && product?.id ? `${import.meta.env.VITE_API_URL}/api/inventory/${product.id}/logs` : null,
    fetcher
  );

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl pb-12">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-[300px] w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-bold text-foreground">Transaction not found</h2>
        <p className="text-muted-foreground text-sm mt-1">The record you are looking for does not exist or has been deleted.</p>
        <Link to="/dashboard/stock-history" className="text-primary hover:underline mt-3 inline-block font-semibold text-sm">
          &larr; Back to Stock History
        </Link>
      </div>
    );
  }

  const supplier = transaction.supplier;
  const user = transaction.user;
  const isStockIn = transaction.type === 'IN';

  return (
    <div className="space-y-5 max-w-5xl animate-in fade-in duration-500 pb-16">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/dashboard/stock-history" className="p-2 bg-card border border-border rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transaction Details</h1>
          <p className="text-slate-500 text-xs mt-0.5 flex flex-wrap items-center gap-1.5">
            Record ID: <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded text-foreground">{transaction.id}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-card border border-border rounded-2xl shadow-sm p-5 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full -mr-12 -mt-12 opacity-10 ${isStockIn ? 'bg-emerald-500' : 'bg-red-500'}`} />
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 relative">
              <div>
                <h2 className="text-base font-bold">Transaction Overview</h2>
                <p className="text-xs text-muted-foreground">Key details of the inventory movement.</p>
              </div>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${isStockIn ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                {isStockIn ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {isStockIn ? 'STOCK IN' : 'STOCK OUT'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Quantity {isStockIn ? 'Added' : 'Removed'}</p>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-4xl font-black tracking-tight ${isStockIn ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {isStockIn ? '+' : '-'}{transaction.quantity}
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground">{product?.unit || 'Units'}</span>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 flex flex-wrap items-center gap-1.5"><Calendar size={12} /> Date & Time</p>
                <p className="text-sm font-semibold text-foreground">{new Date(transaction.createdAt).toLocaleString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                <p className="text-xs text-muted-foreground">{new Date(transaction.createdAt).toLocaleTimeString('en-IN')}</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 flex flex-wrap items-center gap-1.5"><Package size={12} /> Product</p>
                <p className="text-base font-bold text-primary">{product?.name || 'Unknown Product'}</p>
                <p className="text-xs text-muted-foreground">SKU: {product?.sku || 'N/A'}</p>
                {product && (
                  <Link to={`/dashboard/catalog/${product.id}`} className="text-xs text-blue-600 hover:underline mt-1.5 inline-block">
                    View product catalog &rarr;
                  </Link>
                )}
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 flex flex-wrap items-center gap-1.5"><User size={12} /> Executed By</p>
                {user ? (
                  <div>
                    <p className="text-sm font-bold text-foreground">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    {user.employeeProfile && (
                      <Link to={`/dashboard/hr/employee/${user.employeeProfile.id}`} className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                        View employee profile &rarr;
                      </Link>
                    )}
                  </div>
                ) : (
                  <p className="text-sm font-bold text-foreground">{transaction.createdBy || 'System Admin'}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-sm p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5 flex flex-wrap items-center gap-1.5"><FileText size={14} /> Remarks & Notes</h3>
            {transaction.remarks ? (
              <div className="p-3 bg-muted/50 rounded-xl border border-border text-foreground text-xs leading-relaxed whitespace-pre-wrap">
                {transaction.remarks}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No remarks provided for this transaction.</p>
            )}
          </div>

          {/* Related Transactions for this Product */}
          {product?.id && (
            <div className="bg-card border border-border rounded-2xl shadow-sm p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex flex-wrap items-center gap-1.5">
                <History size={14} /> Related Transactions for this Product
              </h3>
              {relatedLoading ? (
                <div className="space-y-1.5">
                  <Skeleton className="h-6 w-full rounded-md" />
                  <Skeleton className="h-6 w-full rounded-md" />
                </div>
              ) : !relatedLogs || relatedLogs.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No other transactions recorded for this product.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Quantity</th>
                        <th className="px-3 py-2">Executed By</th>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {relatedLogs.filter(l => l.id !== transaction.id).slice(0, 5).map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                          <td className="px-3 py-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${log.type === 'IN' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                              {log.type === 'IN' ? 'Stock In' : 'Stock Out'}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-semibold">
                            {log.type === 'IN' ? '+' : '-'}{log.quantity} {product.unit}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {log.user ? `${log.user.firstName} ${log.user.lastName}` : log.createdBy || 'System'}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground truncate max-w-[150px]" title={log.remarks}>
                            {log.remarks || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-5">
          {supplier && (
            <div className="bg-card border border-border rounded-2xl shadow-sm p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex flex-wrap items-center gap-1.5"><Building size={14} /> Supplier Info</h3>
              <div className="space-y-2.5 text-xs">
                <div>
                  <p className="text-[10px] text-muted-foreground">Company</p>
                  <p className="font-semibold text-foreground">{supplier.name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Contact Person</p>
                  <p className="text-foreground">{supplier.contactPerson || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Email</p>
                  <p className="text-foreground break-all">{supplier.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Phone</p>
                  <p className="text-foreground">{supplier.phone || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-2xl shadow-sm p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex flex-wrap items-center gap-1.5"><Info size={14} /> Meta Data</h3>
            <div className="space-y-2.5 text-xs">
              <div>
                <p className="text-[10px] text-muted-foreground">Transaction ID</p>
                <p className="font-mono text-foreground break-all">{transaction.id}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Inventory ID</p>
                <p className="font-mono text-foreground break-all">{transaction.inventoryId}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Created At</p>
                <p className="text-foreground">{new Date(transaction.createdAt).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
