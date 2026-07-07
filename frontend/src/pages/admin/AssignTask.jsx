import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';

export default function AssignTask() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    assigneeId: '',
    dueDate: ''
  });

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/hr`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setEmployees(data.data);
      })
      .catch(() => toast.error('Failed to load employees'));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.title.trim().length < 5) return toast.error('Title must be at least 5 characters');
    if (form.description.trim().length < 10) return toast.error('Description must be at least 10 characters');
    if (!form.assigneeId) return toast.error('Please select an assignee');

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Task assigned successfully');
        navigate('/dashboard/tasks');
      } else {
        toast.error(json.message || 'Failed to assign task');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1200px] space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-wrap items-center gap-4">
        <Link to="/dashboard/tasks" className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors text-muted-foreground">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assign New Task</h1>
          <p className="text-muted-foreground">Delegate work to an employee</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Task Title *</label>
              <Input 
                value={form.title} 
                onChange={e => setForm({...form, title: e.target.value})} 
                placeholder="e.g. Prepare monthly sales report"
                maxLength={100}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">Min 5 characters, max 100.</p>
            </div>

            <div>
              <label className="text-sm font-semibold mb-1.5 block">Detailed Description *</label>
              <textarea 
                className="w-full text-sm bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px]"
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                placeholder="Provide clear instructions..."
                maxLength={1000}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">Min 10 characters, max 1000.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Assign To *</label>
                <select 
                  className="w-full text-sm bg-background border border-input rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.assigneeId}
                  onChange={e => setForm({...form, assigneeId: e.target.value})}
                  required
                >
                  <option value="">-- Select Employee --</option>
                  {employees.filter(emp => emp.employeeProfile).map(emp => (
                    <option key={emp.id} value={emp.employeeProfile.id}>
                      {emp.firstName} {emp.lastName} ({emp.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold mb-1.5 block">Priority</label>
                <select 
                  className="w-full text-sm bg-background border border-input rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.priority}
                  onChange={e => setForm({...form, priority: e.target.value})}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold mb-1.5 block">Due Date (Optional)</label>
                <Input 
                  type="date" 
                  value={form.dueDate} 
                  onChange={e => setForm({...form, dueDate: e.target.value})} 
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <Button type="submit" disabled={loading} className="w-full sm:w-auto px-8">
              {loading ? 'Assigning...' : <><CheckCircle2 className="w-4 h-4 mr-2" /> Assign Task</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
