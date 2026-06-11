import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Beaker, Star, Shield, Archive, CheckCircle2, XCircle, ChevronRight, X, Maximize2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import useSWR from 'swr';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description');
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { token } = useAuth();

  const favFetcher = async (url) => {
    if (!token) return [];
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    return json.success ? json.data : [];
  };

  const { data: favoritesData, mutate: mutateFavorites } = useSWR(
    user ? `${import.meta.env.VITE_API_URL}/api/favorites` : null,
    favFetcher
  );

  const isFavorited = favoritesData?.some(f => f.productId === id);

  const handleToggleFavorite = async () => {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/favorites/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ productId: id })
      });
      if (res.ok) {
        mutateFavorites();
        const json = await res.json();
        toast.success(json.action === 'added' ? 'Added to Wishlist' : 'Removed from Wishlist');
      }
    } catch (err) {
      toast.error('Failed to update wishlist');
    }
  };

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        // Fetch Product
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/inventory/${id}`);
        const json = await res.json();
        
        if (json.success) {
          const prod = json.data;
          setProduct(prod);
          
          // Save to local storage history
          const history = JSON.parse(localStorage.getItem('productHistory') || '[]');
          const newHistory = [prod, ...history.filter(p => p.id !== prod.id)].slice(0, 10);
          localStorage.setItem('productHistory', JSON.stringify(newHistory));

          // Fetch Related Products (same category)
          if (prod.categoryId) {
            const relatedRes = await fetch(`${import.meta.env.VITE_API_URL}/api/inventory?categoryId=${prod.categoryId}&limit=5`);
            const relatedJson = await relatedRes.json();
            if (relatedJson.success) {
              setRelatedProducts(relatedJson.data.filter(p => p.id !== prod.id).slice(0, 4));
            }
          }
        } else {
          toast.error(json.error || 'Failed to load product');
        }
      } catch (error) {
        toast.error('Network error while loading product');
      } finally {
        setLoading(false);
      }
    };
    fetchProductData();
  }, [id]);

  if (loading) {
    return (
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-12 py-8 space-y-12 pb-20 animate-pulse">
        {/* Back Button Skeleton */}
        <div className="h-9 w-36 bg-slate-200 dark:bg-slate-800 rounded mb-[-20px]"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start relative">
          {/* Left Column Skeleton */}
          <div className="md:col-span-5 lg:col-span-4 space-y-4">
            <div className="aspect-square bg-slate-200 dark:bg-slate-800 rounded-2xl w-full border border-slate-100 dark:border-slate-800"></div>
            <div className="flex gap-2 overflow-hidden pb-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0 border-2 border-slate-100 dark:border-slate-800"></div>
              ))}
            </div>
          </div>
          
          {/* Middle Column Skeleton */}
          <div className="md:col-span-7 lg:col-span-5 space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-6">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20 mb-2"></div>
              <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded w-full mb-2"></div>
              <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded w-2/3"></div>
              <div className="flex gap-4 mt-3">
                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-32"></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16"></div>
                  <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-full max-w-[150px]"></div>
                </div>
              ))}
            </div>
            
            <div className="pt-4">
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-32 mb-2"></div>
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
              </div>
            </div>
          </div>

          {/* Right Column (Buy Box) Skeleton Removed for horizontal layout */}
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="p-20 text-center">
      <h2 className="text-2xl font-bold">Product Not Found</h2>
      <Button className="mt-4" onClick={() => navigate('/catalog')}>Back to Catalog</Button>
    </div>;
  }

  const inStock = product.inventory?.quantity > 0;
  const avgRating = product.reviews?.length > 0 
    ? (product.reviews.reduce((a, b) => a + b.rating, 0) / product.reviews.length).toFixed(1)
    : 'No ratings yet';

  const images = product.imageUrls?.length > 0 ? product.imageUrls : (product.imageUrl ? [product.imageUrl] : []);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-12 py-4 sm:py-8 space-y-6 sm:space-y-10 pb-16 sm:pb-20 animate-in fade-in duration-500 overflow-x-hidden">
      <Button variant="ghost" onClick={() => {
        const isDashboard = location.pathname.startsWith('/dashboard');
        navigate(isDashboard ? '/dashboard/catalog' : '/catalog');
      }} className="mb-[-20px]">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Catalog
      </Button>

      {/* Main Product Section - Landscape Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-4 space-y-4 sticky top-6">
          <div className="relative group glass rounded-3xl border border-border flex items-center justify-center aspect-auto min-h-[400px] shadow-sm overflow-hidden bg-white">
            {images.length > 0 ? (
              <>
                <img 
                  src={images[activeImageIndex]} 
                  alt={product.name} 
                  className="w-full h-full object-contain cursor-zoom-in transition-transform duration-300"
                  onClick={() => setIsFullscreen(true)}
                />
                <button 
                  onClick={() => setIsFullscreen(true)}
                  className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white text-slate-700 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Maximize2 size={18} />
                </button>
              </>
            ) : (
              <Beaker className="w-32 h-32 text-slate-300" />
            )}
          </div>
          
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  className={`relative w-16 h-16 rounded-xl border-2 shrink-0 overflow-hidden bg-white ${i === activeImageIndex ? 'border-primary shadow-sm' : 'border-border hover:border-slate-300'}`}
                  onClick={() => setActiveImageIndex(i)}
                  onMouseEnter={() => setActiveImageIndex(i)}
                >
                  <img src={img} className="w-full h-full object-contain" alt={`Thumbnail ${i}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Middle Column: Product Info */}
        <div className="lg:col-span-5 space-y-6 flex flex-col h-full">
          {/* Header section */}
          <div className="border-b border-border pb-6">
            <div className="text-primary font-semibold hover:underline cursor-pointer inline-flex items-center text-sm mb-2">
              {product.category?.name || 'General'}
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground leading-tight">
              {product.name}
            </h1>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center text-yellow-500 text-sm">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.round(avgRating) ? 'fill-current' : 'text-slate-300'}`} />
                ))}
                <span className="text-primary ml-2 hover:underline cursor-pointer">{product.reviews?.length || 0} ratings</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-foreground">₹{product.price}</span>
              <span className="text-sm text-muted-foreground">/ {product.packageSize ? `${product.packageSize}${product.baseUnit} ${product.unit}` : product.unit}</span>
            </div>
            <p className="text-sm text-muted-foreground">Inclusive of all taxes</p>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 sm:p-5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs sm:text-sm overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-0">
                <tbody>
                  {product.brand && <tr className="border-b border-slate-200 dark:border-slate-800 last:border-0"><th className="py-2 text-muted-foreground font-medium w-1/3 pr-3">Brand</th><td className="py-2 text-foreground font-semibold break-words">{product.brand}</td></tr>}
                  {product.manufacturer && <tr className="border-b border-slate-200 dark:border-slate-800 last:border-0"><th className="py-2 text-muted-foreground font-medium w-1/3 pr-3">Manufacturer</th><td className="py-2 text-foreground break-words">{product.manufacturer}</td></tr>}
                  {product.itemForm && <tr className="border-b border-slate-200 dark:border-slate-800 last:border-0"><th className="py-2 text-muted-foreground font-medium w-1/3 pr-3">Item Form</th><td className="py-2 text-foreground">{product.itemForm}</td></tr>}
                  {product.purity && <tr className="border-b border-slate-200 dark:border-slate-800 last:border-0"><th className="py-2 text-muted-foreground font-medium w-1/3 pr-3">Purity</th><td className="py-2 text-foreground">{product.purity}</td></tr>}
                  {product.grade && <tr className="border-b border-slate-200 dark:border-slate-800 last:border-0"><th className="py-2 text-muted-foreground font-medium w-1/3 pr-3">Grade</th><td className="py-2 text-foreground">{product.grade}</td></tr>}
                  {product.mfgDate && <tr className="border-b border-slate-200 dark:border-slate-800 last:border-0"><th className="py-2 text-muted-foreground font-medium w-1/3 pr-3">Mfg Date</th><td className="py-2 text-foreground">{new Date(product.mfgDate).toLocaleDateString()}</td></tr>}
                  {product.expiryDate && <tr className="border-b border-slate-200 dark:border-slate-800 last:border-0"><th className="py-2 text-muted-foreground font-medium w-1/3 pr-3">Expiry</th><td className="py-2 text-foreground">{new Date(product.expiryDate).toLocaleDateString()}</td></tr>}
                  {product.casNumber && <tr className="border-b border-slate-200 dark:border-slate-800 last:border-0"><th className="py-2 text-muted-foreground font-medium w-1/3 pr-3">CAS</th><td className="py-2 font-mono text-foreground break-all">{product.casNumber}</td></tr>}
                  {product.sku && <tr className="border-b border-slate-200 dark:border-slate-800 last:border-0"><th className="py-2 text-muted-foreground font-medium w-1/3 pr-3">SKU</th><td className="py-2 font-mono text-foreground break-all text-[10px] sm:text-xs">{product.sku}</td></tr>}
                </tbody>
              </table>
            </div>

            </div>
          </div>

        {/* Right Column: Buy Box */}
        <div className="lg:col-span-3 space-y-4 border border-border rounded-2xl p-5 bg-card shadow-sm sticky top-6">
          <div className="text-3xl font-bold">₹{product.price}</div>
          
          {inStock && (
            <div className="space-y-1">
              <div className="flex gap-2 text-sm text-muted-foreground">
                <span className="text-green-600 font-bold">FREE Delivery</span>
                <span>by Tomorrow</span>
              </div>
            </div>
          )}

          <div className="text-lg">
            {inStock ? (
              <span className="text-green-600 dark:text-green-400 font-bold">In Stock.</span>
            ) : (
              <span className="text-red-600 dark:text-red-400 font-bold">Currently Out of Stock.</span>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground flex items-center gap-2 pt-1 mb-4">
            <Shield size={14} className="text-green-600" /> Secure transaction
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Qty:</label>
              <div className="flex items-center border border-input rounded-md bg-background overflow-hidden h-9 w-24">
                <button 
                  className="px-2 h-full hover:bg-slate-100 disabled:opacity-50 font-bold"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={!inStock || quantity <= 1}
                >-</button>
                <input 
                  type="number"
                  className="w-full text-center border-x border-input h-full bg-transparent text-sm focus:outline-none appearance-none m-0"
                  value={quantity}
                  min="1"
                  max={product.inventory?.quantity || 1}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) setQuantity(Math.min(Math.max(1, val), product.inventory?.quantity || 1));
                    else setQuantity('');
                  }}
                  onBlur={() => { if (!quantity || isNaN(quantity)) setQuantity(1); }}
                  disabled={!inStock}
                />
                <button 
                  className="px-2 h-full hover:bg-slate-100 disabled:opacity-50 font-bold"
                  onClick={() => setQuantity(Math.min(product.inventory?.quantity || 1, (quantity || 0) + 1))}
                  disabled={!inStock || quantity >= (product.inventory?.quantity || 1)}
                >+</button>
              </div>
            </div>
            
            {product.isAvailable === false ? (
              <Button className="w-full rounded-full shadow-md bg-slate-300 text-slate-600 font-bold" disabled>
                <XCircle className="w-4 h-4 mr-2" /> Unavailable
              </Button>
            ) : (
              <>
                <Button 
                  className="w-full rounded-full shadow-md bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold"
                  disabled={!inStock}
                  onClick={() => {
                    if (!user) { navigate('/login', { state: { from: location } }); return; }
                    addToCart(product, quantity);
                  }}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart
                </Button>
                <Button 
                  className="w-full rounded-full shadow-md bg-orange-500 hover:bg-orange-600 text-white font-bold"
                  disabled={!inStock}
                  onClick={() => {
                    if (!user) { navigate('/login', { state: { from: location } }); return; }
                    addToCart(product, quantity);
                    navigate('/dashboard/checkout');
                  }}
                >
                  Buy Now
                </Button>
              </>
            )}
            
            <Button 
              variant="outline" 
              className={`w-full rounded-full shadow-sm font-bold ${isFavorited ? 'border-red-200 text-red-500 bg-red-50' : ''}`}
              onClick={handleToggleFavorite}
            >
              <Heart className={`w-5 h-5 mr-2 ${isFavorited ? 'fill-red-500' : ''}`} /> 
              {isFavorited ? 'Saved to Wishlist' : 'Add to Wishlist'}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Section - Full Width */}
      <div className="mt-16 w-full max-w-full">
        <div className="flex border-b border-border overflow-x-auto whitespace-nowrap scrollbar-hide">
          <button 
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'description' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('description')}
          >
            Description
          </button>
          <button 
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'safety' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('safety')}
          >
            <Shield size={16} /> Safety & Storage
          </button>
          <button 
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'reviews' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('reviews')}
          >
            <Star size={16} /> Reviews ({product.reviews?.length || 0})
          </button>
        </div>

        <div className="py-8 min-h-[200px]">
          {activeTab === 'description' && (
            <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed">
              {product.description || 'No detailed description available.'}
            </div>
          )}
          
          {activeTab === 'safety' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="glass p-6 rounded-2xl border-l-4 border-l-orange-500">
                <h3 className="font-bold flex items-center gap-2 mb-3"><Shield className="text-orange-500" /> Safety Notes</h3>
                <p className="text-slate-600 dark:text-slate-300">{product.safetyNotes || 'Please refer to standard MSDS for safety instructions.'}</p>
              </div>
              <div className="glass p-6 rounded-2xl border-l-4 border-l-blue-500">
                <h3 className="font-bold flex items-center gap-2 mb-3"><Archive className="text-blue-500" /> Storage Instructions</h3>
                <p className="text-slate-600 dark:text-slate-300">{product.storageInstructions || 'Store in a cool, dry place away from direct sunlight.'}</p>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6">
              {product.reviews && product.reviews.length > 0 ? (
                product.reviews.map(review => (
                  <div key={review.id} className="p-6 rounded-2xl bg-card border border-border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                          {review.customer?.user?.firstName?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <p className="font-bold">{review.customer?.companyName || review.customer?.user?.firstName}</p>
                          <p className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex text-yellow-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-slate-300'}`} />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-slate-600 dark:text-slate-300 italic">"{review.comment}"</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-border">
                  <Star className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-medium">No reviews yet</h3>
                  <p className="text-muted-foreground">Only customers who have had this product delivered can leave a review.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="pt-12 border-t border-border">
          <h2 className="text-2xl font-bold mb-8">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map(rel => (
              <div 
                key={rel.id} 
                className="bg-card rounded-2xl border border-border p-4 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all group"
                onClick={() => {
                  const isDashboard = location.pathname.startsWith('/dashboard');
                  navigate(`${isDashboard ? '/dashboard/catalog' : '/catalog'}/${rel.id}`);
                  window.scrollTo(0,0);
                }}
              >
                <div className="aspect-square bg-slate-100 dark:bg-slate-900 rounded-xl mb-4 overflow-hidden flex items-center justify-center">
                  {rel.imageUrls?.length > 0 ? (
                    <img src={rel.imageUrls[0]} alt={rel.name} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : rel.imageUrl ? (
                    <img src={rel.imageUrl} alt={rel.name} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <Beaker className="text-slate-300 w-12 h-12" />
                  )}
                </div>
                <h3 className="font-bold truncate">{rel.name}</h3>
                <p className="text-primary font-bold mt-1">₹{rel.price}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Fullscreen Image Modal */}
      {isFullscreen && images.length > 0 && (
        <div className="fixed inset-0 z-100 bg-black/95 flex items-center justify-center p-4">
          <button 
            className="absolute top-6 right-6 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            onClick={() => setIsFullscreen(false)}
          >
            <X size={28} />
          </button>
          
          <img 
            src={images[activeImageIndex]} 
            alt={product.name} 
            className="max-w-full max-h-[85vh] object-contain"
          />

          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 p-3 bg-black/50 backdrop-blur-md rounded-2xl">
              {images.map((img, i) => (
                <button
                  key={i}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 ${i === activeImageIndex ? 'border-primary' : 'border-transparent opacity-50 hover:opacity-100'}`}
                  onClick={() => setActiveImageIndex(i)}
                >
                  <img src={img} className="w-full h-full object-cover" alt={`Thumb ${i}`} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
