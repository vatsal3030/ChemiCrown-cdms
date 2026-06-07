import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CheckSquare, Plus, Trash2, GripVertical,
  X, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

const COLUMNS = [
  { id: 'PENDING',     label: 'Pending',     color: 'bg-amber-500',  badge: 'badge-warning' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-500',   badge: 'badge-info' },
  { id: 'COMPLETED',   label: 'Completed',   color: 'bg-emerald-500',badge: 'badge-success' },
];

function TaskCard({ task, user, onDelete, onView, dragging, dragHandleProps }) {
  const assigneeName = task.assignedTo?.user
    ? `${task.assignedTo.user.firstName} ${task.assignedTo.user.lastName}`
    : 'Unassigned';

  return (
    <div
      className={`bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group ${dragging ? 'opacity-50 ring-2 ring-primary scale-95' : 'hover:-translate-y-0.5'}`}
      onClick={() => onView(task)}
    >
      <div className="flex items-start gap-2">
        <div
          {...dragHandleProps}
          className="mt-0.5 shrink-0 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing"
          onClick={e => e.stopPropagation()}
        >
          <GripVertical size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm leading-snug group-hover:text-primary transition-colors">{task.title}</p>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
          )}
        </div>
        {['SUPER_ADMIN', 'OWNER', 'MANAGER'].includes(user?.role) && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(task.id); }}
            className="shrink-0 p-1 rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] uppercase">
            {task.assignedTo?.user?.firstName?.[0] || '?'}
          </div>
          <span className="truncate max-w-[100px]">{assigneeName}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar size={11} />
          {new Date(task.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </div>
      </div>
    </div>
  );
}

function TaskDetailModal({ task, onClose, onStatusChange }) {
  if (!task) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border p-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Task Details</p>
            <h2 className="text-xl font-bold text-foreground">{task.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        {task.description && (
          <div className="bg-muted/60 rounded-xl p-4 mb-4">
            <p className="text-sm text-foreground">{task.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="form-card p-3!">
            <p className="text-xs text-muted-foreground mb-1">Assigned To</p>
            <p className="text-sm font-semibold text-foreground">
              {task.assignedTo?.user ? `${task.assignedTo.user.firstName} ${task.assignedTo.user.lastName}` : 'Unassigned'}
            </p>
          </div>
          <div className="form-card p-3!">
            <p className="text-xs text-muted-foreground mb-1">Assigned By</p>
            <p className="text-sm font-semibold text-foreground">
              {task.assignedBy ? `${task.assignedBy.firstName} ${task.assignedBy.lastName}` : 'Unknown'}
            </p>
          </div>
          <div className="form-card p-3!">
            <p className="text-xs text-muted-foreground mb-1">Created</p>
            <p className="text-sm font-semibold text-foreground">{new Date(task.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="form-card p-3!">
            <p className="text-xs text-muted-foreground mb-1">Status</p>
            <select
              className="text-sm font-semibold bg-transparent text-foreground border-0 p-0 focus:outline-none cursor-pointer"
              value={task.status}
              onChange={e => onStatusChange(task.id, e.target.value)}
            >
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Tasks() {
  const { user, token } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', assignedToId: '' });
  const [submitting, setSubmitting] = useState(false);

  // Drag state
  const [draggingId, setDraggingId] = useState(null);
  const dragOverColumn = useRef(null);

  const canManage = ['SUPER_ADMIN', 'OWNER', 'MANAGER'].includes(user?.role);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setTasks(data.data);
    } catch (err) { console.error(err); toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/hr`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setEmployees(data.data);
    } catch (err) { console.error('Fetch employees error', err); }
  };

  useEffect(() => {
    fetchTasks();
    if (canManage) fetchEmployees();
  }, [token]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.assignedToId) return toast.error('Title and assignee are required');
    try {
      setSubmitting(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Task assigned!');
        setIsModalOpen(false);
        setFormData({ title: '', description: '', assignedToId: '' });
        fetchTasks();
      } else toast.error(data.error || 'Failed to create task');
    } catch (err) { console.error(err); toast.error('Network error'); }
    finally { setSubmitting(false); }
  };

  const updateStatus = async (id, status) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    if (viewingTask?.id === id) setViewingTask(prev => ({ ...prev, status }));
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!data.success) { toast.error('Failed to update status'); fetchTasks(); }
    } catch (err) { console.error(err); toast.error('Network error'); fetchTasks(); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) toast.success('Task deleted');
      else { toast.error('Failed to delete'); fetchTasks(); }
    } catch (err) { console.error(err); toast.error('Network error'); fetchTasks(); }
  };

  // Drag handlers
  const handleDragStart = (e, taskId) => {
    setDraggingId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragEnd = () => setDraggingId(null);
  const handleDragOver = (e, colId) => {
    e.preventDefault();
    dragOverColumn.current = colId;
    e.dataTransfer.dropEffect = 'move';
  };
  const handleDrop = (e, colId) => {
    e.preventDefault();
    if (draggingId && colId) updateStatus(draggingId, colId);
    setDraggingId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <div className="page-header-icon bg-primary/10 text-primary">
            <CheckSquare size={22} />
          </div>
          <div>
            <h1 className="page-title">Tasks</h1>
            <p className="page-subtitle">Drag cards between columns to update status.</p>
          </div>
        </div>
        {canManage && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={16} className="mr-2" /> Assign Task
          </Button>
        )}
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COLUMNS.map(c => (
            <div key={c.id} className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <div className="h-6 w-24 bg-muted rounded-lg animate-pulse" />
              {[1,2].map(i => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id);
            return (
              <div
                key={col.id}
                className="bg-muted/40 rounded-2xl border border-border min-h-[400px] flex flex-col"
                onDragOver={e => handleDragOver(e, col.id)}
                onDrop={e => handleDrop(e, col.id)}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                    <span className="font-bold text-sm text-foreground">{col.label}</span>
                  </div>
                  <span className={`badge ${col.badge}`}>{colTasks.length}</span>
                </div>

                {/* Tasks */}
                <div className="p-3 space-y-3 flex-1">
                  {colTasks.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-sm opacity-60">
                      <CheckSquare size={28} className="mx-auto mb-2 opacity-30" />
                      Drop tasks here
                    </div>
                  ) : colTasks.map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={e => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                    >
                      <TaskCard
                        task={task}
                        user={user}
                        onDelete={handleDelete}
                        onStatusChange={updateStatus}
                        onView={setViewingTask}
                        dragging={draggingId === task.id}
                        dragHandleProps={{}}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Detail Modal */}
      {viewingTask && (
        <TaskDetailModal
          task={viewingTask}
          onClose={() => setViewingTask(null)}
          onStatusChange={updateStatus}
        />
      )}

      {/* Assign Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">Assign New Task</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-muted transition-colors">
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="form-label">Task Title *</label>
                <Input
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Audit Stock Level"
                />
              </div>
              <div>
                <label className="form-label">Description (Optional)</label>
                <textarea
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the task..."
                />
              </div>
              <div>
                <label className="form-label">Assign To *</label>
                <select
                  required
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.assignedToId}
                  onChange={e => setFormData({ ...formData, assignedToId: e.target.value })}
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.employeeProfile?.id}>
                      {emp.firstName} {emp.lastName} — {emp.role.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? 'Assigning...' : 'Assign Task'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
