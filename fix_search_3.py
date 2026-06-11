import re

path = 'e:\\Internship_Project\\ChemiCrown-cdms\\frontend\\src\\components\\GlobalSearchModal.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

history_html = """        {query.trim() === '' && history.length > 0 && (
          <div className="p-4 border-b border-border">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent Searches</h3>
            <div className="flex flex-wrap gap-2">
              {history.map(h => (
                <button 
                  key={h} 
                  onClick={() => setQuery(h)}
                  className="px-3 py-1 bg-muted/50 hover:bg-muted text-sm text-foreground rounded-full transition-colors flex items-center gap-1"
                >
                  <Search className="w-3 h-3 text-muted-foreground" /> {h}
                </button>
              ))}
            </div>
          </div>
        )}"""

content = content.replace("        {/* Results Area */}", history_html + "\n        {/* Results Area */}")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
