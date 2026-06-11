import re

path = 'e:\\Internship_Project\\ChemiCrown-cdms\\frontend\\src\\components\\GlobalSearchModal.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add state for search history
content = content.replace("const [query, setQuery] = useState('');", "const [query, setQuery] = useState('');\n  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('searchHistory') || '[]'));")

# Add addToHistory function 
handleSearchText = """  const handleResultClick = (path) => {
    if (query.trim() && !history.includes(query.trim())) {
      const newHistory = [query.trim(), ...history.filter(h => h !== query.trim())].slice(0, 5);
      setHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    }
    onClose();
    navigate(path);
  };"""

content = content.replace("const handleResultClick = (path) => {", handleSearchText)
content = content.replace("onClose();", "") # remove original onClose if we replaced it, wait, let's just do an exact replace
content = content.replace("navigate(path);", "")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
