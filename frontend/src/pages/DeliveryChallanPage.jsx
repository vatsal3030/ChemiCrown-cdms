import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Printer, FileText, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function DeliveryChallanPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [challan, setChallan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChallan = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${id}/challan`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          setChallan(json.data);
        } else {
          toast.error(json.error || 'Failed to generate delivery challan');
        }
      } catch {
        toast.error('Network error while generating challan');
      } finally {
        setLoading(false);
      }
    };
    fetchChallan();
  }, [id, token]);

  const handlePrint = () => window.print();

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const formatTime = (d) =>
    d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';

  if (loading) return (
    <div className="max-w-4xl mx-auto p-8 animate-pulse space-y-4">
      <div className="h-8 w-48 bg-muted rounded-lg" />
      <div className="h-64 bg-muted rounded-2xl" />
    </div>
  );

  if (!challan) return (
    <div className="max-w-4xl mx-auto text-center py-16">
      <FileText size={48} className="mx-auto mb-4 text-muted-foreground/40" />
      <p className="font-semibold text-foreground">Delivery challan not available.</p>
      <p className="text-sm text-muted-foreground mt-1">Challans are generated for Packaged/Dispatched/Delivered orders.</p>
      <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
        <ArrowLeft size={16} className="mr-2" /> Go Back
      </Button>
    </div>
  );

  const { company, consignee, items, transport } = challan;

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-0 animate-in fade-in duration-500">
      {/* Action bar (hidden on print) */}
      <div className="flex items-center justify-between mb-6 no-print">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft size={18} className="text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Delivery Challan</h1>
            <p className="text-xs text-muted-foreground">{challan.challanNumber}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer size={14} className="mr-1.5" /> Print Challan
        </Button>
      </div>

      {/* Challan Document */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">

        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-border">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-extrabold text-foreground tracking-tight">{company.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">{company.legalName}</p>
              <p className="text-sm text-muted-foreground">{company.address}</p>
              <p className="text-sm font-semibold text-foreground mt-2">GSTIN: {company.gstin}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold text-primary tracking-tight">DELIVERY CHALLAN</p>
              <div className="mt-3 space-y-1">
                <p className="text-sm"><span className="text-muted-foreground">Challan #:</span> <span className="font-semibold text-foreground">{challan.challanNumber}</span></p>
                <p className="text-sm"><span className="text-muted-foreground">Date:</span> <span className="font-semibold text-foreground">{formatDate(challan.challanDate)}</span></p>
                {challan.invoiceNumber && (
                  <p className="text-sm"><span className="text-muted-foreground">Invoice Ref:</span> <span className="font-mono text-foreground">{challan.invoiceNumber}</span></p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Consignor / Consignee */}
        <div className="px-8 py-5 border-b border-border bg-muted/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Consignor (From)</p>
              <p className="font-semibold text-foreground">{company.name}</p>
              <p className="text-sm text-muted-foreground">{company.address}</p>
              <p className="text-sm text-muted-foreground">Phone: {company.phone}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Consignee (To)</p>
              <p className="font-semibold text-foreground">{consignee.name}</p>
              {consignee.companyName && <p className="text-sm text-muted-foreground">{consignee.companyName}</p>}
              {consignee.gstin && <p className="text-sm font-medium text-foreground">GSTIN: {consignee.gstin}</p>}
              <p className="text-sm text-muted-foreground">{consignee.address}</p>
              <p className="text-sm text-muted-foreground">Phone: {consignee.phone}</p>
            </div>
          </div>
        </div>

        {/* Hazardous Warning */}
        {challan.hasHazardous && (
          <div className="px-8 py-3 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 flex items-center gap-3">
            <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">⚠️ Contains Hazardous Materials</p>
              <p className="text-xs text-amber-700 dark:text-amber-400">Handle with care. Follow MSDS guidelines. Ensure proper PPE during loading/unloading.</p>
            </div>
          </div>
        )}

        {/* Items Table */}
        <div className="px-8 py-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-foreground/20">
                <th className="text-left py-2.5 font-bold text-foreground w-8">#</th>
                <th className="text-left py-2.5 font-bold text-foreground">Description of Goods</th>
                <th className="text-center py-2.5 font-bold text-foreground w-16">HSN</th>
                <th className="text-center py-2.5 font-bold text-foreground w-20">Qty</th>
                <th className="text-center py-2.5 font-bold text-foreground w-16">Unit</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.sr} className="border-b border-border/50">
                  <td className="py-3 text-muted-foreground">{item.sr}</td>
                  <td className="py-3">
                    <p className="font-medium text-foreground">{item.name}</p>
                    <div className="flex flex-wrap gap-2 mt-0.5">
                      {item.sku && <span className="text-xs text-muted-foreground">SKU: {item.sku}</span>}
                      {item.casNumber && <span className="text-xs text-muted-foreground font-mono">CAS: {item.casNumber}</span>}
                      {item.unNumber && (
                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                          UN {item.unNumber}
                        </span>
                      )}
                      {item.hazardClass && (
                        <span className="text-xs font-semibold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded">
                          Class {item.hazardClass}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 text-center text-muted-foreground font-mono text-xs">{item.hsnCode || '—'}</td>
                  <td className="py-3 text-center font-semibold text-foreground">{item.quantity}</td>
                  <td className="py-3 text-center text-muted-foreground text-xs">
                    {item.packageSize && item.baseUnit ? `${item.packageSize} ${item.baseUnit}` : item.unit || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-foreground/20">
                <td colSpan={3} className="py-3 text-right font-bold text-foreground">Total Packages:</td>
                <td className="py-3 text-center font-extrabold text-foreground">
                  {items.reduce((acc, item) => acc + item.quantity, 0)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Transport Details */}
        <div className="px-8 py-5 border-t border-border bg-muted/30">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Transport Details</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Mode</p>
              <p className="font-medium text-foreground">{transport.mode}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Vehicle No.</p>
              <p className="font-medium text-foreground">{transport.vehicleNumber}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Driver Name</p>
              <p className="font-medium text-foreground">{transport.driverName}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Distance</p>
              <p className="font-medium text-foreground">{transport.distanceKm ? `${Number(transport.distanceKm).toFixed(1)} km` : '—'}</p>
            </div>
          </div>
          {transport.dispatchedAt && (
            <p className="text-xs text-muted-foreground mt-3">
              Dispatched on {formatDate(transport.dispatchedAt)} at {formatTime(transport.dispatchedAt)}
            </p>
          )}
        </div>

        {/* Signatures */}
        <div className="px-8 py-8 border-t border-border">
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="h-16" />
              <div className="border-t border-foreground/20 pt-1">
                <p className="text-xs text-muted-foreground">Prepared By</p>
              </div>
            </div>
            <div className="text-center">
              <div className="h-16" />
              <div className="border-t border-foreground/20 pt-1">
                <p className="text-xs text-muted-foreground">Transporter's Signature</p>
              </div>
            </div>
            <div className="text-center">
              <div className="h-16" />
              <div className="border-t border-foreground/20 pt-1">
                <p className="text-xs text-muted-foreground">Received By (Consignee)</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-6 text-center">
            This delivery challan is generated by {company.name}. Goods to be delivered as per the above details.
          </p>
        </div>
      </div>
    </div>
  );
}
