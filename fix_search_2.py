import re

path = 'e:\\Internship_Project\\ChemiCrown-cdms\\frontend\\src\\components\\GlobalSearchModal.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add handleResultClick definition
handleSearchText = """  const handleResultClick = (path) => {
    if (query.trim() && !history.includes(query.trim())) {
      const newHistory = [query.trim(), ...history.filter(h => h !== query.trim())].slice(0, 5);
      setHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    }
    onClose();
    navigate(path);
  };
"""
# Insert before fetchResults definition or anywhere inside the component
content = content.replace("  useEffect(() => {", handleSearchText + "\  useEffect(() => {", 1)

# replace navigate calls
content = content.replace("onClick={() => { navigate(p.path);  }}", "onClick={() => handleResultClick(p.path)}")
content = content.replace("onClick={() => { navigate(/dashboard/inventory/product/);  }}", "onClick={() => handleResultClick(/dashboard/inventory/product/)}")
content = content.replace("onClick={() => { navigate(/dashboard/orders/);  }}", "onClick={() => handleResultClick(/dashboard/orders/)}")
content = content.replace("onClick={() => { navigate(/dashboard/hr/employee/);  }}", "onClick={() => handleResultClick(/dashboard/hr/employee/)}")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
