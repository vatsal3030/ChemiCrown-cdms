import { useState, useEffect } from 'react';
import { Trash2, RotateCcw, AlertTriangle, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useDialog } from '@/context/DialogContext';
import { SkeletonTableBody } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function RecycleBin() {
  const { token, user } = useAuth();
  const { confirm } = useDialog();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const getDaysRemaining = (deletedAtStr) => {
    const deletedAt = new Date(deletedAtStr);
    const expiryDate = new Date(deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const fetchTrash = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/trash`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setItems(json.data);
      }
    } catch {
      toast.error('Failed to load recycle bin');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, [token]);

  const handleRestore = async (id, type) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/trash/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id, type })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message);
        fetchTrash();
      } else {
        toast.error(json.error || 'Failed to restore');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const handlePermanentDelete = async (id, type, name) => {
    const confirmed = await confirm(
      '🚨 PERMANENT DELETE',
      `This will permanently delete "${name}" (${type}) and ALL related data. This action CANNOT be undone.`,
      { type: 'danger', confirmLabel: 'Delete Forever' }
    );
    if (!confirmed) return;

    setDeletingId(id);
    try {
      // Pass id & type as query params — DELETE with body is unreliable
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/trash/permanent?id=${encodeURIComponent(id)}&type=${encodeURIComponent(type)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const json = await res.json();
      if (json.success) {
        toast.success(`${type === 'PRODUCT' ? 'Product' : 'Employee'} permanently deleted`);
        fetchTrash();
      } else {
        toast.error(json.error || 'Failed to permanently delete');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setDeletingId(null);
    }
  };

  if (!['SUPER_ADMIN', 'OWNER', 'MANAGER'].includes(user?.role)) {
    return (
      <div className="p-8 text-center mt-20">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground mt-2">You do not have permission to view the Recycle Bin.</p>
      </div>
    );
  }

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recycle Bin</h1>
          <p className="text-slate-500 mt-1">Restore soft-deleted items. {isSuperAdmin ? 'Super Admins can permanently delete items.' : 'Items older than 30 days are purged automatically.'}</p>
        </div>
        {isSuperAdmin && items.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-rose-600 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg px-3 py-2">
            <Flame size={13} />
            <span className="font-semibold">Permanent delete available</span>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead className="bg-muted/50">
                <tr className="data-table-header">
                  <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider">Name / ID</th>
                  <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider">Deleted On</th>
                  <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <SkeletonTableBody columns={4} rows={5} />
              </tbody>
            </table>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <Trash2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Recycle Bin is empty</h3>
            <p className="text-slate-500 mt-1">No soft-deleted items found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead className="bg-muted/50">
                <tr className="data-table-header">
                  <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider">Name / ID</th>
                  <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider">Deleted On</th>
                  <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {items.map(item => (
                  <tr key={item.id} className="data-table-row hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                    <td className="data-table-cell px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${item.type === 'PRODUCT' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="data-table-cell px-6 py-4 font-medium">
                      {item.name} {item.sku && <span className="text-slate-400 text-xs ml-2">({item.sku})</span>}
                    </td>
                    <td className="data-table-cell px-6 py-4 text-slate-500">
                      <div>{new Date(item.deletedAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                      <div className="text-[11px] text-amber-600 font-semibold mt-0.5">
                        Permanently deleted in {getDaysRemaining(item.deletedAt)} days
                      </div>
                    </td>
                    <td className="data-table-cell px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button onClick={() => handleRestore(item.id, item.type)} variant="outline" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200">
                          <RotateCcw size={14} className="mr-1.5" /> Restore
                        </Button>
                        {isSuperAdmin && (
                          <Button
                            onClick={() => handlePermanentDelete(item.id, item.type, item.name)}
                            variant="outline"
                            size="sm"
                            disabled={deletingId === item.id}
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                          >
                            <Flame size={14} className="mr-1.5" />
                            {deletingId === item.id ? 'Deleting...' : 'Delete Forever'}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
