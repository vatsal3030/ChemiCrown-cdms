import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Printer, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function InvoicePage() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${id}/invoice`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          setInvoice(json.data);
        } else {
          toast.error(json.error || 'Failed to generate invoice');
        }
      } catch {
        toast.error('Network error while generating invoice');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id, token]);

  const handlePrint = () => window.print();

  const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amt || 0);

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  if (loading) return (
    <div className="max-w-4xl mx-auto p-8 animate-pulse space-y-4">
      <div className="h-8 w-48 bg-muted rounded-lg" />
      <div className="h-64 bg-muted rounded-2xl" />
      <div className="h-48 bg-muted rounded-2xl" />
    </div>
  );

  if (!invoice) return (
    <div className="max-w-4xl mx-auto text-center py-16">
      <FileText size={48} className="mx-auto mb-4 text-muted-foreground/40" />
      <p className="font-semibold text-foreground">Invoice not available for this order.</p>
      <p className="text-sm text-muted-foreground mt-1">Invoices are generated for orders in Processing status or later.</p>
      <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
        <ArrowLeft size={16} className="mr-2" /> Go Back
      </Button>
    </div>
  );

  const { company, customer, items } = invoice;

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-0 animate-in fade-in duration-500">
      {/* ── Action bar (hidden on print) ── */}
      <div className="flex items-center justify-between mb-6 no-print">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft size={18} className="text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Tax Invoice</h1>
            <p className="text-xs text-muted-foreground">{invoice.invoiceNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer size={14} className="mr-1.5" /> Print Invoice
          </Button>
        </div>
      </div>

      {/* ── Invoice Document ── */}
      <div className="bg-white text-black p-8 sm:p-12 border-2 border-slate-900 shadow-md font-sans leading-normal print:p-6 print:border-0" id="invoice-content">
        
        {/* Company Header */}
        <div className="border-b-2 border-slate-950 pb-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight text-slate-950">{company.name}</h1>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">{company.legalName}</p>
              <p className="text-xs text-slate-600 max-w-md mt-1">{company.address}</p>
              <p className="text-xs text-slate-600 font-semibold mt-1">
                GSTIN: <span className="font-mono text-slate-950">{company.gstin}</span>
              </p>
              <p className="text-xs text-slate-600">
                Phone: {company.phone} | Email: {company.email}
              </p>
            </div>
            <div className="text-left sm:text-right shrink-0">
              <h2 className="text-2xl font-black text-slate-950 tracking-wider">TAX INVOICE</h2>
              <div className="mt-3 space-y-1 text-xs">
                <p><span className="text-slate-500 font-semibold">Invoice No:</span> <span className="font-bold font-mono text-slate-900">{invoice.invoiceNumber}</span></p>
                <p><span className="text-slate-500 font-semibold">Date:</span> <span className="font-bold text-slate-900">{formatDate(invoice.invoiceDate)}</span></p>
                <p><span className="text-slate-500 font-semibold">Order Ref:</span> <span className="font-bold font-mono text-slate-900">#{invoice.orderId.substring(0, 8).toUpperCase()}</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Billing / Consignee Address Grids */}
        <div className="grid grid-cols-1 md:grid-cols-2 border border-slate-300 rounded-xl mb-6 overflow-hidden text-xs bg-slate-50/50">
          <div className="p-4 border-r border-slate-300">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-200 pb-1">Details of Receiver (Billed To)</h3>
            <p className="font-bold text-sm text-slate-950">{customer.companyName || customer.name}</p>
            <p className="text-slate-700 mt-1">Contact: {customer.name}</p>
            {customer.gstin && (
              <p className="font-semibold text-slate-900 mt-1">
                GSTIN: <span className="font-mono font-bold text-primary">{customer.gstin}</span>
              </p>
            )}
            <p className="text-slate-600 mt-0.5">Phone: {customer.phone} | Email: {customer.email}</p>
          </div>
          <div className="p-4">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-200 pb-1">Details of Consignee (Shipped To)</h3>
            <p className="font-semibold text-slate-900">{customer.companyName || customer.name}</p>
            <p className="text-slate-600 mt-1 max-w-sm leading-relaxed">{customer.address}</p>
          </div>
        </div>

        {/* GST Invoice Details Table */}
        <div className="border border-slate-300 rounded-xl overflow-hidden mb-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 uppercase tracking-wider text-[10px]">
                <th className="p-3 w-8 text-center">#</th>
                <th className="p-3">Description of Goods</th>
                <th className="p-3 text-center w-20">HSN Code</th>
                <th className="p-3 text-center w-12">Qty</th>
                <th className="p-3 text-right w-24">Rate (Item)</th>
                <th className="p-3 text-center w-14">GST Rate</th>
                {!invoice.isInterState ? (
                  <>
                    <th className="p-3 text-right w-20">CGST</th>
                    <th className="p-3 text-right w-20">SGST</th>
                  </>
                ) : (
                  <th className="p-3 text-right w-20">IGST</th>
                )}
                <th className="p-3 text-right w-28">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id} className="border-b border-slate-200 hover:bg-slate-50 last:border-b-0">
                  <td className="p-3 text-center text-slate-500 font-medium">{i + 1}</td>
                  <td className="p-3">
                    <p className="font-bold text-slate-900">{item.name}</p>
                    {item.sku && <p className="text-[10px] text-slate-500">SKU: {item.sku}</p>}
                    {item.packageSize && item.baseUnit && (
                      <p className="text-[10px] text-slate-500">Packing: {item.packageSize} {item.baseUnit} / {item.unit}</p>
                    )}
                  </td>
                  <td className="p-3 text-center text-slate-700 font-mono text-[11px]">{item.hsnCode || '—'}</td>
                  <td className="p-3 text-center text-slate-900 font-semibold">{item.quantity}</td>
                  <td className="p-3 text-right text-slate-900 font-mono">{formatCurrency(item.unitPrice)}</td>
                  <td className="p-3 text-center text-slate-600 font-medium">{item.gstRate}%</td>
                  {!invoice.isInterState ? (
                    <>
                      <td className="p-3 text-right text-slate-600 font-mono">{formatCurrency(item.cgst)}</td>
                      <td className="p-3 text-right text-slate-600 font-mono">{formatCurrency(item.sgst)}</td>
                    </>
                  ) : (
                    <td className="p-3 text-right text-slate-600 font-mono">{formatCurrency(item.igst)}</td>
                  )}
                  <td className="p-3 text-right font-bold text-slate-950 font-mono">{formatCurrency(item.lineTotal + item.taxAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Bank details for NEFT/RTGS */}
          <div className="border border-slate-200 rounded-xl p-4 text-xs bg-slate-50/50">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-200 pb-1">Bank Payment Instructions</h4>
            <div className="space-y-1.5 leading-relaxed text-slate-700">
              <p><span className="font-semibold text-slate-600">Bank Name:</span> State Bank of India</p>
              <p><span className="font-semibold text-slate-600">Account Name:</span> ChemiCrown Chemical Distributors</p>
              <p><span className="font-semibold text-slate-600">Account No:</span> <span className="font-mono font-bold text-slate-900">39182049102</span></p>
              <p><span className="font-semibold text-slate-600">IFSC Code:</span> <span className="font-mono font-bold text-slate-900">SBIN0000329</span></p>
              <p><span className="font-semibold text-slate-600">Branch Name:</span> Vartej Branch, Bhavnagar, Gujarat</p>
            </div>
          </div>

          {/* Totals panel */}
          <div className="flex justify-end">
            <table className="w-full text-xs">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="py-2 text-slate-500 font-medium">Subtotal (Taxable Value):</td>
                  <td className="py-2 text-right font-bold text-slate-900 font-mono">{formatCurrency(invoice.subtotal)}</td>
                </tr>
                {!invoice.isInterState ? (
                  <>
                    <tr className="border-b border-slate-200">
                      <td className="py-2 text-slate-500 font-medium">Central Tax (CGST):</td>
                      <td className="py-2 text-right font-bold text-slate-900 font-mono">{formatCurrency(invoice.cgstTotal)}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-2 text-slate-500 font-medium">State Tax (SGST):</td>
                      <td className="py-2 text-right font-bold text-slate-900 font-mono">{formatCurrency(invoice.sgstTotal)}</td>
                    </tr>
                  </>
                ) : (
                  <tr className="border-b border-slate-200">
                    <td className="py-2 text-slate-500 font-medium">Integrated Tax (IGST):</td>
                    <td className="py-2 text-right font-bold text-slate-900 font-mono">{formatCurrency(invoice.igstTotal)}</td>
                  </tr>
                )}
                {invoice.shippingCost > 0 && (
                  <tr className="border-b border-slate-200">
                    <td className="py-2 text-slate-500 font-medium">Delivery & Handling Cost:</td>
                    <td className="py-2 text-right font-bold text-slate-900 font-mono">{formatCurrency(invoice.shippingCost)}</td>
                  </tr>
                )}
                <tr className="border-t-2 border-slate-950 font-black text-slate-950 text-sm">
                  <td className="py-3 font-extrabold text-base">Grand Total (Inclusive of Tax):</td>
                  <td className="py-3 text-right font-extrabold text-base font-mono">{formatCurrency(invoice.grandTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* T&C + Signatures */}
        <div className="border-t border-slate-300 pt-6 mt-6 text-xs grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Terms & Conditions</h4>
            <ul className="list-decimal pl-4 space-y-1 text-[11px] text-slate-600 leading-relaxed">
              <li>Goods once sold will not be returned or exchanged.</li>
              <li>Interest at the rate of 18% p.a. will be charged for delayed payments after 30 days.</li>
              <li>All disputes are subject to Bhavnagar jurisdiction.</li>
              <li>Certified that the particulars given above are true and correct.</li>
            </ul>
          </div>
          <div className="flex flex-col items-end justify-between min-h-[140px]">
            <div className="text-right">
              <p className="text-[10px] text-slate-500 font-semibold">For {company.name}</p>
              <div className="h-14 flex items-center justify-end relative">
                {/* Decorative Signature */}
                <span className="font-handwriting text-2xl text-blue-600 rotate-[-5deg] select-none pointer-events-none pr-4">
                  Solanki Group
                </span>
                {/* Stamp overlay */}
                <div className="absolute right-12 top-0 border-2 border-red-500/35 border-dashed rounded-full w-16 h-16 flex items-center justify-center text-[7px] text-red-500/40 uppercase font-black tracking-widest rotate-12 pointer-events-none select-none">
                  ChemiCrown<br />Bhavnagar
                </div>
              </div>
            </div>
            <div className="text-right border-t border-slate-300 pt-1.5 w-48">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Authorized Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
