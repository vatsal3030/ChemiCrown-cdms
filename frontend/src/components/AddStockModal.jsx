import { useState } from 'react';
import { X, Save, PackagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';

export default function AddStockModal({ isOpen, onClose, product, token, onSuccess }) {
  const [addedQuantity, setAddedQuantity] = useState('');
  const [supplierId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  const [mfgDate, setMfgDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  if (!isOpen || !product) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!addedQuantity) return toast.error('Please enter a quantity');
    
    // Allow negative for reductions, but cannot be 0
    if (parseInt(addedQuantity) === 0) return toast.error('Quantity cannot be 0');

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/inventory/${product.id}/stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          addedQuantity: parseInt(addedQuantity), 
          supplierId: supplierId || null, 
          remarks,
          mfgDate: mfgDate || undefined,
          expiryDate: expiryDate || undefined
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(parseInt(addedQuantity) > 0 ? 'Stock added successfully' : 'Stock reduced successfully');
        const qtyChange = parseInt(addedQuantity);
        setAddedQuantity('');
        setRemarks('');
        setMfgDate('');
        setExpiryDate('');
        onSuccess(qtyChange);
      } else {
        toast.error(json.error || 'Failed to update stock');
      }
    } catch {
      toast.error('Failed to update stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <PackagePlus className="text-primary" />
              Manage Stock
            </h2>
            <p className="text-sm text-slate-500 mt-1">Adjust inventory levels for {product.name}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-4">
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                  <label className="block text-sm font-semibold text-primary mb-2">Quantity Adjustment *</label>
                  <p className="text-xs text-slate-500 mb-2">Use negative numbers to reduce stock (e.g., -5)</p>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number" 
                      required 
                      value={addedQuantity} 
                      onKeyDown={e => { if (e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault(); }}
                      onChange={(e) => setAddedQuantity(e.target.value)} 
                      placeholder="e.g. 50 or -5" 
                      className="text-lg font-bold py-6 bg-card border-primary/30 focus-visible:ring-primary/50"
                    />
                    <span className="text-slate-500 font-medium whitespace-nowrap px-2">
                      {product.unit || 'Units'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Remarks (Optional)</label>
                  <Input 
                    value={remarks} 
                    onChange={(e) => setRemarks(e.target.value)} 
                    placeholder="Batch info, delivery notes..." 
                  />
                </div>
              </div>

              <div className="space-y-4 border border-border p-4 rounded-xl bg-muted/50">
                <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wider mb-2">Batch Details</h3>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Manufacturing Date</label>
                  <Input 
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    value={mfgDate} 
                    onChange={(e) => setMfgDate(e.target.value)} 
                    className="bg-card"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Expiry Date</label>
                  <Input 
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={expiryDate} 
                    onChange={(e) => setExpiryDate(e.target.value)} 
                    className="bg-card"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">Providing these dates will automatically update the product's overarching tracking information.</p>
              </div>

            </div>

            <div className="pt-6 border-t border-border flex justify-end gap-3 mt-4">
              <Button type="button" variant="outline" onClick={onClose} className="px-6">Cancel</Button>
              <Button type="submit" disabled={loading} className="gap-2 px-6">
                <Save size={18} />
                {loading ? 'Processing...' : 'Confirm Stock Update'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
