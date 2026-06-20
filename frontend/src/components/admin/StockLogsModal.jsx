import { useState, useEffect } from 'react';
import { X, History, ArrowUpRight, ArrowDownRight, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function StockLogsModal({ isOpen, onClose, product, token }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/inventory/${product.id}/logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setLogs(json.data);
      } else {
        toast.error('Failed to load stock history');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred while fetching logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && product && token) {
      fetchLogs();
    }
  }, [isOpen, product, token]);

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <History className="text-primary" />
              Stock History
            </h2>
            <p className="text-sm text-slate-500 mt-1">Transaction logs for {product.name}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-muted/20">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">No stock transactions found for this product.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full shrink-0 ${log.type === 'IN' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {log.type === 'IN' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-bold text-lg ${log.type === 'IN' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {log.type === 'IN' ? '+' : '-'}{log.quantity}
                        </span>
                        <span className="text-sm text-slate-500 font-medium">
                          {product.unit}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {log.remarks || 'No remarks provided'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:items-end text-sm text-slate-500 border-t md:border-t-0 md:border-l border-border pt-3 md:pt-0 md:pl-4">
                    <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300 mb-1">
                      <User size={14} />
                      {log.createdBy || 'System'}
                    </div>
                    <div>{new Date(log.createdAt).toLocaleString()}</div>
                    {log.supplier && (
                      <div className="mt-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full inline-block">
                        Supplier: {log.supplier.name}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-card flex justify-end">
          <Button onClick={onClose} variant="outline">Close</Button>
        </div>
      </div>
    </div>
  );
}
