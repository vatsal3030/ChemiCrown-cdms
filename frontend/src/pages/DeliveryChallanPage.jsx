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
      <div className="bg-white text-black p-8 sm:p-12 border-2 border-slate-900 shadow-md font-sans leading-normal print:p-6 print:border-0">

        {/* Header */}
        <div className="border-b-2 border-slate-950 pb-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight text-slate-950">{company.name}</h1>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">{company.legalName}</p>
              <p className="text-xs text-slate-600 max-w-md mt-1">{company.address}</p>
              <p className="text-xs text-slate-600 font-semibold mt-1">
                GSTIN: <span className="font-mono text-slate-950">{company.gstin}</span>
              </p>
            </div>
            <div className="text-left sm:text-right shrink-0">
              <h2 className="text-2xl font-black text-slate-950 tracking-wider">DELIVERY CHALLAN</h2>
              <div className="mt-3 space-y-1 text-xs">
                <p><span className="text-slate-500 font-semibold">Challan No:</span> <span className="font-bold font-mono text-slate-900">{challan.challanNumber}</span></p>
                <p><span className="text-slate-500 font-semibold">Date:</span> <span className="font-bold text-slate-900">{formatDate(challan.challanDate)}</span></p>
                {challan.invoiceNumber && (
                  <p><span className="text-slate-500 font-semibold">Invoice Ref:</span> <span className="font-bold font-mono text-slate-900">{challan.invoiceNumber}</span></p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Consignor / Consignee address grids */}
        <div className="grid grid-cols-1 md:grid-cols-2 border border-slate-300 rounded-xl mb-6 overflow-hidden text-xs bg-slate-50/50">
          <div className="p-4 border-r border-slate-300">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-200 pb-1">Consignor (From)</h3>
            <p className="font-bold text-sm text-slate-950">{company.name}</p>
            <p className="text-slate-700 mt-1 max-w-sm leading-relaxed">{company.address}</p>
            <p className="text-slate-600 mt-1">Phone: {company.phone}</p>
          </div>
          <div className="p-4">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-200 pb-1">Consignee (To)</h3>
            <p className="font-bold text-sm text-slate-950">{consignee.companyName || consignee.name}</p>
            <p className="text-slate-700 mt-1">Contact: {consignee.name}</p>
            {consignee.gstin && <p className="font-semibold text-slate-900 mt-1">GSTIN: <span className="font-mono">{consignee.gstin}</span></p>}
            <p className="text-slate-600 mt-0.5 leading-relaxed">{consignee.address}</p>
            <p className="text-slate-600 mt-0.5">Phone: {consignee.phone}</p>
          </div>
        </div>

        {/* Hazardous Alert Banner */}
        {challan.hasHazardous && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-3 text-xs">
            <AlertTriangle size={20} className="text-amber-600 shrink-0" />
            <div>
              <p className="font-bold text-amber-800 text-sm">⚠️ Hazard Declaration: Dangerous Goods in Transit</p>
              <p className="text-amber-700 mt-0.5 leading-relaxed">
                This shipment contains chemical materials classed as hazardous. Transport driver must carry appropriate TREM Cards (Transport Emergency Cards) and follow safety protocols for loading and road transit.
              </p>
            </div>
          </div>
        )}

        {/* Goods Description Table */}
        <div className="border border-slate-300 rounded-xl overflow-hidden mb-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 uppercase tracking-wider text-[10px]">
                <th className="p-3 w-8 text-center">#</th>
                <th className="p-3">Description of Goods</th>
                <th className="p-3 text-center w-24">HSN Code</th>
                <th className="p-3 text-center w-24">Quantity</th>
                <th className="p-3 text-center w-24">Packing Unit</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.sr} className="border-b border-slate-200 hover:bg-slate-50 last:border-b-0">
                  <td className="p-3 text-center text-slate-500 font-medium">{item.sr}</td>
                  <td className="p-3">
                    <p className="font-bold text-slate-900">{item.name}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {item.sku && <span className="text-[10px] text-slate-500">SKU: {item.sku}</span>}
                      {item.casNumber && <span className="text-[10px] text-slate-500 font-mono">CAS: {item.casNumber}</span>}
                      {item.unNumber && (
                        <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded uppercase tracking-wide">
                          UN {item.unNumber}
                        </span>
                      )}
                      {item.hazardClass && (
                        <span className="text-[9px] font-bold text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded uppercase tracking-wide">
                          Class {item.hazardClass}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-center text-slate-700 font-mono text-[11px]">{item.hsnCode || '—'}</td>
                  <td className="p-3 text-center text-slate-900 font-extrabold text-sm">{item.quantity}</td>
                  <td className="p-3 text-center text-slate-600 font-semibold">
                    {item.packageSize && item.baseUnit ? `${item.packageSize} ${item.baseUnit}` : item.unit || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-300 font-extrabold text-slate-900 bg-slate-50">
                <td colSpan={3} className="p-3 text-right text-xs uppercase tracking-wider text-slate-500">Total Despatched Packages:</td>
                <td className="p-3 text-center text-sm font-black">{items.reduce((acc, item) => acc + item.quantity, 0)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Transport Details */}
        <div className="border border-slate-300 rounded-xl p-4 mb-6 bg-slate-50/50 text-xs">
          <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-200 pb-1">Transport Details</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-slate-500 text-[10px] uppercase font-bold">Transit Mode</p>
              <p className="font-bold text-slate-900 mt-0.5">{transport.mode}</p>
            </div>
            <div>
              <p className="text-slate-500 text-[10px] uppercase font-bold">Vehicle Number</p>
              <p className="font-mono font-bold text-slate-900 mt-0.5">{transport.vehicleNumber || '—'}</p>
            </div>
            <div>
              <p className="text-slate-500 text-[10px] uppercase font-bold">Driver Name</p>
              <p className="font-bold text-slate-900 mt-0.5">{transport.driverName || '—'}</p>
            </div>
            <div>
              <p className="text-slate-500 text-[10px] uppercase font-bold">Billing Distance</p>
              <p className="font-bold text-slate-900 mt-0.5">{transport.distanceKm ? `${Number(transport.distanceKm).toFixed(1)} km` : '—'}</p>
            </div>
          </div>
          {transport.dispatchedAt && (
            <p className="text-[10px] text-slate-500 mt-3 font-semibold">
              Goods Dispatched on: {formatDate(transport.dispatchedAt)} at {formatTime(transport.dispatchedAt)}
            </p>
          )}
        </div>

        {/* Signatures */}
        <div className="border-t border-slate-300 pt-8 mt-8">
          <div className="grid grid-cols-3 gap-6 text-xs text-center">
            <div className="flex flex-col justify-between min-h-[90px] border-r border-slate-200">
              <div className="h-10 flex items-center justify-center relative">
                <span className="font-handwriting text-xl text-blue-600 rotate-[-5deg]">Solanki</span>
              </div>
              <div className="pt-2 border-t border-slate-300 mx-4">
                <p className="font-bold text-slate-700">Prepared By</p>
                <p className="text-[9px] text-slate-400 uppercase mt-0.5">ChemiCrown Store Desk</p>
              </div>
            </div>
            <div className="flex flex-col justify-between min-h-[90px] border-r border-slate-200">
              <div className="h-10" />
              <div className="pt-2 border-t border-slate-300 mx-4">
                <p className="font-bold text-slate-700">Transporter's Sign</p>
                <p className="text-[9px] text-slate-400 uppercase mt-0.5">Driver / Carrier Agent</p>
              </div>
            </div>
            <div className="flex flex-col justify-between min-h-[90px]">
              <div className="h-10 border border-dashed border-slate-300 rounded-lg flex items-center justify-center mx-6 bg-slate-50/50">
                <span className="text-[8px] uppercase text-slate-300 font-bold tracking-wider">Stamp & Sign Here</span>
              </div>
              <div className="pt-2 border-t border-slate-300 mx-4">
                <p className="font-bold text-slate-700">Receiver's Sign</p>
                <p className="text-[9px] text-slate-400 uppercase mt-0.5">Consignee Seal</p>
              </div>
            </div>
          </div>
          <p className="text-[9px] text-slate-400 mt-8 text-center italic">
            This delivery challan is a formal transport document generated in accordance with GST Rules. Please inspect goods upon delivery before signing.
          </p>
        </div>
      </div>
    </div>
  );
}
