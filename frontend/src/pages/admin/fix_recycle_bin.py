import re

path = 'e:\\Internship_Project\\ChemiCrown-cdms\\frontend\\src\\pages\\admin\\RecycleBin.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("import { Trash2, RotateCcw, AlertTriangle, FileText, Search, ShieldAlert, ArrowLeft } from 'lucide-react';", 
"import { Trash2, RotateCcw, AlertTriangle, FileText, Search, ShieldAlert, ArrowLeft } from 'lucide-react';\nimport { SkeletonTableBody } from '@/components/ui/Skeleton';")

replacement = """        {loading ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Entity Type</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Description</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Deleted At</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Deleted By</th>
                  <th className="px-6 py-4 text-right font-semibold text-slate-700 dark:text-slate-300">Actions</th>
                </tr>
              </thead>
              <SkeletonTableBody columns={5} rows={5} />
            </table>
          ) : items.length === 0 ? ("""

content = content.replace("""        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading trash...</div>
        ) : items.length === 0 ? (""", replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
