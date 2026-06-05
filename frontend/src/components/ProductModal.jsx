import { useState, useEffect, useRef } from 'react';
import { X, Upload, Beaker } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProductModal({ isOpen, onClose, product, token, onSuccess }) {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit: 'Litre',
    price: '',
    quantity: '',
    casNumber: '',
    categoryId: ''
  });
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        unit: product.unit || 'Litre',
        price: product.price || '',
        quantity: product.inventory?.quantity || '',
        casNumber: product.casNumber || '',
        categoryId: product.categoryId || ''
      });
      setPreviewUrl(product.imageUrl || null);
    } else {
      setFormData({
        name: '', description: '', unit: 'Litre', price: '', quantity: '', casNumber: '', categoryId: ''
      });
      setPreviewUrl(null);
      setImageFile(null);
    }
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.unit) {
      return toast.error("Please fill required fields (Name, Price, Unit)");
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('unit', formData.unit);
      data.append('price', formData.price);
      data.append('quantity', formData.quantity || 0);
      if (formData.casNumber) data.append('casNumber', formData.casNumber);
      if (formData.categoryId) data.append('categoryId', formData.categoryId);
      if (imageFile) data.append('image', imageFile);

      const url = product 
        ? `http://localhost:5000/api/inventory/${product.id}` 
        : 'http://localhost:5000/api/inventory';
      const method = product ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: data
      });

      const json = await res.json();
      if (res.ok) {
        toast.success(product ? 'Product updated successfully' : 'Product created successfully');
        onSuccess();
      } else {
        toast.error(json.error || 'Failed to save product');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card w-full max-w-2xl rounded-2xl shadow-xl border border-border animate-in zoom-in-95 duration-200 mt-10 mb-10">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Beaker className="w-5 h-5 text-primary" />
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div 
              className="w-32 h-32 shrink-0 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:border-primary cursor-pointer transition-colors overflow-hidden relative group"
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <>
                  <Upload size={24} className="mb-2" />
                  <span className="text-xs font-medium">Upload Image</span>
                </>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs text-white font-medium">Change</span>
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />

            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product Name *</label>
                <input required type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" placeholder="e.g. Premium GP Thinner" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">CAS Number</label>
                  <input type="text" value={formData.casNumber} onChange={e=>setFormData({...formData, casNumber: e.target.value})} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" placeholder="e.g. 67-64-1" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Unit *</label>
                  <select required value={formData.unit} onChange={e=>setFormData({...formData, unit: e.target.value})} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                    <option value="Litre">Litre</option>
                    <option value="Kg">Kg</option>
                    <option value="Drum">Drum (200L)</option>
                    <option value="Barrel">Barrel</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Price (₹) *</label>
              <input required type="number" step="0.01" value={formData.price} onChange={e=>setFormData({...formData, price: e.target.value})} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Initial Stock Quantity</label>
              <input type="number" value={formData.quantity} onChange={e=>setFormData({...formData, quantity: e.target.value})} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" placeholder="0" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" rows={3} placeholder="Product description and safety notes..." />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md transition-colors">Cancel</button>
            <button disabled={loading} type="submit" className={`px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md shadow hover:bg-primary/90 transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
              {loading ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
