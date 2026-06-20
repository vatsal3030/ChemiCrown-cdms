import { useState, useEffect, useRef } from 'react';
import { Search, Clock, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useDebounce from '../../hooks/useDebounce';

export default function NavbarSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();
  const wrapperRef = useRef(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    setHistory(stored);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [wrapperRef]);

  const [searchParams] = useSearchParams();
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const q = searchParams.get('search');
    if (q) setSearchTerm(q);
  }, [searchParams]);

  useEffect(() => {
    if (debouncedSearch && debouncedSearch.length >= 2) {
      fetch(`${import.meta.env.VITE_API_URL}/api/inventory?search=${encodeURIComponent(debouncedSearch)}&limit=5`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setSuggestions(data.data);
          }
        })
        .catch(console.error);
    } else {
      setSuggestions([]);
    }
  }, [debouncedSearch]);

  const handleSearch = (term) => {
    if (!term.trim()) return;
    
    // Save to history
    let newHistory = [term, ...history.filter(h => h !== term)].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    
    setIsFocused(false);
    const isDashboard = location.pathname.startsWith('/dashboard');
    navigate(`${isDashboard ? '/dashboard/catalog' : '/catalog'}?search=${encodeURIComponent(term)}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch(searchTerm);
    }
  };

  const removeFromHistory = (e, term) => {
    e.stopPropagation();
    const newHistory = history.filter(h => h !== term);
    setHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  return (
    <div className="relative hidden sm:block w-72 lg:w-96" ref={wrapperRef}>
      <Search className={`absolute left-3 top-3 h-5 w-5 transition-colors ${isFocused ? 'text-primary' : 'text-slate-400'}`} />
      <Input
        type="search"
        placeholder="Search catalog, CAS number..."
        className="w-full pl-10 pr-4 py-5 text-base bg-slate-100/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus-visible:bg-white dark:focus-visible:bg-slate-900 rounded-xl transition-all shadow-sm focus-visible:ring-primary/50"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onKeyDown={handleKeyDown}
      />
      
      {(isFocused && (history.length > 0 || suggestions.length > 0)) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
          
          {suggestions.length > 0 && (
            <>
              <div className="p-2 border-b border-border bg-muted/50">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">Suggestions</span>
              </div>
              <ul className="max-h-64 overflow-y-auto p-1">
                {suggestions.map((product) => (
                  <li 
                    key={product.id} 
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    onClick={() => {
                      setIsFocused(false);
                      const isDashboard = location.pathname.startsWith('/dashboard');
                      navigate(`${isDashboard ? '/dashboard/catalog' : '/catalog'}/${product.id}`);
                    }}
                  >
                    <Search className="w-4 h-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{product.name}</p>
                      {product.casNumber && <p className="text-xs text-slate-500">CAS: {product.casNumber}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          {history.length > 0 && (
            <>
              <div className="p-2 border-t border-b border-border bg-muted/50">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">Recent Searches</span>
              </div>
              <ul className="max-h-64 overflow-y-auto p-1">
                {history.map((term, i) => (
                  <li 
                    key={i} 
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer group transition-colors"
                    onClick={() => handleSearch(term)}
                  >
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium">{term}</span>
                    </div>
                    <button 
                      onClick={(e) => removeFromHistory(e, term)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
