import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CheckSquare, Plus, Trash2, GripVertical,
  X, Calendar, Search, Filter
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-3 pt-3 border-t border-border">
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] uppercase">
            {task.assignedTo?.user?.firstName?.[0] || '?'}
          </div>
          <span className="truncate max-w-[100px]">{assigneeName}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
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
      <div className="bg-card w-full max-w-4xl rounded-2xl shadow-2xl border border-border p-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
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
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-driven filters
  const searchQ      = searchParams.get('q')        || '';
  const assigneeFilter = searchParams.get('assignee') || 'all';

  const setParam = (key, value) => {
    setSearchParams(prev => {
      if (!value || value === 'all') prev.delete(key);
      else prev.set(key, value);
      return prev;
    }, { replace: true });
  };

  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

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



  useEffect(() => {
    fetchTasks();
  }, [token]);

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

  // Filtered tasks based on URL params
  const filteredTasks = tasks.filter(t => {
    const title = (t.title || '').toLowerCase();
    const assigneeName = `${t.assignedTo?.user?.firstName || ''} ${t.assignedTo?.user?.lastName || ''}`.toLowerCase();
    const matchQ = !searchQ || title.includes(searchQ.toLowerCase()) || assigneeName.includes(searchQ.toLowerCase());
    const matchAssignee = assigneeFilter === 'all' || t.assignedTo?.user?.id === assigneeFilter || t.assignedTo?.id === assigneeFilter;
    return matchQ && matchAssignee;
  });

  // Unique assignees for filter dropdown
  const uniqueAssignees = [...new Map(tasks.map(t => [
    t.assignedTo?.user?.id,
    { id: t.assignedTo?.user?.id || t.assignedTo?.id, name: `${t.assignedTo?.user?.firstName || ''} ${t.assignedTo?.user?.lastName || ''}`.trim() }
  ]).filter(([id]) => !!id)).values()];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="page-header mb-0">
          <div className="page-header-icon bg-primary/10 text-primary">
            <CheckSquare size={22} />
          </div>
          <div>
            <h1 className="page-title">Tasks</h1>
            <p className="page-subtitle">Drag cards between columns to update status.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQ}
              onChange={e => setParam('q', e.target.value)}
              className="pl-9 w-48 h-9 text-sm"
            />
          </div>
          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-sm border transition-all h-9 ${
              assigneeFilter !== 'all'
                ? 'bg-primary text-white border-primary'
                : 'bg-background border-border hover:border-primary text-foreground'
            }`}
          >
            <Filter size={14} /> Filters
            {assigneeFilter !== 'all' && <span className="bg-white/30 text-white text-xs rounded-full px-1.5 py-0.5">1</span>}
          </button>
          {canManage && (
            <Button onClick={() => navigate('/dashboard/tasks/assign')} className="h-9">
              <Plus size={16} className="mr-2" /> Assign Task
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="border border-border bg-card rounded-xl px-6 py-4 flex flex-wrap gap-4 items-end shadow-sm">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Assignee</label>
            <select
              value={assigneeFilter}
              onChange={e => setParam('assignee', e.target.value)}
              className="w-full sm:w-48 text-sm bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              <option value="all">All Assignees</option>
              {uniqueAssignees.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          {(searchQ || assigneeFilter !== 'all') && (
            <button
              onClick={() => { setParam('q', ''); setParam('assignee', 'all'); setShowFilters(false); }}
              className="px-3 py-2 rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

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
            const colTasks = filteredTasks.filter(t => t.status === col.id);
            const totalColTasks = tasks.filter(t => t.status === col.id).length;
            return (
              <div
                key={col.id}
                className="bg-muted/40 rounded-2xl border border-border min-h-[400px] flex flex-col"
                onDragOver={e => handleDragOver(e, col.id)}
                onDrop={e => handleDrop(e, col.id)}
              >
                {/* Column Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 py-3 border-b border-border">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                    <span className="font-bold text-sm text-foreground">{col.label}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`badge ${col.badge}`}>{colTasks.length}</span>
                    {colTasks.length !== totalColTasks && (
                      <span className="text-xs text-muted-foreground">of {totalColTasks}</span>
                    )}
                  </div>
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
                        onView={(t) => navigate(`/dashboard/tasks/${t.id}`)}
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
    </div>
  );
}
