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
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden" id="invoice-content">
        
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-border">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-extrabold text-foreground tracking-tight">{company.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">{company.legalName}</p>
              <p className="text-sm text-muted-foreground">{company.address}</p>
              <p className="text-sm text-muted-foreground">Phone: {company.phone} | Email: {company.email}</p>
              <p className="text-sm font-semibold text-foreground mt-2">GSTIN: {company.gstin}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-extrabold text-primary tracking-tight">TAX INVOICE</p>
              <div className="mt-3 space-y-1">
                <p className="text-sm"><span className="text-muted-foreground">Invoice #:</span> <span className="font-semibold text-foreground">{invoice.invoiceNumber}</span></p>
                <p className="text-sm"><span className="text-muted-foreground">Date:</span> <span className="font-semibold text-foreground">{formatDate(invoice.invoiceDate)}</span></p>
                <p className="text-sm"><span className="text-muted-foreground">Order #:</span> <span className="font-mono text-foreground">{invoice.orderId.substring(0, 8).toUpperCase()}</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Bill To / Ship To */}
        <div className="px-8 py-5 border-b border-border bg-muted/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Bill To</p>
              <p className="font-semibold text-foreground">{customer.name}</p>
              {customer.companyName && <p className="text-sm text-muted-foreground">{customer.companyName}</p>}
              {customer.gstin && <p className="text-sm font-medium text-foreground">GSTIN: {customer.gstin}</p>}
              <p className="text-sm text-muted-foreground">{customer.phone}</p>
              <p className="text-sm text-muted-foreground">{customer.email}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Ship To</p>
              <p className="text-sm text-foreground">{customer.address}</p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="px-8 py-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-foreground/20">
                <th className="text-left py-2.5 font-bold text-foreground w-8">#</th>
                <th className="text-left py-2.5 font-bold text-foreground">Item Description</th>
                <th className="text-center py-2.5 font-bold text-foreground w-16">HSN</th>
                <th className="text-center py-2.5 font-bold text-foreground w-12">Qty</th>
                <th className="text-right py-2.5 font-bold text-foreground w-24">Rate</th>
                <th className="text-center py-2.5 font-bold text-foreground w-14">GST%</th>
                {!invoice.isInterState ? (
                  <>
                    <th className="text-right py-2.5 font-bold text-foreground w-20">CGST</th>
                    <th className="text-right py-2.5 font-bold text-foreground w-20">SGST</th>
                  </>
                ) : (
                  <th className="text-right py-2.5 font-bold text-foreground w-20">IGST</th>
                )}
                <th className="text-right py-2.5 font-bold text-foreground w-28">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id} className="border-b border-border/50">
                  <td className="py-3 text-muted-foreground">{i + 1}</td>
                  <td className="py-3">
                    <p className="font-medium text-foreground">{item.name}</p>
                    {item.sku && <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>}
                    {item.packageSize && item.baseUnit && (
                      <p className="text-xs text-muted-foreground">{item.packageSize} {item.baseUnit} {item.unit}</p>
                    )}
                  </td>
                  <td className="py-3 text-center text-muted-foreground font-mono text-xs">{item.hsnCode || '—'}</td>
                  <td className="py-3 text-center text-foreground">{item.quantity}</td>
                  <td className="py-3 text-right text-foreground">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-3 text-center text-muted-foreground">{item.gstRate}%</td>
                  {!invoice.isInterState ? (
                    <>
                      <td className="py-3 text-right text-muted-foreground">{formatCurrency(item.cgst)}</td>
                      <td className="py-3 text-right text-muted-foreground">{formatCurrency(item.sgst)}</td>
                    </>
                  ) : (
                    <td className="py-3 text-right text-muted-foreground">{formatCurrency(item.igst)}</td>
                  )}
                  <td className="py-3 text-right font-semibold text-foreground">{formatCurrency(item.lineTotal + item.taxAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="px-8 pb-6">
          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-1.5 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {!invoice.isInterState ? (
                <>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">CGST</span>
                    <span className="text-foreground">{formatCurrency(invoice.cgstTotal)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">SGST</span>
                    <span className="text-foreground">{formatCurrency(invoice.sgstTotal)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">IGST</span>
                  <span className="text-foreground">{formatCurrency(invoice.igstTotal)}</span>
                </div>
              )}
              {invoice.shippingCost > 0 && (
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Shipping & Handling</span>
                  <span className="text-foreground">{formatCurrency(invoice.shippingCost)}</span>
                </div>
              )}
              <div className="flex justify-between py-2.5 border-t-2 border-foreground/20 mt-2">
                <span className="font-extrabold text-foreground text-base">Grand Total</span>
                <span className="font-extrabold text-foreground text-base">{formatCurrency(invoice.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Amount in Words + Payment */}
        <div className="px-8 py-5 border-t border-border bg-muted/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Payment Details</p>
              <p className="text-sm text-foreground">
                Method: <span className="font-medium">{invoice.payment?.method?.replace(/_/g, ' ') || 'N/A'}</span>
              </p>
              <p className="text-sm text-foreground">
                Status: <span className={`font-medium ${invoice.payment?.status === 'SUCCESS' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {invoice.payment?.status || 'Pending'}
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Supply Type</p>
              <p className="text-sm font-medium text-foreground">
                {invoice.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Place of Supply: {company.stateName} ({company.stateCode})
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-border">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-muted-foreground">This is a computer-generated invoice and does not require a physical signature.</p>
              <p className="text-xs text-muted-foreground mt-1">Subject to {company.stateName} jurisdiction.</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">For {company.name}</p>
              <div className="mt-8 border-t border-foreground/20 pt-1">
                <p className="text-xs text-muted-foreground">Authorized Signatory</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
