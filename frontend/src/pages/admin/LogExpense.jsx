import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Receipt, Plus, Trash2, Save, Building2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';

const EXPENSE_CATS = ['UTILITIES', 'MAINTENANCE', 'RENT', 'MARKETING', 'TRAVEL', 'SALARIES', 'SHIPPING', 'EQUIPMENT', 'TAX', 'INSURANCE', 'OTHER'];
const DEPARTMENTS = ['Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'IT', 'Logistics', 'Other'];

export default function LogExpense() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Start with one empty row
  const [expenses, setExpenses] = useState([{
    id: Date.now().toString(),
    category: 'UTILITIES',
    amount: '',
    department: 'Operations',
    description: '',
    date: new Date().toISOString().substring(0, 10),
    receiptUrl: ''
  }]);

  const addRow = () => {
    setExpenses(prev => [...prev, {
      id: Date.now().toString(),
      category: 'UTILITIES',
      amount: '',
      department: 'Operations',
      description: '',
      date: new Date().toISOString().substring(0, 10),
      receiptUrl: ''
    }]);
  };

  const removeRow = (id) => {
    if (expenses.length === 1) return;
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const updateRow = (id, field, value) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const submitAll = async () => {
    // Validation
    for (const exp of expenses) {
      if (!exp.amount || parseFloat(exp.amount) <= 0) {
        return toast.error('Please enter a valid positive amount for all expenses');
      }
      if (!exp.description.trim()) {
        return toast.error('Please provide a description for all expenses');
      }
      if (!exp.date) {
        return toast.error('Please provide a date for all expenses');
      }
    }

    setLoading(true);
    let successCount = 0;

    try {
      await Promise.all(expenses.map(async (exp) => {
        // Append department to description since backend schema doesn't have a department column
        const finalDescription = `[Dept: ${exp.department}] ${exp.description}`;
        
        const payload = {
          category: exp.category,
          amount: exp.amount,
          description: finalDescription,
          date: exp.date,
          receiptUrl: exp.receiptUrl
        };

        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/finance/expenses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) successCount++;
        else throw new Error(json.message || 'Failed to save expense');
      }));

      toast.success(`Successfully recorded ${successCount} expense${successCount > 1 ? 's' : ''}`);
      navigate('/dashboard/finance?tab=expenses');
    } catch (err) {
      toast.error(err.message || 'Error saving expenses. Some may have failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard/finance?tab=expenses')}
            className="p-2 -ml-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex flex-wrap items-center gap-2">
              <Receipt className="text-primary" size={24} /> Log Expenses
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Record one or multiple expenses simultaneously.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={() => navigate('/dashboard/finance?tab=expenses')}>Cancel</Button>
          <Button onClick={submitAll} disabled={loading} className="gap-2">
            <Save size={16} /> {loading ? 'Saving...' : 'Save All Expenses'}
          </Button>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 overflow-x-auto">
          <table className="w-full text-sm min-w-[1000px]">
            <thead>
              <tr className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-left border-b border-border">
                <th className="pb-3 pr-4 w-40">Date *</th>
                <th className="pb-3 px-4 w-48">Category *</th>
                <th className="pb-3 px-4 w-48">Department *</th>
                <th className="pb-3 px-4">Description *</th>
                <th className="pb-3 px-4 w-36">Amount (₹) *</th>
                <th className="pb-3 px-4 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {expenses.map((exp, index) => (
                <tr key={exp.id} className="group">
                  <td className="py-4 pr-4">
                    <Input type="date" value={exp.date} onChange={e => updateRow(exp.id, 'date', e.target.value)} className="h-9 text-sm" />
                  </td>
                  <td className="py-4 px-4">
                    <select value={exp.category} onChange={e => updateRow(exp.id, 'category', e.target.value)}
                      className="w-full h-9 text-sm bg-background border border-input rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary">
                      {EXPENSE_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className="py-4 px-4">
                    <select value={exp.department} onChange={e => updateRow(exp.id, 'department', e.target.value)}
                      className="w-full h-9 text-sm bg-background border border-input rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary">
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </td>
                  <td className="py-4 px-4">
                    <Input value={exp.description} onChange={e => updateRow(exp.id, 'description', e.target.value)} placeholder="What was this for?" className="h-9 text-sm" />
                  </td>
                  <td className="py-4 px-4">
                    <Input type="number" min="0" step="1" value={exp.amount} onChange={e => updateRow(exp.id, 'amount', e.target.value)} placeholder="0.00" className="h-9 text-sm text-right font-medium" />
                  </td>
                  <td className="py-4 px-2 text-center">
                    <button 
                      onClick={() => removeRow(exp.id)}
                      disabled={expenses.length === 1}
                      className="p-2 rounded-lg text-muted-foreground hover:bg-rose-100 hover:text-rose-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-muted/30 flex justify-between items-center">
          <Button variant="outline" size="sm" onClick={addRow} className="gap-2 border-dashed bg-transparent hover:bg-muted">
            <Plus size={14} /> Add Another Row
          </Button>
          <div className="text-sm">
            Total Amount: <span className="font-bold text-lg ml-2">₹{expenses.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
