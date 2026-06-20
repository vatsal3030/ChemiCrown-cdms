import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search, SlidersHorizontal, RefreshCw, X, ArrowUpDown, 
  Archive, FileText, CheckCircle, AlertTriangle, AlertCircle, Trash2, Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SkeletonTableBody } from '@/components/ui/Skeleton';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import CoAGeneratorModal from '@/components/CoAGeneratorModal';
import CreateLotModal from '@/components/CreateLotModal';

const STATUS_COLORS = {
  QUARANTINED: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400',
  APPROVED: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
  REJECTED: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400',
  EXPIRED: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400'
};

export default function Lots() {
  const { token, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Pagination & Filtering
  const limit = 15;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('q') || '';
  const statusFilter = searchParams.get('status') || 'all';
  const sortField = searchParams.get('sort') || 'createdAt';
  const sortOrder = searchParams.get('order') || 'desc';

  const [temp, setTemp] = useState({ search, status: statusFilter });
  const [showFilters, setShowFilters] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedLot, setSelectedLot] = useState(null);
  const [coaGeneratorOpen, setCoaGeneratorOpen] = useState(false);

  const setParam = (key, value) => {
    setSearchParams(prev => {
      if (!value || value === 'all') prev.delete(key);
      else prev.set(key, value);
      if (key !== 'page') prev.set('page', '1');
      return prev;
    }, { replace: true });
  };

  const fetchLots = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit, sortField, sortOrder });
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/lots?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setLots(json.data);
        setTotal(json.pagination.total);
      } else {
        toast.error(json.message || 'Failed to load lots');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, sortField, sortOrder, token]);

  useEffect(() => { fetchLots(); }, [fetchLots]);

  const toggleSort = (field) => {
    if (sortField === field) setParam('order', sortOrder === 'asc' ? 'desc' : 'asc');
    else { setParam('sort', field); setParam('order', 'asc'); }
  };

  const updateLotStatus = async (id, newStatus) => {
    if (!window.confirm(`Are you sure you want to change this lot's status to ${newStatus}?`)) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/lots/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Lot status updated to ${newStatus}`);
        fetchLots();
      } else {
        toast.error(json.message || 'Failed to update status');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="page-header mb-0">
        <div className="page-header-icon bg-primary/10 text-primary">
          <Archive size={22} />
        </div>
        <div className="flex-1">
          <h1 className="page-title">Lot & Batch Tracking</h1>
          <p className="page-subtitle">Manage chemical batches, upload Certificates of Analysis (CoA), and perform Quality Control.</p>
        </div>
        <Button onClick={() => navigate('/dashboard/inventory/lots/new')} className="gap-2">
          Create New Lot
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3 justify-between">
          <div className="relative flex-1 sm:max-w-xl">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by lot number or product name..."
              value={temp.search}
              onChange={e => setTemp(prev => ({ ...prev, search: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && setParam('q', temp.search)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={e => setParam('status', e.target.value)}
              className="px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Statuses</option>
              <option value="QUARANTINED">Quarantined</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="EXPIRED">Expired</option>
            </select>
            <Button variant="outline" size="icon" onClick={fetchLots} title="Refresh">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-border">
              <tr>
                <th className="px-6 py-3 cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('lotNumber')}>
                  <div className="flex items-center gap-1">Lot Number <ArrowUpDown size={12} /></div>
                </th>
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3 cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('mfgDate')}>
                  <div className="flex items-center gap-1">Mfg Date <ArrowUpDown size={12} /></div>
                </th>
                <th className="px-6 py-3 cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('expiryDate')}>
                  <div className="flex items-center gap-1">Expiry Date <ArrowUpDown size={12} /></div>
                </th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-center">CoA</th>
                <th className="px-6 py-3 text-right">QC Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <SkeletonTableBody rows={8} columns={7} />
              ) : lots.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <Archive size={36} className="mx-auto mb-2 opacity-30" />
                    <p className="font-medium">No lots found</p>
                  </td>
                </tr>
              ) : (
                lots.map(lot => (
                  <tr key={lot.id} className="data-table-row">
                    <td className="data-table-cell font-mono font-semibold text-primary">{lot.lotNumber}</td>
                    <td className="data-table-cell">
                      <p className="font-semibold text-foreground">{lot.product?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">SKU: {lot.product?.sku || 'N/A'}</p>
                    </td>
                    <td className="data-table-cell">
                      {lot.mfgDate ? new Date(lot.mfgDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="data-table-cell">
                      {lot.expiryDate ? new Date(lot.expiryDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="data-table-cell text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${STATUS_COLORS[lot.status] || STATUS_COLORS.EXPIRED}`}>
                        {lot.status}
                      </span>
                    </td>
                    <td className="data-table-cell text-center">
                      {lot.coaUrl ? (
                        <a href={lot.coaUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline text-xs font-semibold">
                          <FileText size={14} /> View CoA
                        </a>
                      ) : (
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border border-emerald-200" onClick={() => { setSelectedLot(lot); setCoaGeneratorOpen(true); }}>
                          <FileText size={12} /> Generate CoA
                        </Button>
                      )}
                    </td>
                    <td className="data-table-cell text-right">
                      {['SUPER_ADMIN', 'OWNER', 'MANAGER', 'QUALITY_CONTROL'].includes(user.role) && (
                        <div className="flex items-center justify-end gap-1">
                          {lot.status === 'QUARANTINED' && (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50" title="Approve" onClick={() => updateLotStatus(lot.id, 'APPROVED')}>
                                <CheckCircle size={16} />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50" title="Reject" onClick={() => updateLotStatus(lot.id, 'REJECTED')}>
                                <AlertTriangle size={16} />
                              </Button>
                            </>
                          )}
                          <Button variant="outline" size="sm" className="h-8 px-2 ml-2 text-xs gap-1" onClick={() => { setSelectedLot(lot); setUploadModalOpen(true); }}>
                            <Upload size={12} /> CoA
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between">
            <span className="text-sm text-slate-500">Page {page} of {totalPages} ({total} lots)</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setParam('page', String(page - 1))} disabled={page === 1}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setParam('page', String(page + 1))} disabled={page >= totalPages}>Next</Button>
            </div>
          </div>
        )}
      </div>

      <CreateLotModal 
        isOpen={uploadModalOpen} 
        onClose={() => { setUploadModalOpen(false); setSelectedLot(null); }} 
        onSuccess={() => { setUploadModalOpen(false); setSelectedLot(null); fetchLots(); }} 
        initialLot={selectedLot} 
      />

      {/* CoA Generator Modal */}
      <CoAGeneratorModal
        isOpen={coaGeneratorOpen}
        onClose={() => { setCoaGeneratorOpen(false); setSelectedLot(null); }}
        lot={selectedLot}
      />
    </div>
  );
}
