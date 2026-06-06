import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function EmployeeModal({ isOpen, onClose, token, onSuccess }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    role: 'MANAGER',
    department: '',
    jobTitle: '',
    joiningDate: '',
    isActive: true
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/hr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Employee created successfully');
        onSuccess();
      } else {
        toast.error(json.message || 'Failed to create employee');
      }
    } catch (error) {
      toast.error('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Add New Employee
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X size={18} />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">First Name</label>
              <input 
                required
                type="text" 
                value={formData.firstName}
                onChange={e => setFormData({...formData, firstName: e.target.value})}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Last Name</label>
              <input 
                required
                type="text" 
                value={formData.lastName}
                onChange={e => setFormData({...formData, lastName: e.target.value})}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
              <input 
                required
                type="email" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
              <input 
                type="tel" 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Initial Password</label>
            <input 
              required
              type="password" 
              minLength={6}
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-slate-500">Must be at least 6 characters.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">System Role</label>
              <select 
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="OWNER">Owner</option>
                <option value="MANAGER">Manager</option>
                <option value="INVENTORY_MANAGER">Inventory Manager</option>
                <option value="SALES">Sales Rep</option>
                <option value="MARKETING">Marketing</option>
                <option value="DIGITAL_MARKETING">Digital Marketing</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Department</label>
              <input 
                required
                type="text" 
                placeholder="e.g. Sales, Logistics"
                value={formData.department}
                onChange={e => setFormData({...formData, department: e.target.value})}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Job Title</label>
              <input 
                required
                type="text" 
                value={formData.jobTitle}
                onChange={e => setFormData({...formData, jobTitle: e.target.value})}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Joining Date</label>
              <input 
                type="date" 
                value={formData.joiningDate}
                onChange={e => setFormData({...formData, joiningDate: e.target.value})}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="isActive"
              checked={formData.isActive}
              onChange={e => setFormData({...formData, isActive: e.target.checked})}
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Active Employee
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800 mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Employee'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
