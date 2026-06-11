import re

path = 'e:\\Internship_Project\\ChemiCrown-cdms\\frontend\\src\\pages\\admin\\Finance.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add ledgerSearch state
content = content.replace("const [showFilters, setShowFilters] = useState(false);", "const [showFilters, setShowFilters] = useState(false);\n  const [ledgerSearch, setLedgerSearch] = useState('');")

# Add Input to Ledger Tab
input_html = """              <div className="flex gap-2 flex-wrap items-center">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input 
                    type="text" 
                    placeholder="Search description or category..." 
                    value={ledgerSearch}
                    onChange={(e) => setLedgerSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              </div>"""

content = content.replace("""              <div className="flex gap-2 flex-wrap">
                {/* Filters are now inside Advanced Filters globally */}
              </div>""", input_html)

# Filter ledger.map
content = content.replace(""") : ledger.map(entry => (""", """) : ledger.filter(entry => !ledgerSearch || entry.description.toLowerCase().includes(ledgerSearch.toLowerCase()) || entry.category.toLowerCase().includes(ledgerSearch.toLowerCase())).map(entry => (""")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
