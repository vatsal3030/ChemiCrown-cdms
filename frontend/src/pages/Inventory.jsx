import { useState, useEffect } from 'react';
import { Search, Plus, Filter, Trash2, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import ProductModal from '@/components/ProductModal';

export default function Inventory() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [stockFilter, setStockFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const fetchInventory = async () => {
    try {
      setLoading(true);
      
      // Fetch categories
      if (categories.length === 0) {
        const catRes = await fetch('http://localhost:5000/api/categories', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const catJson = await catRes.json();
        if (catJson.success) setCategories(catJson.data);
      }

      // We no longer send categoryId to backend since we are doing client-side stock/category filtering,
      // or we can send it. We'll do client-side for immediate UI response.
      const res = await fetch(`http://localhost:5000/api/inventory?search=${searchTerm}&sortField=${sortField}&sortOrder=${sortOrder}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setProducts(json.data);
        setTotalPages(json.pagination.pages);
      }
    } catch (error) {
      toast.error('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [searchTerm, sortField, sortOrder, page]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/inventory/${id}`, { 
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Product soft-deleted successfully');
        fetchInventory();
      }
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const filteredProducts = products.filter(p => {
    // Stock Filter
    let stockMatch = true;
    if (stockFilter === 'out') stockMatch = (p.inventory?.quantity || 0) === 0;
    if (stockFilter === 'low') stockMatch = (p.inventory?.quantity || 0) > 0 && (p.inventory?.quantity || 0) <= 50;
    if (stockFilter === 'in') stockMatch = (p.inventory?.quantity || 0) > 50;

    // Category Filter
    let categoryMatch = true;
    if (categoryFilter !== 'all') {
      categoryMatch = p.categoryId === categoryFilter;
    }

    return stockMatch && categoryMatch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chemical Inventory</h1>
          <p className="text-slate-500 mt-1">Manage and track all your chemical products.</p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}>
          <Plus size={16} /> Add Product
        </Button>
      </div>
      
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by name, CAS number..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative flex items-center">
              <select 
                value={categoryFilter} 
                onChange={e => setCategoryFilter(e.target.value)}
                className="pl-3 pr-8 rounded-md border border-input bg-background py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary appearance-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="relative flex items-center">
              <Filter size={16} className="absolute left-3 text-slate-400" />
              <select 
                value={stockFilter} 
                onChange={e => setStockFilter(e.target.value)}
                className="pl-9 pr-8 rounded-md border border-input bg-background py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary appearance-none cursor-pointer"
              >
                <option value="all">All Stock Levels</option>
                <option value="in">In Stock (&gt;50)</option>
                <option value="low">Low Stock (1-50)</option>
                <option value="out">Out of Stock (0)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('name')}>
                  <div className="flex items-center gap-1">Product <ArrowUpDown size={14} /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('casNumber')}>
                  <div className="flex items-center gap-1">CAS Number <ArrowUpDown size={14} /></div>
                </th>
                <th className="px-6 py-4">Stock Level</th>
                <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('price')}>
                  <div className="flex items-center gap-1">Price <ArrowUpDown size={14} /></div>
                </th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-500">Loading inventory...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-500">No products found.</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-500">No products match your filter.</td></tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-slate-50">{product.name}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[200px]">{product.description}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{product.casNumber || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${product.inventory?.quantity > 50 ? 'bg-green-500' : product.inventory?.quantity > 0 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                        <span>{product.inventory?.quantity || 0} {product.unit}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">₹{product.price}</td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10" onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}>
                        <Plus size={16} className="rotate-45" style={{ display: 'none' }} />
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90 hover:bg-destructive/10" onClick={() => handleDelete(product.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {!loading && products.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Page {page} of {totalPages || 1}
            </span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

      </div>
      
      <ProductModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        product={editingProduct}
        token={token}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchInventory();
        }}
      />
    </div>
  );
}
