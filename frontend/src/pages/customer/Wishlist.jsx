import { useState } from 'react';
import { Heart, ShoppingCart, Trash2, Search, Filter, SlidersHorizontal, X } from 'lucide-react';
import useSWR from 'swr';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function Wishlist() {
  const { token, user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest'); // newest, oldest, price-asc, price-desc
  const [stockFilter, setStockFilter] = useState('all'); // all, in-stock, out-of-stock

  const fetcher = async (url) => {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  };

  const { data: favorites, error, mutate } = useSWR(
    token ? `${import.meta.env.VITE_API_URL}/api/favorites` : null,
    fetcher
  );

  const loading = !favorites && !error;

  const handleRemove = async (productId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/favorites/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ productId })
      });
      if (res.ok) {
        mutate();
        toast.success('Removed from Wishlist');
      }
    } catch {
      toast.error('Failed to remove item');
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    toast.success('Added to Cart');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex flex-wrap items-center gap-3">
          <Heart className="w-8 h-8 text-red-500 fill-red-500" /> My Wishlist
        </h1>
        <p className="text-muted-foreground mt-2">Manage your saved items and favorite chemicals for later.</p>
      </div>

      {/* Toolbar */}
      <div className="bg-card border border-border p-4 rounded-xl shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search wishlist..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 w-full"
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto shrink-0">
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm border transition-all ${
              (sortOrder !== 'newest' || stockFilter !== 'all')
                ? 'bg-primary text-white border-primary'
                : 'bg-background border-input hover:border-primary text-foreground'
            }`}
          >
            <SlidersHorizontal size={15} />
            Filters
            {(sortOrder !== 'newest' || stockFilter !== 'all') && (
              <span className="bg-white/30 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                {[sortOrder !== 'newest', stockFilter !== 'all'].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-muted/30 border border-border rounded-xl px-6 py-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <h3 className="font-bold text-foreground flex flex-wrap items-center gap-2 text-sm">
              <Filter size={15} /> Sort & Filter
            </h3>
            <div className="flex flex-wrap gap-3">
              {(sortOrder !== 'newest' || stockFilter !== 'all') && (
                <button onClick={() => { setSortOrder('newest'); setStockFilter('all'); }} className="text-xs text-destructive hover:underline">
                  Clear all
                </button>
              )}
              <button onClick={() => setShowFilters(false)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Sort By</label>
              <select
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value)}
                className="w-full text-sm bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="newest">Recently Added</option>
                <option value="oldest">Oldest Added</option>
                <option value="price-asc">Price (Low to High)</option>
                <option value="price-desc">Price (High to Low)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Availability</label>
              <select
                value={stockFilter}
                onChange={e => setStockFilter(e.target.value)}
                className="w-full text-sm bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="all">All Items</option>
                <option value="in-stock">In Stock Only</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex flex-wrap items-center gap-4 animate-pulse">
                <Skeleton className="w-20 h-20 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="w-24 h-10 rounded-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-destructive">Failed to load wishlist.</div>
        ) : favorites?.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <Heart className="w-16 h-16 text-slate-200 dark:text-slate-800 mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">Your wishlist is empty</h3>
            <p className="text-muted-foreground mb-6 max-w-5xl">Browse our catalog and tap the heart icon to save items you're interested in for later.</p>
            <Button onClick={() => navigate('/dashboard/catalog')}>Explore Catalog</Button>
          </div>
        ) : (() => {
          let filtered = [...favorites];
          
          if (search) {
            filtered = filtered.filter(f => f.product.name.toLowerCase().includes(search.toLowerCase()));
          }
          
          if (stockFilter === 'in-stock') {
            filtered = filtered.filter(f => f.product.inventory?.quantity > 0);
          } else if (stockFilter === 'out-of-stock') {
            filtered = filtered.filter(f => !f.product.inventory?.quantity || f.product.inventory?.quantity <= 0);
          }
          
          filtered.sort((a, b) => {
            if (sortOrder === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
            if (sortOrder === 'price-asc') return a.product.price - b.product.price;
            if (sortOrder === 'price-desc') return b.product.price - a.product.price;
            return new Date(b.createdAt) - new Date(a.createdAt); // newest is default
          });

          if (filtered.length === 0) {
            return <div className="p-16 text-center text-muted-foreground font-medium">No items match your filters.</div>;
          }

          return (
            <div className="divide-y divide-border">
              {filtered.map((fav) => {
                const product = fav.product;
              const inStock = product.inventory?.quantity > 0;
              
              return (
                <div key={fav.id} className="p-6 flex flex-col sm:flex-row items-center gap-6 hover:bg-muted/50 transition-colors">
                  <div className="w-24 h-24 bg-white dark:bg-slate-900 border border-border rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                    {product.imageUrls?.[0] ? (
                      <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-contain p-2" />
                    ) : (
                      <div className="text-slate-300">No Img</div>
                    )}
                  </div>
                  
                  <div className="flex-1 text-center sm:text-left">
                    <Link to={`/dashboard/catalog/${product.id}`} className="text-xl font-bold text-foreground hover:text-primary transition-colors line-clamp-1 mb-1">
                      {product.name}
                    </Link>
                    <div className="text-muted-foreground text-sm space-y-1 mb-2">
                      <p>Category: {product.category?.name || 'General'}</p>
                      <p>Price: <span className="font-semibold text-primary">₹{product.price}</span> / {product.unit}</p>
                    </div>
                    {inStock ? (
                      <span className="text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2.5 py-0.5 rounded-full inline-block">
                        In Stock
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 px-2.5 py-0.5 rounded-full inline-block">
                        Out of Stock
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-row sm:flex-col gap-3 w-full sm:w-auto">
                    <Button 
                      className="flex-1 sm:flex-none rounded-full" 
                      disabled={!inStock || product.isAvailable === false}
                      onClick={() => handleAddToCart(product)}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 sm:flex-none rounded-full text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                      onClick={() => handleRemove(product.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Remove
                    </Button>
                  </div>
                </div>
              );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
