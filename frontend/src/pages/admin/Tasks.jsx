import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckSquare, Plus, Trash2, Clock, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Tasks() {
  const { user, token } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', assignedToId: '' });

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTasks(data.data);
      }
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/hr`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setEmployees(data.data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchTasks();
    if (['SUPER_ADMIN', 'OWNER', 'MANAGER', 'HR'].includes(user?.role)) {
      fetchEmployees();
    }
  }, [token, user?.role]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Task assigned successfully');
        setIsModalOpen(false);
        setFormData({ title: '', description: '', assignedToId: '' });
        fetchTasks();
      } else {
        toast.error(data.error || 'Failed to create task');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Status updated');
        fetchTasks();
      } else {
        toast.error(data.error || 'Failed to update status');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Task deleted');
        fetchTasks();
      } else {
        toast.error(data.error || 'Failed to delete task');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const getStatusColor = (status) => {
    if (status === 'COMPLETED') return 'bg-green-100 text-green-700';
    if (status === 'IN_PROGRESS') return 'bg-blue-100 text-blue-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CheckSquare className="text-primary" size={28} /> Tasks
          </h1>
          <p className="text-muted-foreground mt-1">Manage and track work assignments.</p>
        </div>
        {['SUPER_ADMIN', 'OWNER', 'MANAGER', 'HR'].includes(user?.role) && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={18} className="mr-2" /> Assign Task
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['PENDING', 'IN_PROGRESS', 'COMPLETED'].map(status => (
          <div key={status} className="bg-card border border-border rounded-xl shadow-sm p-4">
            <h3 className="font-semibold text-lg text-foreground mb-4 flex justify-between items-center pb-2 border-b border-border">
              {status.replace('_', ' ')}
              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(status)}`}>
                {tasks.filter(t => t.status === status).length}
              </span>
            </h3>
            <div className="space-y-4">
              {tasks.filter(t => t.status === status).map(task => (
                <div key={task.id} className="bg-background border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <h4 className="font-semibold text-foreground mb-1">{task.title}</h4>
                  {task.description && <p className="text-sm text-muted-foreground mb-3">{task.description}</p>}
                  
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                    <div className="flex items-center gap-1">
                      <UserIcon size={14} /> 
                      {task.assignedToId === user.id ? 'You' : `${task.assignedTo.user.firstName} ${task.assignedTo.user.lastName}`}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      {new Date(task.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-border">
                    <select 
                      className="text-xs bg-slate-100 dark:bg-slate-800 border-none rounded p-1 text-slate-700 dark:text-slate-300"
                      value={task.status}
                      onChange={(e) => updateStatus(task.id, e.target.value)}
                    >
                      <option value="PENDING">Pending</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                    </select>

                    {['SUPER_ADMIN', 'OWNER', 'MANAGER', 'HR'].includes(user?.role) && (
                      <button onClick={() => handleDelete(task.id)} className="text-red-500 hover:text-red-700 p-1">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {tasks.filter(t => t.status === status).length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">No tasks.</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-xl shadow-lg border border-border p-6 animate-in zoom-in-95">
            <h2 className="text-xl font-bold mb-4">Assign New Task</h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <Input 
                  required 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. Audit Stock Level"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                <textarea 
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Task details..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Assign To</label>
                <select
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.assignedToId}
                  onChange={e => setFormData({...formData, assignedToId: e.target.value})}
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.employeeProfile?.id || emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.role})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit">Assign Task</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
