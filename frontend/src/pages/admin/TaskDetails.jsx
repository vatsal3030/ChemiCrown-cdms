import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { ArrowLeft, Clock, Calendar, CheckSquare, Edit, AlertCircle, X, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function TaskDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const fetcher = async (url) => {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json;
  };

  const { data, error, mutate } = useSWR(
    token ? `${import.meta.env.VITE_API_URL}/api/tasks/${id}` : null,
    fetcher
  );

  const task = data?.data;
  const loading = !data && !error;

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Task status updated');
        mutate();
      } else {
        toast.error(json.error || 'Failed to update status');
      }
    } catch {
      toast.error('Network error');
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-3xl mx-auto space-y-6 animate-pulse">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="p-8 text-center text-slate-500">
        <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2">Task Not Found</h2>
        <p className="mb-4">This task may have been deleted or you don't have permission to view it.</p>
        <Button onClick={() => navigate('/dashboard/tasks')}>Back to Tasks</Button>
      </div>
    );
  }

  const isAssignee = task.assignedTo?.userId === user?.id;
  const isAdmin = ['SUPER_ADMIN', 'OWNER', 'MANAGER'].includes(user?.role);
  const canEdit = isAssignee || isAdmin;

  const STATUS_COLORS = {
    PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1200px] pb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard/tasks')}
            className="p-2 -ml-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Task Details</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${STATUS_COLORS[task.status]}`}>
            {task.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-foreground mb-4">{task.title}</h2>
        
        {task.description && (
          <div className="bg-muted/40 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Description</h3>
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{task.description}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-border bg-background flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <User size={18} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Assigned To</p>
              <p className="text-sm font-semibold text-foreground">
                {task.assignedTo?.user ? `${task.assignedTo.user.firstName} ${task.assignedTo.user.lastName}` : 'Unassigned'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-background flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Assigned By</p>
              <p className="text-sm font-semibold text-foreground">
                {task.assignedBy ? `${task.assignedBy.firstName} ${task.assignedBy.lastName}` : 'System'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-background flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 shrink-0">
              <Calendar size={18} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Created On</p>
              <p className="text-sm font-semibold text-foreground">
                {new Date(task.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          {task.dueDate && (
            <div className="p-4 rounded-xl border border-border bg-background flex items-start gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600 shrink-0">
                <Clock size={18} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Due Date</p>
                <p className="text-sm font-semibold text-foreground">
                  {new Date(task.dueDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          )}
        </div>

        {canEdit && (
          <div className="mt-8 pt-6 border-t border-border">
            <h3 className="text-sm font-semibold text-foreground mb-3">Update Status</h3>
            <div className="flex flex-wrap items-center gap-3">
              {['PENDING', 'IN_PROGRESS', 'COMPLETED'].map(s => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                    task.status === s 
                      ? 'bg-primary text-primary-foreground border-primary shadow-md' 
                      : 'bg-background hover:bg-muted border-input text-foreground'
                  }`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
