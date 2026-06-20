import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Archive, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function CreateLotPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
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
    // Fetch products for dropdown
    fetch(`${import.meta.env.VITE_API_URL}/api/inventory?limit=1000`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(json => {
        if (json.success) setProducts(json.data);
      })
      .catch(() => toast.error('Failed to load products'));
  }, [token]);

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

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/lots`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: data
      });

      const json = await res.json();
      if (json.success) {
        toast.success('Lot created successfully');
        navigate('/dashboard/inventory/lots');
      } else {
        toast.error(json.message || 'Failed to create lot');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/inventory/lots')} className="h-9 w-9">
          <ArrowLeft size={18} />
        </Button>
        <div className="page-header-icon bg-primary/10 text-primary">
          <Archive size={22} />
        </div>
        <div>
          <h1 className="page-title">Create New Lot</h1>
          <p className="page-subtitle">Add a new production lot, specify quality control status, and attach Certificate of Analysis (CoA).</p>
        </div>
      </div>

      <div className="max-w-3xl bg-card border border-border rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="form-label">Lot Number *</label>
              <Input
                required
                value={formData.lotNumber}
                onChange={e => setFormData({ ...formData, lotNumber: e.target.value })}
                placeholder="e.g. LOT-2026-CH09"
              />
            </div>
            <div>
              <label className="form-label">Product *</label>
              <select
                required
                value={formData.productId}
                onChange={e => setFormData({ ...formData, productId: e.target.value })}
                className="form-input h-10 px-3 py-1 bg-background border border-input rounded-xl text-sm"
              >
                <option value="">Select Product...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.sku ? `(${p.sku})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="form-label">Manufacturing Date</label>
              <Input
                type="date"
                value={formData.mfgDate}
                onChange={e => setFormData({ ...formData, mfgDate: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Expiry Date</label>
              <Input
                type="date"
                value={formData.expiryDate}
                onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="form-label">Initial QC Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="form-input h-10 px-3 py-1 bg-background border border-input rounded-xl text-sm"
              >
                <option value="QUARANTINED">QUARANTINED (QC Pending)</option>
                <option value="APPROVED">APPROVED (Release for Sale)</option>
                <option value="REJECTED">REJECTED (Failed QC)</option>
              </select>
            </div>
            <div>
              <label className="form-label">Upload Certificate of Analysis (CoA)</label>
              <Input
                type="file"
                accept=".pdf,image/*"
                onChange={e => setFile(e.target.files[0])}
              />
              <p className="text-[10px] text-muted-foreground mt-1">Accepts PDF or Image formats</p>
            </div>
          </div>

          <div>
            <label className="form-label">Notes & Comments</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Enter batch yield, initial test metrics, or general comments..."
              className="w-full text-sm bg-background border border-input rounded-xl px-3 py-2 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => navigate('/dashboard/inventory/lots')}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating Lot...' : 'Create Lot'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
