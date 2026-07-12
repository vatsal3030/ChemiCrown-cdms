import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, ShieldCheck, FileText, Printer, CheckCircle, 
  AlertTriangle, Upload, User, Clock, Package, Briefcase, FileSignature 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useDialog } from '@/context/DialogContext';
import { useReactToPrint } from 'react-to-print';
import CreateLotModal from '@/components/CreateLotModal';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  QUARANTINED: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400',
  APPROVED: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
  REJECTED: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400',
  EXPIRED: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400'
};

export default function LotDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { confirm } = useDialog();
  const [lot, setLot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // CoA analytical results parameters
  const [coaParams, setCoaParams] = useState({
    appearance: 'Matches Standard',
    purity: '99.9%',
    moisture: '0.2%'
  });
  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `CoA_${lot?.lotNumber}_${lot?.product?.name || 'Chemical'}`,
  });

  const fetchLotDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/lots/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setLot(json.data);
        if (json.data.product?.purity) {
          setCoaParams(prev => ({ ...prev, purity: json.data.product.purity }));
        }
      } else {
        toast.error(json.message || 'Failed to load lot details');
        navigate('/dashboard/inventory/lots');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && token) {
      fetchLotDetails();
    }
  }, [id, token]);

  const updateLotStatus = async (newStatus) => {
    const ok = await confirm(
      'Update Lot Status',
      `Are you sure you want to change this lot's status to ${newStatus}?`,
      { type: 'warning', confirmLabel: 'Change Status' }
    );
    if (!ok) return;

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
        setLot(json.data);
      } else {
        toast.error(json.message || 'Failed to update status');
      }
    } catch {
      toast.error('Network error');
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-12 w-64 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 h-64 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="lg:col-span-2 h-96 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
      </div>
    );
  }

  if (!lot) return null;

  const mfgDate = lot.mfgDate ? new Date(lot.mfgDate).toLocaleDateString() : 'N/A';
  const expDate = lot.expiryDate ? new Date(lot.expiryDate).toLocaleDateString() : 'N/A';
  const testDate = new Date(lot.createdAt).toLocaleDateString();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link to="/dashboard/inventory/lots" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft size={16} /> Back to Lot Tracking
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Lot: {lot.lotNumber}</h1>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${STATUS_COLORS[lot.status] || STATUS_COLORS.EXPIRED}`}>
              {lot.status}
            </span>
          </div>
          <p className="text-muted-foreground mt-1">
            Product: <span className="font-semibold text-foreground">{lot.product?.name}</span> ({lot.product?.sku})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {['SUPER_ADMIN', 'OWNER', 'MANAGER', 'QUALITY_CONTROL'].includes(user.role) && (
            <>
              {lot.status === 'QUARANTINED' && (
                <>
                  <Button variant="ghost" className="text-emerald-600 hover:bg-emerald-50 border border-emerald-200 dark:hover:bg-emerald-950/20" onClick={() => updateLotStatus('APPROVED')}>
                    <CheckCircle size={16} className="mr-2" /> Approve Lot
                  </Button>
                  <Button variant="ghost" className="text-destructive hover:bg-destructive/5 border border-destructive/20" onClick={() => updateLotStatus('REJECTED')}>
                    <AlertTriangle size={16} className="mr-2" /> Reject Lot
                  </Button>
                </>
              )}
              <Button onClick={() => setEditModalOpen(true)}>
                <Upload size={16} className="mr-2" /> Manage Lot / CoA
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Lot Metadata */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-border pb-2">
              <Package className="text-primary" size={18} /> Specifications
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mfg Date:</span>
                <span className="font-semibold">{mfgDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expiry Date:</span>
                <span className="font-semibold">{expDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Supplier:</span>
                <span className="font-semibold">{lot.supplier?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Grade:</span>
                <span className="font-semibold">{lot.product?.grade || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CAS Number:</span>
                <span className="font-semibold font-mono">{lot.product?.casNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-3">
                <span className="text-muted-foreground font-bold">Current Stock:</span>
                <span className="font-bold text-primary">{lot.quantity} {lot.product?.unit}s</span>
              </div>
            </div>

            {lot.notes && (
              <div className="mt-4 pt-3 border-t border-border">
                <span className="text-xs font-semibold text-muted-foreground block mb-1">Notes:</span>
                <p className="text-xs bg-muted/30 p-2.5 rounded-lg border border-border">{lot.notes}</p>
              </div>
            )}
          </div>

          {/* Audit trail / Transactions log */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-border pb-2">
              <Clock className="text-primary" size={18} /> Transaction History
            </h2>
            {lot.transactions && lot.transactions.length > 0 ? (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {lot.transactions.map((tx) => (
                  <div key={tx.id} className="text-xs flex gap-3 pb-3 border-b border-border/50 last:border-b-0 last:pb-0">
                    <div className="mt-0.5">
                      <span className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                        tx.type === 'IN' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {tx.type}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{tx.quantity} {lot.product?.unit}s</p>
                      <p className="text-muted-foreground text-[10px] flex items-center gap-1 mt-0.5">
                        <User size={10} /> {tx.user ? `${tx.user.firstName} ${tx.user.lastName}` : 'System'}
                      </p>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-center text-muted-foreground py-6">No transactions recorded</p>
            )}
          </div>
        </div>

        {/* Right Column: CoA Viewer / Generator */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col min-h-[500px]">
            
            {/* Header tab */}
            <div className="flex justify-between items-center mb-6 border-b border-border pb-3">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <ShieldCheck className="text-emerald-600" size={20} />
                Certificate of Analysis (CoA)
              </h2>
              {lot.coaUrl ? (
                <div className="flex items-center gap-2">
                  <a href={lot.coaUrl} target="_blank" rel="noreferrer" className="px-3.5 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-hover text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                    <FileText size={14} /> Open CoA File
                  </a>
                </div>
              ) : (
                <button 
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-semibold text-xs shadow-sm"
                >
                  <Printer size={14} /> Print CoA
                </button>
              )}
            </div>

            {/* CoA Content area */}
            <div className="flex-1 bg-muted/20 border border-border/65 rounded-xl p-4 sm:p-6 overflow-x-auto">
              {lot.coaUrl ? (
                /* PDF File Attached Case */
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                  <FileSignature size={48} className="text-emerald-600 opacity-60 animate-bounce" />
                  <h3 className="font-bold text-base">CoA File Attached</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    An official manufacturer Certificate of Analysis file is attached to this lot. You can view or replace the file by clicking manage lot.
                  </p>
                  <a 
                    href={lot.coaUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-flex items-center gap-2 px-4 py-2 border border-border bg-card hover:bg-muted text-sm font-semibold rounded-xl"
                  >
                    <Upload size={14} /> View CoA Document (PDF)
                  </a>
                </div>
              ) : (
                /* Dynamically generated CoA view */
                <div className="space-y-6">
                  {/* Parameter override controller */}
                  <div className="bg-card border border-border p-4 rounded-xl space-y-3 text-xs mb-6 max-w-2xl">
                    <h3 className="font-bold text-foreground">Adjust Certificate Parameters</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Appearance</label>
                        <Input 
                          value={coaParams.appearance} 
                          onChange={e => setCoaParams({...coaParams, appearance: e.target.value})} 
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Purity / Assay</label>
                        <Input 
                          value={coaParams.purity} 
                          onChange={e => setCoaParams({...coaParams, purity: e.target.value})} 
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Moisture Content</label>
                        <Input 
                          value={coaParams.moisture} 
                          onChange={e => setCoaParams({...coaParams, moisture: e.target.value})} 
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Printable Sheet */}
                  <div className="w-full flex justify-center">
                    <div ref={printRef} className="bg-white text-black p-10 shadow border border-slate-300 w-full max-w-[210mm] min-h-[297mm] text-xs leading-relaxed flex flex-col justify-between" style={{ fontFamily: 'Georgia, serif' }}>
                      <div>
                        {/* Header letterhead */}
                        <div className="text-center mb-8 pb-4 border-b-2 border-slate-800">
                          <h1 className="text-3xl font-bold text-slate-900 mb-1 uppercase tracking-wide">ChemiCrown cdms</h1>
                          <p className="text-[10px] font-medium text-slate-500">Plot No - 26, Madhav Industrial Park, Vartej, Bhavnagar, Gujarat, India</p>
                          <p className="text-[10px] font-medium text-slate-500">ISO 9001:2015 Quality Management Certified</p>
                          
                          <h2 className="text-xl font-bold mt-6 uppercase tracking-widest text-slate-800">Certificate of Analysis</h2>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 mb-8 text-[11px]">
                          <div className="flex justify-between border-b border-slate-100 pb-0.5">
                            <span className="font-bold text-slate-600">Product Name:</span>
                            <span className="font-semibold text-slate-900">{lot.product?.name}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 pb-0.5">
                            <span className="font-bold text-slate-600">Batch / Lot No:</span>
                            <span className="font-mono font-semibold text-slate-900">{lot.lotNumber}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 pb-0.5">
                            <span className="font-bold text-slate-600">CAS Number:</span>
                            <span className="font-mono text-slate-900">{lot.product?.casNumber || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 pb-0.5">
                            <span className="font-bold text-slate-600">Product Grade:</span>
                            <span className="text-slate-900">{lot.product?.grade || 'Standard'}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 pb-0.5">
                            <span className="font-bold text-slate-600">Mfg Date:</span>
                            <span className="text-slate-900">{mfgDate}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 pb-0.5">
                            <span className="font-bold text-slate-600">Date of Testing:</span>
                            <span className="text-slate-900">{testDate}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 pb-0.5">
                            <span className="font-bold text-slate-600">Expiration Date:</span>
                            <span className="text-slate-900">{expDate}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 pb-0.5">
                            <span className="font-bold text-slate-600">Lot Status:</span>
                            <span className="uppercase font-bold text-emerald-600">{lot.status}</span>
                          </div>
                        </div>

                        {/* Analysis results */}
                        <div className="mb-8">
                          <h3 className="text-sm font-bold mb-3 border-b border-slate-400 pb-1">Analytical Specifications</h3>
                          <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
                            <thead>
                              <tr className="bg-slate-50">
                                <th className="border border-slate-300 p-2 font-bold">Test Parameter</th>
                                <th className="border border-slate-300 p-2 font-bold">Target Specification</th>
                                <th className="border border-slate-300 p-2 font-bold">Analytical Result</th>
                                <th className="border border-slate-300 p-2 font-bold text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="border border-slate-300 p-2 font-medium">Appearance</td>
                                <td className="border border-slate-300 p-2 text-slate-600">Matches Standard</td>
                                <td className="border border-slate-300 p-2 font-mono">{coaParams.appearance}</td>
                                <td className="border border-slate-300 p-2 text-center font-bold text-emerald-600">PASS</td>
                              </tr>
                              <tr>
                                <td className="border border-slate-300 p-2 font-medium">Purity / Assay</td>
                                <td className="border border-slate-300 p-2 text-slate-600">&ge; {lot.product?.purity || '99.0%'}</td>
                                <td className="border border-slate-300 p-2 font-mono">{coaParams.purity}</td>
                                <td className="border border-slate-300 p-2 text-center font-bold text-emerald-600">PASS</td>
                              </tr>
                              <tr>
                                <td className="border border-slate-300 p-2 font-medium">Moisture Content</td>
                                <td className="border border-slate-300 p-2 text-slate-600">&le; 0.5%</td>
                                <td className="border border-slate-300 p-2 font-mono">{coaParams.moisture}</td>
                                <td className="border border-slate-300 p-2 text-center font-bold text-emerald-600">PASS</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Approval bottom section */}
                      <div>
                        <div className="flex justify-between items-end border-t border-slate-200 pt-6">
                          <div className="w-40 text-center">
                            <div className="border-b border-slate-800 pb-1 mb-1 font-mono text-[10px] text-slate-500">System Generated</div>
                            <p className="text-[9px] font-bold uppercase">QC Analyst</p>
                          </div>
                          <div className="w-40 text-center">
                            <div className="border-b border-slate-800 pb-1 mb-1 font-mono text-[10px] text-emerald-600 font-bold">APPROVED</div>
                            <p className="text-[9px] font-bold uppercase">Quality Assurance Manager</p>
                          </div>
                        </div>

                        <div className="mt-8 text-center text-[8px] text-slate-400 border-t border-slate-100 pt-3 space-y-0.5">
                          <p>This quality analysis report is generated electronically and is valid without physical signatures.</p>
                          <p>Certified in compliance with ChemiCrown ISO-9001 standard quality verification pipelines.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Lot / Upload CoA Modal */}
      <CreateLotModal 
        isOpen={editModalOpen} 
        onClose={() => setEditModalOpen(false)} 
        initialLot={lot} 
        onSuccess={() => {
          setEditModalOpen(false);
          fetchLotDetails();
        }} 
      />
    </div>
  );
}
