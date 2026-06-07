import { useState, useEffect } from 'react';
import {
  Search, ShoppingCart, CheckCircle2, XCircle, Heart,
  Filter, ChevronDown, AlertTriangle, FileText, X, SlidersHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import useSWR from 'swr';
import useDebounce from '@/hooks/useDebounce';

// GHS hazard pictogram colours by UN class prefix
const HAZARD_COLORS = {
  '1': { label: 'Explosive',   bg: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', dot: 'bg-orange-500' },
  '2': { label: 'Gas',         bg: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',           dot: 'bg-sky-500' },
  '3': { label: 'Flammable',   bg: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',           dot: 'bg-red-500' },
  '4': { label: 'Flammable',   bg: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',           dot: 'bg-red-500' },
  '5': { label: 'Oxidiser',    bg: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', dot: 'bg-yellow-500' },
  '6': { label: 'Toxic',       bg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', dot: 'bg-purple-500' },
  '7': { label: 'Radioactive', bg: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', dot: 'bg-yellow-500' },
  '8': { label: 'Corrosive',   bg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',   dot: 'bg-amber-500' },
  '9': { label: 'Misc. Danger',bg: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',           dot: 'bg-gray-500' },
};

const GRADE_COLORS = {
  'AR':        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'LR':        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'GR':        'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  'HPLC':      'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  'Technical': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  'Industrial':'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

function getHazardInfo(unNumber) {
  if (!unNumber) return null;
  const cls = String(unNumber).replace(/[^0-9]/g, '')[0];
  return HAZARD_COLORS[cls] || HAZARD_COLORS['9'];
}

const GRADES = ['AR', 'LR', 'GR', 'HPLC', 'Technical', 'Industrial'];

export default function Catalog() {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [showFilters, setShowFilters] = useState(false);

  // Filters state
  const [filters, setFilters] = useState({
    categoryId: 'all',
    grade: 'all',
    hazard: 'all',
    inStockOnly: false,
    minPrice: '',
    maxPrice: '',
  });
  const [activeFilters, setActiveFilters] = useState({ ...filters });

  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const { user, token } = useAuth();

  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null && q !== searchTerm) setSearchTerm(q);
  }, [searchParams]);

  const debouncedSearch = useDebounce(searchTerm, 300);

  // Build query string from active filters
  const buildQuery = () => {
    const params = new URLSearchParams();
    params.set('search', debouncedSearch);
    params.set('limit', '60');
    if (activeFilters.categoryId !== 'all') params.set('categoryId', activeFilters.categoryId);
    if (activeFilters.grade !== 'all') params.set('grade', activeFilters.grade);
    if (activeFilters.hazard !== 'all') params.set('hazard', activeFilters.hazard);
    if (activeFilters.inStockOnly) params.set('inStockOnly', 'true');
    if (activeFilters.minPrice) params.set('minPrice', activeFilters.minPrice);
    if (activeFilters.maxPrice) params.set('maxPrice', activeFilters.maxPrice);
    return params.toString();
  };

  const fetcher = async (url) => {
    const res = await fetch(url);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to load catalog');
    return json.data.filter(p => p.isAvailable !== false);
  };

  const { data: products, error, isValidating, mutate } = useSWR(
    `${import.meta.env.VITE_API_URL}/api/inventory?${buildQuery()}`,
    fetcher
  );

  // Fetch categories for the filter panel
  const { data: categories } = useSWR(
    `${import.meta.env.VITE_API_URL}/api/inventory/categories`,
    async (url) => {
      const res = await fetch(url);
      const json = await res.json();
      return json.success ? json.data : [];
    }
  );

  const loading = !products && !error;

  // Favorites
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
  const favoriteIds = new Set(favoritesData?.map(f => f.productId) || []);

  const handleToggleFavorite = async (e, productId) => {
    e.stopPropagation();
    if (!user) { navigate('/login', { state: { from: location } }); return; }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/favorites/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId })
      });
      if (res.ok) mutateFavorites();
    } catch (err) { console.error(err); }
  };

  const handleBuyNow = (product) => {
    if (!user) { navigate('/login', { state: { from: location } }); return; }
    addToCart(product, 1);
    navigate('/dashboard/checkout');
  };

  const applyFilters = () => {
    setActiveFilters({ ...filters });
    setShowFilters(false);
  };

  const clearFilters = () => {
    const reset = { categoryId: 'all', grade: 'all', hazard: 'all', inStockOnly: false, minPrice: '', maxPrice: '' };
    setFilters(reset);
    setActiveFilters(reset);
  };

  const hasActiveFilters = activeFilters.categoryId !== 'all' || activeFilters.grade !== 'all'
    || activeFilters.hazard !== 'all' || activeFilters.inStockOnly
    || activeFilters.minPrice || activeFilters.maxPrice;

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Hero */}
      <div className="bg-primary/5 border-b border-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Premium Chemical Catalog
          </h1>
          <p className="mt-4 max-w-2xl text-xl text-muted-foreground mx-auto">
            Industrial &amp; laboratory chemicals — direct from manufacturer.
          </p>
          <div className="mt-8 max-w-2xl mx-auto flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
              <Input
                className="w-full pl-12 pr-4 py-6 rounded-full text-lg shadow-sm border-primary/20 focus-visible:ring-primary"
                placeholder="Search by name, CAS number, grade…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-sm shadow-sm border transition-all ${
                hasActiveFilters
                  ? 'bg-primary text-white border-primary shadow-primary/30'
                  : 'bg-white dark:bg-slate-900 border-border text-foreground hover:border-primary'
              }`}
            >
              <SlidersHorizontal size={16} />
              Filters
              {hasActiveFilters && (
                <span className="bg-white/30 text-white text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">
                  ON
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-900 border-b border-border shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <Filter size={16} /> Refine Results
              </h2>
              <div className="flex gap-3">
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-sm text-destructive hover:underline flex items-center gap-1">
                    <X size={14} /> Clear all
                  </button>
                )}
                <button onClick={() => setShowFilters(false)} className="text-sm text-muted-foreground hover:text-foreground">
                  Close
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
              {/* Category */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Category</label>
                <select
                  value={filters.categoryId}
                  onChange={e => setFilters(f => ({ ...f, categoryId: e.target.value }))}
                  className="w-full text-sm bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Categories</option>
                  {(categories || []).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Grade */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Grade</label>
                <select
                  value={filters.grade}
                  onChange={e => setFilters(f => ({ ...f, grade: e.target.value }))}
                  className="w-full text-sm bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Grades</option>
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              {/* Hazard */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Hazard Level</label>
                <select
                  value={filters.hazard}
                  onChange={e => setFilters(f => ({ ...f, hazard: e.target.value }))}
                  className="w-full text-sm bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Products</option>
                  <option value="hazardous">Hazardous (UN Listed)</option>
                  <option value="non-hazardous">Non-Hazardous</option>
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Price Range (₹)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))}
                    className="w-1/2 text-sm bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
                    className="w-1/2 text-sm bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* In Stock Toggle */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Availability</label>
                <label className="flex items-center gap-3 cursor-pointer mt-1">
                  <div
                    onClick={() => setFilters(f => ({ ...f, inStockOnly: !f.inStockOnly }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${filters.inStockOnly ? 'bg-primary' : 'bg-muted'}`}
                  >
                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${filters.inStockOnly ? 'translate-x-5' : ''}`} />
                  </div>
                  <span className="text-sm font-medium text-foreground">In Stock Only</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6 justify-end">
              <Button variant="outline" onClick={() => setShowFilters(false)}>Cancel</Button>
              <Button onClick={applyFilters}>Apply Filters</Button>
            </div>
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 flex flex-wrap gap-2 items-center">
          <span className="text-xs font-semibold text-muted-foreground">Active:</span>
          {activeFilters.categoryId !== 'all' && (
            <FilterChip label={`Category: ${categories?.find(c => c.id === activeFilters.categoryId)?.name || '...'}`}
              onRemove={() => { setActiveFilters(f => ({ ...f, categoryId: 'all' })); setFilters(f => ({ ...f, categoryId: 'all' })); }} />
          )}
          {activeFilters.grade !== 'all' && (
            <FilterChip label={`Grade: ${activeFilters.grade}`}
              onRemove={() => { setActiveFilters(f => ({ ...f, grade: 'all' })); setFilters(f => ({ ...f, grade: 'all' })); }} />
          )}
          {activeFilters.hazard !== 'all' && (
            <FilterChip label={activeFilters.hazard === 'hazardous' ? '⚠ Hazardous only' : '✓ Non-hazardous only'}
              onRemove={() => { setActiveFilters(f => ({ ...f, hazard: 'all' })); setFilters(f => ({ ...f, hazard: 'all' })); }} />
          )}
          {activeFilters.inStockOnly && (
            <FilterChip label="In Stock Only"
              onRemove={() => { setActiveFilters(f => ({ ...f, inStockOnly: false })); setFilters(f => ({ ...f, inStockOnly: false })); }} />
          )}
          {(activeFilters.minPrice || activeFilters.maxPrice) && (
            <FilterChip label={`₹${activeFilters.minPrice || '0'} – ₹${activeFilters.maxPrice || '∞'}`}
              onRemove={() => { setActiveFilters(f => ({ ...f, minPrice: '', maxPrice: '' })); setFilters(f => ({ ...f, minPrice: '', maxPrice: '' })); }} />
          )}
          <button onClick={clearFilters} className="text-xs text-destructive hover:underline ml-1">Clear all</button>
        </div>
      )}

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Result count */}
        {!loading && products && (
          <p className="text-sm text-muted-foreground mb-5">
            Showing <span className="font-semibold text-foreground">{products.length}</span> products
            {isValidating && <span className="ml-2 text-xs">(refreshing…)</span>}
          </p>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col animate-pulse">
                <div className="aspect-square bg-slate-200 dark:bg-slate-800" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                  <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h3 className="text-xl font-medium text-foreground">No products found</h3>
            <p className="text-muted-foreground mt-2">Try adjusting your search or filters.</p>
            <div className="flex gap-3 justify-center mt-6">
              <Button variant="outline" onClick={() => setSearchTerm('')}>Clear Search</Button>
              {hasActiveFilters && <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => {
              const inStock = product.inventory?.quantity > 0;
              const hazardInfo = getHazardInfo(product.unNumber);
              const gradeStyle = GRADE_COLORS[product.grade] || GRADE_COLORS['Technical'];
              return (
                <div
                  key={product.id}
                  className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group hover:-translate-y-1 cursor-pointer"
                  onClick={() => {
                    const isDashboard = location.pathname.startsWith('/dashboard');
                    navigate(`${isDashboard ? '/dashboard/catalog' : '/catalog'}/${product.id}`);
                    window.scrollTo(0, 0);
                  }}
                >
                  {/* Image */}
                  <div className="relative aspect-square bg-slate-100 dark:bg-slate-900 overflow-hidden border-b border-border">
                    {product.imageUrls?.length > 0 ? (
                      <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <BeakerIcon className="w-16 h-16 opacity-40 mb-2" />
                        <span className="text-sm font-medium">No Image</span>
                      </div>
                    )}

                    {/* Top-right badges */}
                    <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                      <button
                        onClick={(e) => handleToggleFavorite(e, product.id)}
                        className="p-2 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800 shadow-sm hover:scale-110 transition-transform"
                      >
                        <Heart size={18} className={favoriteIds.has(product.id) ? 'fill-red-500 text-red-500' : 'text-slate-500 dark:text-slate-400'} />
                      </button>
                      {inStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800 shadow-sm">
                          <CheckCircle2 size={11} /> In Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800 shadow-sm">
                          <XCircle size={11} /> Out of Stock
                        </span>
                      )}
                    </div>

                    {/* Hazard banner at bottom of image */}
                    {hazardInfo && (
                      <div className={`absolute bottom-0 left-0 right-0 px-3 py-1.5 flex items-center gap-2 text-xs font-semibold ${hazardInfo.bg} border-t border-current/20 backdrop-blur-sm`}>
                        <AlertTriangle size={13} className="shrink-0" />
                        <span>UN {product.unNumber} · {hazardInfo.label} Substance</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    {/* Chips row */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {product.grade && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${gradeStyle}`}>
                          {product.grade}
                        </span>
                      )}
                      {product.category?.name && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {product.category.name}
                        </span>
                      )}
                      {product.isMadeInIndia && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                          🇮🇳 India
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-lg text-foreground leading-tight line-clamp-2 mb-2" title={product.name}>
                      {product.name}
                    </h3>

                    {/* CAS / UN */}
                    <div className="flex flex-wrap gap-2 text-xs mb-3">
                      {product.casNumber && (
                        <span className="font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">
                          CAS {product.casNumber}
                        </span>
                      )}
                      {product.unNumber && (
                        <span className="font-mono bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded">
                          UN {product.unNumber}
                        </span>
                      )}
                      {product.purity && (
                        <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded">
                          {product.purity}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                      {product.description || 'No description available.'}
                    </p>

                    {/* SDS / Datasheet link */}
                    {product.datasheetUrl && (
                      <a
                        href={product.datasheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline mb-3"
                      >
                        <FileText size={13} /> Safety Datasheet (SDS)
                      </a>
                    )}

                    <div className="mt-auto pt-4 border-t border-border flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium mb-0.5">
                          {product.packageSize ? `per ${product.packageSize} ${product.baseUnit || product.unit}` : `per ${product.unit}`}
                        </p>
                        <p className="text-2xl font-bold text-primary leading-none">₹{product.price.toLocaleString('en-IN')}</p>
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!user) { navigate('/login', { state: { from: location } }); return; }
                          addToCart(product, 1);
                        }}
                        disabled={!inStock}
                        className="rounded-xl shadow-sm hover:shadow shrink-0"
                        size="sm"
                      >
                        <ShoppingCart className="w-4 h-4 mr-1.5" />
                        Add
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

function FilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
      {label}
      <button onClick={onRemove} className="hover:text-primary/70 transition-colors">
        <X size={12} />
      </button>
    </span>
  );
}

function BeakerIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 3h15" /><path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3" /><path d="M6 14h12" />
    </svg>
  );
}
