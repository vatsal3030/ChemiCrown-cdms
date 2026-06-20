import { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function CreateLotModal({ isOpen, onClose, onSuccess, initialLot = null }) {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    lotNumber: '',
    productId: '',
    mfgDate: '',
    expiryDate: '',
    status: 'QUARANTINED',
    notes: ''
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch products for dropdown
      fetch(`${import.meta.env.VITE_API_URL}/api/inventory?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(json => {
          if (json.success) setProducts(json.data);
        });

      if (initialLot) {
        setFormData({
          lotNumber: initialLot.lotNumber || '',
          productId: initialLot.productId || '',
          mfgDate: initialLot.mfgDate ? initialLot.mfgDate.split('T')[0] : '',
          expiryDate: initialLot.expiryDate ? initialLot.expiryDate.split('T')[0] : '',
          status: initialLot.status || 'QUARANTINED',
          notes: initialLot.notes || ''
        });
      } else {
        setFormData({
          lotNumber: '',
          productId: '',
          mfgDate: '',
          expiryDate: '',
          status: 'QUARANTINED',
          notes: ''
        });
      }
      setFile(null);
    }
  }, [isOpen, initialLot, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key]) data.append(key, formData[key]);
      });
      if (file) {
        data.append('coaDocument', file); // Multer field name
      }

      const url = initialLot 
        ? `${import.meta.env.VITE_API_URL}/api/lots/${initialLot.id}`
        : `${import.meta.env.VITE_API_URL}/api/lots`;
        
      const method = initialLot ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: data
      });

      const json = await res.json();
      if (json.success) {
        toast.success(initialLot ? 'Lot/CoA updated successfully' : 'Lot created successfully');
        onSuccess();
      } else {
        toast.error(json.message || 'Failed to save lot');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-border">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/50">
          <h2 className="text-lg font-bold">
            {initialLot ? 'Update Lot / Upload CoA' : 'Create New Lot'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-md"><X size={18} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Lot Number *</label>
              <Input 
                required 
                disabled={!!initialLot}
                value={formData.lotNumber} 
                onChange={e => setFormData({...formData, lotNumber: e.target.value})} 
                placeholder="e.g. BATCH-2024-001" 
              />
            </div>
            <div>
              <label className="form-label">Product *</label>
              <select 
                required
                disabled={!!initialLot}
                value={formData.productId} 
                onChange={e => setFormData({...formData, productId: e.target.value})}
                className="form-input"
              >
                <option value="">Select a Product</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Mfg Date</label>
              <Input 
                type="date" 
                value={formData.mfgDate} 
                onChange={e => setFormData({...formData, mfgDate: e.target.value})} 
              />
            </div>
            <div>
              <label className="form-label">Expiry Date</label>
              <Input 
                type="date" 
                value={formData.expiryDate} 
                onChange={e => setFormData({...formData, expiryDate: e.target.value})} 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Status</label>
              <select 
                value={formData.status} 
                onChange={e => setFormData({...formData, status: e.target.value})}
                className="form-input"
              >
                <option value="QUARANTINED">QUARANTINED (Pending QC)</option>
                <option value="APPROVED">APPROVED (Ready)</option>
                <option value="REJECTED">REJECTED (Failed QC)</option>
              </select>
            </div>
            <div>
              <label className="form-label">Upload CoA (PDF/Image)</label>
              <Input 
                type="file" 
                accept=".pdf,image/*" 
                onChange={e => setFile(e.target.files[0])} 
              />
              <p className="text-[10px] text-muted-foreground mt-1">Leave empty to generate a CoA later</p>
            </div>
          </div>

          <div>
            <label className="form-label">Notes</label>
            <Input 
              value={formData.notes} 
              onChange={e => setFormData({...formData, notes: e.target.value})} 
              placeholder="Any specific batch details..." 
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (initialLot ? 'Update Lot' : 'Create Lot')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
