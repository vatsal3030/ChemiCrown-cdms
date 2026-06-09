import { useState } from 'react';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import useSWR from 'swr';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function Wishlist() {
  const { token, user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

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
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Heart className="w-8 h-8 text-red-500 fill-red-500" /> My Wishlist
        </h1>
        <p className="text-muted-foreground mt-2">Manage your saved items and favorite chemicals for later.</p>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
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
        ) : (
          <div className="divide-y divide-border">
            {favorites?.map((fav) => {
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
        )}
      </div>
    </div>
  );
}
