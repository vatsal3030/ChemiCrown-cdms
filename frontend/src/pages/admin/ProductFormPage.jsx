import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Upload, ArrowLeft, Save, Beaker, ShieldAlert, Package, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning';

export default function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  
  const [categories, setCategories] = useState([]);
  const [availableUnits, setAvailableUnits] = useState([]);

  const isEditing = id && id !== 'new';

  const SESSION_KEY = `product_form_${id || 'new'}`;

  const [formData, setFormData] = useState(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) return JSON.parse(saved);
    } catch (err) { console.error('Session storage read error', err); }
    return {
      name: '',
      description: '',
      unit: 'Litre',
      packageSize: '',
      baseUnit: 'Litre',
      price: '',
      casNumber: '',
      unNumber: '',
      hazardClasses: '',
      packingGroup: '',
      sdsUrl: '',
      sku: '',
      supplierId: '',
      safetyNotes: '',
      storageInstructions: '',
      mfgDate: '',
      expiryDate: '',
      categoryId: '',
      minThreshold: 10,
      isAvailable: true,
      brand: '',
      manufacturer: '',
      itemForm: '',
      purity: '',
      grade: '',
      costPrice: '',
      hsnCode: '',
      gstRate: '18'
    };
  });

  useEffect(() => {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(formData)); }
    catch (err) { console.error('Session storage write error', err); }
  }, [formData, SESSION_KEY]);

  const isDirty = !!(formData.name || formData.description || formData.price);
  useUnsavedChangesWarning(isDirty && !loading);


  useEffect(() => {
    // Fetch categories and units
    fetch(`${import.meta.env.VITE_API_URL}/api/categories`, { headers: { Authorization: `Bearer ${token}` }})
      .then(r => r.json())
      .then(d => { if (d.success) setCategories(d.data); });
      
    fetch(`${import.meta.env.VITE_API_URL}/api/inventory/units/unique`, { headers: { Authorization: `Bearer ${token}` }})
      .then(r => r.json())
      .then(d => { if (d.success) setAvailableUnits(d.data); });

    // Fetch product if editing
    if (isEditing) {
      setFetching(true);
      fetch(`${import.meta.env.VITE_API_URL}/api/inventory/${id}`, { headers: { Authorization: `Bearer ${token}` }})
        .then(r => r.json())
        .then(d => {
          if (d.success && d.data) {
            const p = d.data;
            setFormData({
              name: p.name || '',
              description: p.description || '',
              unit: p.unit || 'Litre',
              packageSize: p.packageSize || '',
              baseUnit: p.baseUnit || '',
              price: p.price || '',
              casNumber: p.casNumber || '',
              unNumber: p.unNumber || '',
              hazardClasses: Array.isArray(p.hazardClasses) ? p.hazardClasses.join(', ') : '',
              packingGroup: p.packingGroup || '',
              sdsUrl: p.sdsUrl || '',
              sku: p.sku || '',
              supplierId: p.supplierId || '',
              safetyNotes: p.safetyNotes || '',
              storageInstructions: p.storageInstructions || '',
              mfgDate: p.mfgDate ? p.mfgDate.split('T')[0] : '',
              expiryDate: p.expiryDate ? p.expiryDate.split('T')[0] : '',
              categoryId: p.categoryId || '',
              minThreshold: p.inventory?.minThreshold || 10,
              isAvailable: p.isAvailable !== undefined ? p.isAvailable : true,
              brand: p.brand || '',
              manufacturer: p.manufacturer || '',
              itemForm: p.itemForm || '',
              purity: p.purity || '',
              grade: p.grade || '',
              costPrice: p.costPrice || '',
              hsnCode: p.hsnCode || '',
              gstRate: p.gstRate || '18'
            });
            setPreviewUrls(p.imageUrls || []);
          } else {
            toast.error('Product not found');
            navigate('/dashboard/inventory');
          }
        })
        .catch(() => {
          toast.error('Failed to fetch product details');
          navigate('/dashboard/inventory');
        })
        .finally(() => setFetching(false));
    }
  }, [id, token, navigate, isEditing]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setImageFiles(prev => [...prev, ...files].slice(0, 5)); // max 5
      const newUrls = files.map(f => URL.createObjectURL(f));
      setPreviewUrls(prev => [...prev, ...newUrls].slice(0, 5));
    }
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('imageIndex', index.toString());
  };

  const handleDrop = (e, dropIndex) => {
    const dragIndex = parseInt(e.dataTransfer.getData('imageIndex'));
    if (dragIndex === dropIndex || isNaN(dragIndex)) return;

    setPreviewUrls(prev => {
      const newUrls = [...prev];
      const [draggedItem] = newUrls.splice(dragIndex, 1);
      newUrls.splice(dropIndex, 0, draggedItem);
      return newUrls;
    });

    if (imageFiles.length > 0) {
      setImageFiles(prev => {
        const newFiles = [...prev];
        if (dragIndex < newFiles.length && dropIndex < newFiles.length) {
          const [draggedFile] = newFiles.splice(dragIndex, 1);
          newFiles.splice(dropIndex, 0, draggedFile);
        }
        return newFiles;
      });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.unit) {
      return toast.error("Please fill required fields (Name, Price, Unit)");
    }

    if (formData.mfgDate && formData.expiryDate) {
      if (new Date(formData.expiryDate) <= new Date(formData.mfgDate)) {
        return toast.error("Expiry date must be after manufacturing date");
      }
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('unit', formData.unit);
      if (formData.packageSize) data.append('packageSize', formData.packageSize);
      if (formData.baseUnit) data.append('baseUnit', formData.baseUnit);
      data.append('price', formData.price);
      if (formData.casNumber) data.append('casNumber', formData.casNumber);
      if (formData.unNumber) data.append('unNumber', formData.unNumber);
      if (formData.hazardClasses) data.append('hazardClasses', JSON.stringify(formData.hazardClasses.split(',').map(s=>s.trim())));
      if (formData.packingGroup) data.append('packingGroup', formData.packingGroup);
      if (formData.sdsUrl) data.append('sdsUrl', formData.sdsUrl);
      if (formData.sku) data.append('sku', formData.sku);
      if (formData.supplierId) data.append('supplierId', formData.supplierId);
      if (formData.safetyNotes) data.append('safetyNotes', formData.safetyNotes);
      if (formData.storageInstructions) data.append('storageInstructions', formData.storageInstructions);
      if (formData.mfgDate) data.append('mfgDate', formData.mfgDate);
      if (formData.expiryDate) data.append('expiryDate', formData.expiryDate);
      if (formData.categoryId) data.append('categoryId', formData.categoryId);
      if (formData.minThreshold !== undefined) data.append('minThreshold', formData.minThreshold);
      data.append('isAvailable', formData.isAvailable);
      if (formData.brand) data.append('brand', formData.brand);
      if (formData.manufacturer) data.append('manufacturer', formData.manufacturer);
      if (formData.itemForm) data.append('itemForm', formData.itemForm);
      if (formData.purity) data.append('purity', formData.purity);
      if (formData.grade) data.append('grade', formData.grade);
      if (formData.costPrice) data.append('costPrice', formData.costPrice);
      if (formData.hsnCode) data.append('hsnCode', formData.hsnCode);
      if (formData.gstRate) data.append('gstRate', formData.gstRate);
      if (imageFiles.length > 0) {
        imageFiles.forEach(file => data.append('images', file));
      }

      const url = isEditing 
        ? `${import.meta.env.VITE_API_URL}/api/inventory/${id}` 
        : `${import.meta.env.VITE_API_URL}/api/inventory`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: data
      });

      const json = await res.json();
      if (res.ok) {
        toast.success(isEditing ? 'Product updated successfully' : 'Product created successfully');
        try { sessionStorage.removeItem(SESSION_KEY); } catch (err) { console.error(err); }
        navigate('/dashboard/inventory');
      } else {
        toast.error(json.error || 'Failed to save product');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-8 text-center text-slate-500">Loading product details...</div>;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-12 space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <Link to="/dashboard/inventory" className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 flex flex-wrap items-center gap-3">
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isEditing ? `Update the details for ${formData.name}` : 'Create a new chemical product for your inventory'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* Main Content Area */}
          <div className="xl:col-span-3 space-y-6">
            
            {/* Images Card (Moved to top priority) */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">Product Images (Priority)</h2>
              <div 
                className="w-full h-40 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-500 hover:text-primary hover:border-primary cursor-pointer transition-colors overflow-hidden relative group mb-4 bg-muted/50"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={32} className="mb-2" />
                <span className="text-base font-medium">Click to upload product images (Max 5)</span>
                <p className="text-xs mt-1 text-slate-400">High-quality images significantly improve sales conversion.</p>
                <input type="file" multiple ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
              </div>
              
              {previewUrls.length > 0 ? (
                <div className="flex flex-wrap gap-4">
                  {previewUrls.map((url, i) => (
                    <div 
                      key={i} 
                      className="relative w-32 h-32 rounded-lg overflow-hidden group cursor-grab active:cursor-grabbing border border-border hover:border-primary transition-colors bg-muted shadow-sm"
                      draggable
                      onDragStart={(e) => handleDragStart(e, i)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, i)}
                    >
                      <img src={url} alt={`Preview ${i}`} className="w-full h-full object-cover pointer-events-none" />
                      <button type="button" onClick={() => removeImage(i)} className="absolute top-1.5 right-1.5 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-500 shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                      {i === 0 && <span className="absolute bottom-0 left-0 right-0 bg-primary/90 text-white text-[10px] font-bold text-center py-0.5 uppercase tracking-wider">Primary</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 flex flex-col items-center justify-center border rounded-lg border-dashed bg-muted/30">
                  <p className="text-sm text-slate-500 font-medium">No images uploaded yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Upload at least one image to help customers identify this product.</p>
                </div>
              )}
            </div>

            {/* Unified 2-column details section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Section 1: Basic Info */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold flex flex-wrap items-center gap-2 mb-6 text-slate-800 dark:text-slate-200">
                  <Info className="text-primary" size={20} />
                  Basic Details
                </h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Product Name *</label>
                    <Input 
                      required 
                      type="text" 
                      value={formData.name} 
                      onChange={e=>setFormData({...formData, name: e.target.value})} 
                      placeholder="e.g. Premium GP Thinner" 
                      className="text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Description</label>
                    <textarea 
                      value={formData.description} 
                      onChange={e=>setFormData({...formData, description: e.target.value})} 
                      className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[180px] shadow-sm resize-y" 
                      placeholder="Provide a highly detailed description of the product, its primary uses, applications, appearance, and physical properties. A rich description helps customers understand the product better and improves search visibility..." 
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">CAS Number</label>
                      <Input type="text" value={formData.casNumber} onChange={e=>setFormData({...formData, casNumber: e.target.value})} placeholder="e.g. 67-64-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">UN Number</label>
                      <Input type="text" value={formData.unNumber} onChange={e=>setFormData({...formData, unNumber: e.target.value})} placeholder="e.g. UN 1090" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">SKU Code</label>
                      <Input type="text" value={formData.sku} onChange={e=>setFormData({...formData, sku: e.target.value})} placeholder="e.g. CHM-THN-001" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Safety Data Sheet (SDS) URL</label>
                      <Input type="url" value={formData.sdsUrl} onChange={e=>setFormData({...formData, sdsUrl: e.target.value})} placeholder="https://..." />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Packaging */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
                <h2 className="text-lg font-semibold flex flex-wrap items-center gap-2 mb-6 text-slate-800 dark:text-slate-200">
                  <Package className="text-blue-500" size={20} />
                  Packaging & Categorization
                </h2>
                <div className="space-y-5">
                  <div className="bg-muted p-4 rounded-xl border border-border">
                    <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Container Size / Packaging Format *</label>
                    <div className="flex flex-col gap-4">
                      <select 
                        className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val && val !== 'custom') {
                            const [size, bUnit, ...unitParts] = val.split(' ');
                            setFormData({...formData, packageSize: size, baseUnit: bUnit, unit: unitParts.join(' ')});
                          }
                        }}
                      >
                        <option value="">Select a preset to auto-fill...</option>
                        <option value="50 Kg Barrel">50 Kg Barrel</option>
                        <option value="100 Kg Barrel">100 Kg Barrel</option>
                        <option value="25 L Drum">25 L Drum</option>
                        <option value="10 L Drum">10 L Drum</option>
                        <option value="200 L Drum">200 L Drum</option>
                        <option value="1000 L IBC">1000 L IBC</option>
                        <option value="5 Kg Bag">5 Kg Bag</option>
                        <option value="25 Kg Bag">25 Kg Bag</option>
                        <option value="custom">Custom Format...</option>
                      </select>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium mb-1 text-slate-500">Size Volume/Weight</label>
                          <Input type="number" min="0" step="0.01" onKeyDown={e => { if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault(); }} required value={formData.packageSize} onChange={e=>setFormData({...formData, packageSize: e.target.value})} placeholder="e.g. 50" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1 text-slate-500">Base Unit (Kg, L)</label>
                          <Input type="text" required value={formData.baseUnit} onChange={e=>setFormData({...formData, baseUnit: e.target.value})} placeholder="e.g. Kg" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1 text-slate-500">Container Type</label>
                          <Input required list="packaging-units" type="text" value={formData.unit} onChange={e=>setFormData({...formData, unit: e.target.value})} placeholder="e.g. Barrel" />
                          <datalist id="packaging-units">
                            {availableUnits.map((u, i) => <option key={i} value={u} />)}
                          </datalist>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Category</label>
                      <select value={formData.categoryId} onChange={e=>setFormData({...formData, categoryId: e.target.value})} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Supplier ID (Optional)</label>
                      <Input type="text" value={formData.supplierId} onChange={e=>setFormData({...formData, supplierId: e.target.value})} placeholder="e.g. SUP-9021" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Specifications */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold flex flex-wrap items-center gap-2 mb-6 text-slate-800 dark:text-slate-200">
                  <Beaker className="text-purple-500" size={20} />
                  Product Specifications
                </h2>
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Brand</label>
                      <Input type="text" value={formData.brand} onChange={e=>setFormData({...formData, brand: e.target.value})} placeholder="e.g. Merck" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Manufacturer</label>
                      <Input type="text" value={formData.manufacturer} onChange={e=>setFormData({...formData, manufacturer: e.target.value})} placeholder="e.g. Sigma-Aldrich" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Item Form</label>
                      <select value={formData.itemForm} onChange={e=>setFormData({...formData, itemForm: e.target.value})} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                        <option value="">Select Form...</option>
                        <option value="Liquid">Liquid</option>
                        <option value="Powder">Powder</option>
                        <option value="Solid">Solid</option>
                        <option value="Gas">Gas</option>
                        <option value="Gel">Gel</option>
                        <option value="Granules">Granules</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Purity</label>
                      <Input type="text" value={formData.purity} onChange={e=>setFormData({...formData, purity: e.target.value})} placeholder="e.g. 99.9%" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Grade</label>
                    <Input type="text" list="grades" value={formData.grade} onChange={e=>setFormData({...formData, grade: e.target.value})} placeholder="e.g. AR, LR, EMPLURA" />
                    <datalist id="grades">
                      <option value="AR (Analytical Reagent)" />
                      <option value="LR (Laboratory Reagent)" />
                      <option value="CP (Chemically Pure)" />
                      <option value="Technical" />
                      <option value="EMPLURA" />
                      <option value="HPLC Grade" />
                    </datalist>
                  </div>
                </div>
              </div>

              {/* Section 4: Safety & Storage */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold flex flex-wrap items-center gap-2 mb-6 text-slate-800 dark:text-slate-200">
                  <ShieldAlert className="text-red-500" size={20} />
                  Safety & Storage
                </h2>
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Hazard Classes (Comma separated)</label>
                      <Input type="text" value={formData.hazardClasses} onChange={e=>setFormData({...formData, hazardClasses: e.target.value})} placeholder="e.g. Class 3, Class 8" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Packing Group</label>
                      <select value={formData.packingGroup} onChange={e=>setFormData({...formData, packingGroup: e.target.value})} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                        <option value="">Select Group...</option>
                        <option value="I">I (High Danger)</option>
                        <option value="II">II (Medium Danger)</option>
                        <option value="III">III (Low Danger)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Safety Notes / Hazmat</label>
                    <textarea 
                      value={formData.safetyNotes} 
                      onChange={e=>setFormData({...formData, safetyNotes: e.target.value})} 
                      className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[140px] resize-y shadow-sm" 
                      placeholder="E.g. Highly flammable liquid and vapour. Keep away from heat, sparks, open flames. Causes serious eye irritation. Wear protective gloves/eye protection..." 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Storage Instructions</label>
                    <textarea 
                      value={formData.storageInstructions} 
                      onChange={e=>setFormData({...formData, storageInstructions: e.target.value})} 
                      className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[140px] resize-y shadow-sm" 
                      placeholder="E.g. Store in a well-ventilated, secure place. Keep cool. Keep container tightly closed. Protect from direct sunlight..." 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6 xl:col-span-1 sticky top-24 self-start">
            
            {/* Action Card */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold flex flex-wrap items-center gap-2 mb-6 text-slate-800 dark:text-slate-200">
                <Save className="text-primary" size={20} />
                Publish Details
              </h2>
              
              <div className="space-y-5 mb-8">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Unit Price (₹) *</label>
                  <Input 
                    min="0" 
                    required 
                    type="number" min="0" onKeyDown={e => { if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault(); }}
                    step="0.01" 
                    value={formData.price} 
                    onChange={e=>setFormData({...formData, price: e.target.value})} 
                    placeholder="0.00" 
                    className="text-lg font-bold"
                  />
                </div>

                {/* Cost Price */}
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Cost Price (₹)</label>
                  <Input 
                    type="number" min="0" step="0.01"
                    onKeyDown={e => { if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault(); }}
                    value={formData.costPrice} 
                    onChange={e=>setFormData({...formData, costPrice: e.target.value})} 
                    placeholder="Purchase/landing cost" 
                  />
                  <p className="text-xs text-slate-400 mt-1">Used for margin & profitability reports.</p>
                </div>

                {/* HSN & GST */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">HSN Code</label>
                    <Input 
                      type="text"
                      value={formData.hsnCode} 
                      onChange={e=>setFormData({...formData, hsnCode: e.target.value})} 
                      placeholder="e.g. 28061010" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">GST Rate (%)</label>
                    <select 
                      value={formData.gstRate} 
                      onChange={e=>setFormData({...formData, gstRate: e.target.value})} 
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18% (Default)</option>
                      <option value="28">28%</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/50">
                  <label className="block text-sm font-semibold text-amber-700 dark:text-amber-500 mb-1.5">Low Stock Alert Threshold</label>
                  <Input 
                    min="0" 
                    required 
                    type="number" 
                    value={formData.minThreshold} 
                    onChange={e=>setFormData({...formData, minThreshold: e.target.value})} 
                    placeholder="e.g. 10" 
                    className="bg-card"
                  />
                  <p className="text-xs text-amber-600 dark:text-amber-600 mt-2">Alerts will trigger when inventory drops below this number.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted rounded-xl border border-border">
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">Active & Available</label>
                    <p className="text-xs text-slate-500 mt-1">If disabled, this product cannot be ordered by customers.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={formData.isAvailable}
                      onChange={e => setFormData({...formData, isAvailable: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 dark:peer-focus:ring-primary/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

              <Button disabled={loading} type="submit" className="w-full text-base py-6 h-auto">
                {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Product'}
              </Button>
            </div>


          </div>
        </div>
      </form>
    </div>
  );
}
