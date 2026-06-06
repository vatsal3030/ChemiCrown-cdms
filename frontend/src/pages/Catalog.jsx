import { useState, useEffect } from 'react';
import { Search, ShoppingCart, Info, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import useSWR from 'swr';
import useDebounce from '@/hooks/useDebounce';

export default function Catalog() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const debouncedSearch = useDebounce(searchTerm, 300);

  const fetcher = async (url) => {
    const res = await fetch(url);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to load catalog');
    return json.data.filter(p => p.isAvailable !== false);
  };

  const { data: products, error, isValidating } = useSWR(
    `${import.meta.env.VITE_API_URL}/api/inventory?search=${debouncedSearch}&limit=50`,
    fetcher
  );

  const loading = !products && !error;

  const handleBuyNow = (product) => {
    addToCart(product, 1);
    navigate('/dashboard/checkout');
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Hero Section */}
      <div className="bg-primary/5 border-b border-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Premium Chemical Catalog
          </h1>
          <p className="mt-4 max-w-2xl text-xl text-muted-foreground mx-auto">
            Browse our extensive range of high-quality industrial and laboratory chemicals. Direct from manufacturer to you.
          </p>
          <div className="mt-8 max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
            <Input 
              className="w-full pl-12 pr-4 py-6 rounded-full text-lg shadow-sm border-primary/20 focus-visible:ring-primary"
              placeholder="Search by product name, CAS number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col animate-pulse">
                {/* Image Skeleton */}
                <div className="relative aspect-square bg-slate-200 dark:bg-slate-800 border-b border-border w-full"></div>
                {/* Content Skeleton */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-4"></div>
                  <div className="space-y-2 mb-6">
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
                  </div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full mb-1 mt-auto"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-4/5 mb-6"></div>
                  
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-20"></div>
                    <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-28 rounded-full"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Info className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium text-foreground">No products found</h3>
            <p className="text-muted-foreground mt-2">Try adjusting your search terms or browse all categories.</p>
            <Button variant="outline" className="mt-6" onClick={() => setSearchTerm('')}>Clear Search</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => {
              const inStock = product.inventory?.quantity > 0;
              return (
                <div 
                  key={product.id} 
                  className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group hover:-translate-y-1 cursor-pointer"
                  onClick={() => {
                    navigate(`/dashboard/catalog/${product.id}`);
                    window.scrollTo(0, 0);
                  }}
                >
                  {/* Image Container */}
                  <div className="relative aspect-square bg-slate-100 dark:bg-slate-900 overflow-hidden border-b border-border">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <BeakerIcon className="w-16 h-16 opacity-50 mb-2" />
                        <span className="text-sm font-medium">No Image Available</span>
                      </div>
                    )}
                    {/* Badge */}
                    <div className="absolute top-3 right-3">
                      {inStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 backdrop-blur-sm shadow-sm border border-green-200 dark:border-green-800">
                          <CheckCircle2 size={12} /> In Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 backdrop-blur-sm shadow-sm border border-red-200 dark:border-red-800">
                          <XCircle size={12} /> Out of Stock
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <h3 className="font-bold text-lg text-foreground leading-tight line-clamp-2" title={product.name}>{product.name}</h3>
                    </div>
                    
                    <div className="text-xs text-muted-foreground mb-3 space-y-1">
                      {product.casNumber && <p><span className="font-medium">CAS:</span> <span className="font-mono">{product.casNumber}</span></p>}
                      <p><span className="font-medium">Unit:</span> {product.packageSize ? `${product.packageSize} ${product.baseUnit} ${product.unit}` : product.unit}</p>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                      {product.description || 'No description available for this product.'}
                    </p>

                    <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium mb-0.5">Price</p>
                        <p className="text-2xl font-bold text-primary leading-none">₹{product.price}</p>
                      </div>
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBuyNow(product);
                        }}
                        disabled={!inStock}
                        className="rounded-xl shadow-sm hover:shadow"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Buy Now
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function BeakerIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 3h15"></path>
      <path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3"></path>
      <path d="M6 14h12"></path>
    </svg>
  );
}
