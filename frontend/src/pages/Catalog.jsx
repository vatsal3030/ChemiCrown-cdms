import { useState, useEffect, useCallback } from 'react';
import {
  Search, ShoppingCart, CheckCircle2, XCircle, Heart,
  Filter, X, SlidersHorizontal, AlertTriangle, FileText, Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import useSWR from 'swr';
import useDebounce from '@/hooks/useDebounce';
import Reveal from '@/components/scroll/Reveal';

// ─── Hazard / Grade colour maps ───────────────────────────────────────────────
const HAZARD_COLORS = {
  '1': { label: 'Explosive',    bg: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  '2': { label: 'Gas',          bg: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
  '3': { label: 'Flammable',    bg: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  '4': { label: 'Flammable',    bg: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  '5': { label: 'Oxidiser',     bg: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  '6': { label: 'Toxic',        bg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  '7': { label: 'Radioactive',  bg: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  '8': { label: 'Corrosive',    bg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  '9': { label: 'Misc. Danger', bg: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
};

const GRADE_COLORS = {
  'AR':        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'LR':        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'GR':        'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  'HPLC':      'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  'Technical': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  'Industrial':'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

const GRADES = ['AR', 'LR', 'GR', 'HPLC', 'Technical', 'Industrial'];
const LOW_STOCK_THRESHOLD = 10; // products with qty <= this get "Low Stock" badge

function getHazardInfo(unNumber) {
  if (!unNumber) return null;
  const cls = String(unNumber).replace(/[^0-9]/g, '')[0];
  return HAZARD_COLORS[cls] || HAZARD_COLORS['9'];
}

const EMPTY_FILTERS = {
  categoryId: 'all',
  grade: 'all',
  hazard: 'all',
  inStockOnly: false,
  minPrice: '',
  maxPrice: '',
};

// ─── API fetcher ──────────────────────────────────────────────────────────────
const fetcher = async (url) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to load catalog');
  return json.data.filter(p => p.isAvailable !== false);
};

const catFetcher = async (url) => {
  const res = await fetch(url);
  const json = await res.json();
  return json.success ? json.data : [];
};

const favFetcher = async (url, token) => {
  if (!token) return [];
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const json = await res.json();
  return json.success ? json.data : [];
};

// ─── Main Catalog component ───────────────────────────────────────────────────
export default function Catalog() {
  const [searchParams] = useSearchParams();
  const navigate   = useNavigate();
  const location   = useLocation();
  const { addToCart } = useCart();
  const { user, token } = useAuth();

  // Catalog always uses standard ERP styling (no cinematic dark override)
  const isPublic = false;

  // ── Search ──────────────────────────────────────────────────────────────────
  // Single source of truth: local state, NOT derived from URL (avoids double-state conflicts)
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');
  const debouncedSearch = useDebounce(searchTerm, 400);

  // ── Filter state ────────────────────────────────────────────────────────────
  // `pendingFilters` = what the user is editing in the panel (not yet applied)
  // `activeFilters`  = what is actually used in the API query
  const [pendingFilters, setPendingFilters] = useState({ ...EMPTY_FILTERS });
  const [activeFilters,  setActiveFilters]  = useState({ ...EMPTY_FILTERS });
  const [showFilters,    setShowFilters]    = useState(false);

  // ── Build SWR key ───────────────────────────────────────────────────────────
  // IMPORTANT: derive the key inside the render so SWR always sees the latest activeFilters
  const buildQuery = () => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    params.set('limit', '60');
    if (activeFilters.categoryId !== 'all') params.set('categoryId', activeFilters.categoryId);
    if (activeFilters.grade      !== 'all') params.set('grade',      activeFilters.grade);
    if (activeFilters.hazard     !== 'all') params.set('hazard',     activeFilters.hazard);
    if (activeFilters.inStockOnly)           params.set('inStockOnly','true');
    if (activeFilters.minPrice)              params.set('minPrice',   activeFilters.minPrice);
    if (activeFilters.maxPrice)              params.set('maxPrice',   activeFilters.maxPrice);
    return params.toString();
  };

  const apiUrl = `${import.meta.env.VITE_API_URL}/api/inventory?${buildQuery()}`;

  const { data: products, error, isValidating } = useSWR(apiUrl, fetcher, {
    // Do NOT dedupe by default interval — always refetch on key change
    dedupingInterval: 0,
    revalidateOnFocus: false,
  });

  const { data: categories } = useSWR(
    `${import.meta.env.VITE_API_URL}/api/inventory/categories`,
    catFetcher,
    { revalidateOnFocus: false }
  );

  const { data: favoritesData, mutate: mutateFavorites } = useSWR(
    user ? `${import.meta.env.VITE_API_URL}/api/favorites` : null,
    (url) => favFetcher(url, token),
    { revalidateOnFocus: false }
  );

  const favoriteIds = new Set(favoritesData?.map(f => f.productId) || []);
  const loading = !products && !error && isValidating;

  // ── Compute price bounds from current product list ──────────────────────────
  const priceStats = useMemo_safe(products);

  // ── Filter panel helpers ────────────────────────────────────────────────────
  const applyFilters = () => {
    // Clamp price values to product range before applying
    const min = pendingFilters.minPrice !== ''
      ? Math.max(0, parseFloat(pendingFilters.minPrice) || 0)
      : '';
    const max = pendingFilters.maxPrice !== ''
      ? parseFloat(pendingFilters.maxPrice) || ''
      : '';
    setActiveFilters({ ...pendingFilters, minPrice: min === 0 && !pendingFilters.minPrice ? '' : String(min === '' ? '' : min), maxPrice: String(max === '' ? '' : max) });
    setShowFilters(false);
  };

  const clearFilters = () => {
    setPendingFilters({ ...EMPTY_FILTERS });
    setActiveFilters({ ...EMPTY_FILTERS });
  };

  // Sync panel to active when opening
  const openFilters = () => {
    setPendingFilters({ ...activeFilters });
    setShowFilters(true);
  };

  const hasActiveFilters = activeFilters.categoryId !== 'all'
    || activeFilters.grade !== 'all'
    || activeFilters.hazard !== 'all'
    || activeFilters.inStockOnly
    || activeFilters.minPrice !== ''
    || activeFilters.maxPrice !== '';

  // ── Favorites toggle ────────────────────────────────────────────────────────
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

  const handleBuyNow = (e, product) => {
    e.stopPropagation();
    if (!user) { navigate('/login', { state: { from: location } }); return; }
    addToCart(product, 1);
    navigate('/dashboard/checkout');
  };

  // ── Card reveal is handled by CSS transitions (GSAP removed) ──

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className={`flex-1 pb-16 overflow-x-hidden ${isPublic ? 'bg-ink' : 'bg-background'}`}>

      {/* ── Simple Hero / Search ── */}
      <div className={`border-b py-8 sm:py-12 px-3 sm:px-6 lg:px-8 ${
        isPublic
          ? 'bg-ink-2 border-white/[0.05]'
          : 'bg-card border-border'
      }`}>
        <div className="max-w-7xl mx-auto text-center">
          <h1 className={`text-3xl sm:text-4xl font-bold mb-4 ${
            isPublic ? 'text-headline text-white' : 'text-foreground'
          }`}>
            Product Catalog
          </h1>
          <p className={`text-base sm:text-lg mx-auto max-w-3xl mb-8 ${
            isPublic ? 'text-slate-400' : 'text-muted-foreground'
          }`}>
            Industrial & laboratory chemicals — direct from manufacturer.
          </p>

          <div className="max-w-3xl mx-auto flex flex-wrap gap-2">
            <div className="relative flex-1">
              <Search className={`absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-5 w-5 z-10 ${
                isPublic ? 'text-slate-500' : 'text-muted-foreground'
              }`} />
              <input
                type="text"
                className={`w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base border focus:outline-none focus:ring-2 ${
                  isPublic
                    ? 'border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500 focus:ring-accent-cobalt/50 focus:border-accent-cobalt/30'
                    : 'border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-primary'
                }`}
                placeholder="Search by name, CAS number, grade…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={showFilters ? () => setShowFilters(false) : openFilters}
              className={`flex items-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
                hasActiveFilters
                  ? isPublic
                    ? 'bg-brand text-white border-brand'
                    : 'bg-primary text-primary-foreground border-primary'
                  : isPublic
                    ? 'bg-white/[0.04] border border-white/10 text-slate-300 hover:bg-white/[0.08]'
                    : 'bg-background border border-input text-foreground hover:bg-muted'
              }`}
            >
              <SlidersHorizontal size={16} />
              Filters
              {hasActiveFilters && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold leading-none ml-1 ${
                  isPublic ? 'bg-white/20 text-white' : 'bg-primary-foreground/20 text-primary-foreground'
                }`}>
                  ON
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Filter Panel ── */}
      {showFilters && (
        <div className={`border-b shadow-md ${
          isPublic ? 'bg-ink-2 border-white/[0.05]' : 'bg-card border-border'
        }`}>
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <h2 className="font-bold text-foreground flex flex-wrap items-center gap-2 text-sm sm:text-base">
                <Filter size={15} /> Refine Results
              </h2>
              <div className="flex flex-wrap gap-3">
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs text-destructive hover:underline flex flex-wrap items-center gap-1">
                    <X size={12} /> Clear all
                  </button>
                )}
                <button onClick={() => setShowFilters(false)} className="text-xs text-muted-foreground hover:text-foreground">
                  Close
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {/* Category */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Category</label>
                <select
                  value={pendingFilters.categoryId}
                  onChange={e => setPendingFilters(f => ({ ...f, categoryId: e.target.value }))}
                  className="w-full text-xs sm:text-sm bg-background border border-input rounded-xl px-2 sm:px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Categories</option>
                  {(categories || []).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Grade */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Grade</label>
                <select
                  value={pendingFilters.grade}
                  onChange={e => setPendingFilters(f => ({ ...f, grade: e.target.value }))}
                  className="w-full text-xs sm:text-sm bg-background border border-input rounded-xl px-2 sm:px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Grades</option>
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              {/* Hazard */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Hazard</label>
                <select
                  value={pendingFilters.hazard}
                  onChange={e => setPendingFilters(f => ({ ...f, hazard: e.target.value }))}
                  className="w-full text-xs sm:text-sm bg-background border border-input rounded-xl px-2 sm:px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Products</option>
                  <option value="hazardous">⚠ Hazardous (UN Listed)</option>
                  <option value="non-hazardous">✓ Non-Hazardous</option>
                </select>
              </div>

              {/* Price Range — free-form numbers, no min/max constraint */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                  Price (₹)
                  {priceStats && (
                    <span className="text-[10px] text-muted-foreground/70 ml-1 font-normal normal-case">
                      {priceStats.min}–{priceStats.max}
                    </span>
                  )}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <input
                    type="number"
                    min="0"
                    placeholder="Min"
                    value={pendingFilters.minPrice}
                    onChange={e => setPendingFilters(f => ({ ...f, minPrice: e.target.value }))}
                    className="w-1/2 text-xs sm:text-sm bg-background border border-input rounded-xl px-2 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Max"
                    value={pendingFilters.maxPrice}
                    onChange={e => setPendingFilters(f => ({ ...f, maxPrice: e.target.value }))}
                    className="w-1/2 text-xs sm:text-sm bg-background border border-input rounded-xl px-2 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* In Stock */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Availability</label>
                <label className="flex flex-wrap items-center gap-2.5 cursor-pointer mt-1">
                  <div
                    onClick={() => setPendingFilters(f => ({ ...f, inStockOnly: !f.inStockOnly }))}
                    className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${pendingFilters.inStockOnly ? 'bg-primary' : 'bg-muted'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${pendingFilters.inStockOnly ? 'translate-x-5' : ''}`} />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-foreground">In Stock Only</span>
                </label>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-5 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setPendingFilters({ ...EMPTY_FILTERS }); }}>Reset</Button>
              <Button size="sm" onClick={applyFilters}>Apply Filters</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Active filter chips ── */}
      {hasActiveFilters && (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-3 flex flex-wrap gap-1.5 sm:gap-2 items-center">
          <span className="text-xs font-semibold text-muted-foreground">Active:</span>
          {activeFilters.categoryId !== 'all' && (
            <FilterChip
              label={`Category: ${categories?.find(c => c.id === activeFilters.categoryId)?.name || '...'}`}
              onRemove={() => setActiveFilters(f => ({ ...f, categoryId: 'all' }))}
            />
          )}
          {activeFilters.grade !== 'all' && (
            <FilterChip label={`Grade: ${activeFilters.grade}`}
              onRemove={() => setActiveFilters(f => ({ ...f, grade: 'all' }))} />
          )}
          {activeFilters.hazard !== 'all' && (
            <FilterChip label={activeFilters.hazard === 'hazardous' ? '⚠ Hazardous' : '✓ Non-hazardous'}
              onRemove={() => setActiveFilters(f => ({ ...f, hazard: 'all' }))} />
          )}
          {activeFilters.inStockOnly && (
            <FilterChip label="In Stock Only"
              onRemove={() => setActiveFilters(f => ({ ...f, inStockOnly: false }))} />
          )}
          {(activeFilters.minPrice !== '' || activeFilters.maxPrice !== '') && (
            <FilterChip label={`₹${activeFilters.minPrice || '0'} – ₹${activeFilters.maxPrice || '∞'}`}
              onRemove={() => setActiveFilters(f => ({ ...f, minPrice: '', maxPrice: '' }))} />
          )}
          <button onClick={clearFilters} className="text-xs text-destructive hover:underline ml-1">Clear all</button>
        </div>
      )}

      {/* ── Product Grid ── */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 mt-5 sm:mt-8">
        {/* Result count */}
        {!loading && products && (
          <p className="text-xs sm:text-sm text-muted-foreground mb-4">
            Showing <span className="font-semibold text-foreground">{products.length}</span> products
            {isValidating && <span className="ml-2 text-xs opacity-60">(refreshing…)</span>}
          </p>
        )}

        {/* Loading skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col animate-pulse">
                <div className="aspect-[4/3] bg-slate-200 dark:bg-slate-800" />
                <div className="p-3 sm:p-5 space-y-2 sm:space-y-3">
                  <div className="h-4 sm:h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                  <div className="h-8 sm:h-10 bg-slate-200 dark:bg-slate-800 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 text-destructive">
            <p className="font-medium">Failed to load products.</p>
            <button onClick={() => window.location.reload()} className="mt-3 text-sm underline">Retry</button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 sm:py-20">
            <Search className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <h3 className="text-lg sm:text-xl font-medium text-foreground">No products found</h3>
            <p className="text-muted-foreground mt-1 text-sm">Try adjusting your search or filters.</p>
            <div className="flex flex-wrap gap-3 justify-center mt-5">
              <Button variant="outline" size="sm" onClick={() => setSearchTerm('')}>Clear Search</Button>
              {hasActiveFilters && <Button variant="outline" size="sm" onClick={clearFilters}>Clear Filters</Button>}
            </div>
          </div>
        ) : (
          // 1-col on mobile, 2-col on sm, 3-col on lg — max 3, never 4
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
            {products.map((product, _cardIdx) => {
              const qty      = product.inventory?.quantity ?? 0;
              const inStock  = qty > 0;
              const lowStock = inStock && qty <= LOW_STOCK_THRESHOLD;
              const hazardInfo  = getHazardInfo(product.unNumber);
              const gradeStyle  = GRADE_COLORS[product.grade] || GRADE_COLORS['Technical'];

              return (
                <div key={product.id}
                  className={`rounded-xl sm:rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col group hover:-translate-y-0.5 cursor-pointer h-full catalog-card-reveal ${
                    isPublic
                      ? 'bg-ink-2 border-white/[0.06] card-tilt'
                      : 'bg-card border-border'
                  }`}
                  onClick={() => {
                    const isDashboard = location.pathname.startsWith('/dashboard');
                    navigate(`${isDashboard ? '/dashboard/catalog' : '/catalog'}/${product.id}`);
                    window.scrollTo(0, 0);
                  }}
                >
                  {/* Image — 4:3 ratio keeps cards from being too tall */}
                  <div className="relative aspect-[4/3] bg-muted overflow-hidden border-b border-border flex items-center justify-center">
                    {product.imageUrls?.length > 0 ? (
                      <img
                        src={product.imageUrls[0]}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <BeakerIcon className="w-10 h-10 sm:w-16 sm:h-16 opacity-40 mb-1" />
                        <span className="text-xs font-medium">No Image</span>
                      </div>
                    )}

                    {/* Top-right: wishlist + stock badge */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1.5 items-end">
                      <button
                        onClick={(e) => handleToggleFavorite(e, product.id)}
                        className="p-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-border shadow-sm hover:scale-110 transition-transform"
                      >
                        <Heart size={14} className={favoriteIds.has(product.id) ? 'fill-red-500 text-red-500' : 'text-slate-500'} />
                      </button>

                      {/* Stock badge — 3 states (solid colors for high contrast overlay) */}
                      {lowStock ? (
                        <span className="inline-flex flex-wrap items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-amber-600 text-white border border-amber-500 shadow-sm">
                          <Package size={10} /> Low Stock
                        </span>
                      ) : inStock ? (
                        <span className="inline-flex flex-wrap items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-emerald-600 text-white border border-emerald-500 shadow-sm">
                          <CheckCircle2 size={10} /> In Stock
                        </span>
                      ) : (
                        <span className="inline-flex flex-wrap items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-rose-600 text-white border border-rose-500 shadow-sm">
                          <XCircle size={10} /> Out of Stock
                        </span>
                      )}
                    </div>

                    {/* Hazard banner */}
                    {hazardInfo && (
                      <div className={`absolute bottom-0 left-0 right-0 px-2 py-1 flex items-center gap-1 text-[10px] sm:text-xs font-semibold ${hazardInfo.bg} border-t border-current/20 backdrop-blur-sm`}>
                        <AlertTriangle size={11} className="shrink-0" />
                        <span className="truncate">UN {product.unNumber} · {hazardInfo.label}</span>
                      </div>
                    )}
                  </div>

                  {/* Card content */}
                  <div className="p-2.5 sm:p-4 flex flex-col flex-1">
                    {/* Chips */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {product.grade && (
                        <span className={`text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-full ${gradeStyle}`}>
                          {product.grade}
                        </span>
                      )}
                      {product.category?.name && (
                        <span className="text-[10px] sm:text-xs font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {product.category.name}
                        </span>
                      )}
                      {product.isMadeInIndia && (
                        <span className="text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                          🇮🇳
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm sm:text-base text-foreground leading-tight line-clamp-2 mb-1" title={product.name}>
                      {product.name}
                    </h3>

                    {/* CAS / purity — single compact row */}
                    <div className="flex flex-wrap gap-1 text-[10px] sm:text-xs mb-2">
                      {product.casNumber && (
                        <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                          CAS {product.casNumber}
                        </span>
                      )}
                      {product.purity && (
                        <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded">
                          {product.purity}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1 hidden sm:block">
                      {product.description || 'No description available.'}
                    </p>

                    {product.datasheetUrl && (
                      <a
                        href={product.datasheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-primary hover:underline mb-2 hidden sm:inline-flex"
                      >
                        <FileText size={11} /> SDS
                      </a>
                    )}

                    {/* Price + add to cart */}
                    <div className="mt-auto pt-2 border-t border-border flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground leading-none mb-0.5 truncate">
                          {product.packageSize ? `${product.packageSize} ${product.baseUnit || product.unit}` : product.unit}
                        </p>
                        <p className="text-base sm:text-xl font-bold text-primary leading-none">
                          ₹{product.price.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!user) { navigate('/login', { state: { from: location } }); return; }
                          addToCart(product, 1);
                        }}
                        disabled={!inStock}
                        className="rounded-xl shadow-sm hover:shadow shrink-0 px-2.5 sm:px-4"
                        size="sm"
                      >
                        <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1.5" />
                        <span className="hidden sm:inline">Add</span>
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

// ─── Helpers ─────────────────────────────────────────────────────────────────
// Compute min/max from loaded products (no useMemo in non-hook context, use plain fn)
function useMemo_safe(products) {
  if (!products || products.length === 0) return null;
  const prices = products.map(p => p.price).filter(Boolean);
  if (!prices.length) return null;
  return {
    min: `₹${Math.min(...prices).toLocaleString('en-IN')}`,
    max: `₹${Math.max(...prices).toLocaleString('en-IN')}`,
  };
}

function FilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
      {label}
      <button onClick={onRemove} className="hover:text-primary/70 transition-colors">
        <X size={11} />
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
