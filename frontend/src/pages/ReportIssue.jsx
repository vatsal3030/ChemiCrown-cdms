import { useState } from 'react';
import { Bug, AlertTriangle, Lightbulb, Database, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const TYPES = [
  { value: 'BUG', label: 'Bug Report', icon: Bug, color: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800', desc: 'Something is broken or not working as expected' },
  { value: 'FEATURE_REQUEST', label: 'Feature Request', icon: Lightbulb, color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800', desc: 'Suggest a new feature or improvement' },
  { value: 'DATA_ISSUE', label: 'Data Issue', icon: Database, color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800', desc: 'Incorrect data, missing information, or sync problem' },
  { value: 'OTHER', label: 'Other', icon: AlertTriangle, color: 'text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800', desc: 'Something that doesn\'t fit the other categories' },
];

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const PRIORITY_STYLES = {
  LOW: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  MEDIUM: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
  CRITICAL: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
};

export default function ReportIssue() {
  const { token } = useAuth();
  const [form, setForm] = useState({ type: 'BUG', priority: 'MEDIUM', title: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error('Title and description are required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const json = await res.json();
      if (json.success) {
        setSubmitted(true);
      } else {
        toast.error(json.message || 'Failed to submit');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto mt-20 text-center space-y-4 animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
          <CheckCircle2 size={40} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Issue Reported!</h1>
        <p className="text-slate-500">Thank you for your report. Our team will review it and get back to you shortly. You can track your tickets in the Support section.</p>
        <div className="flex justify-center gap-3 pt-4">
          <Button variant="outline" onClick={() => { setSubmitted(false); setForm({ type: 'BUG', priority: 'MEDIUM', title: '', description: '' }); }}>
            Report Another
          </Button>
          <Button onClick={() => window.location.href = '/dashboard/support'}>
            Go to Support
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Standardized Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Report an Issue</h1>
          <p className="text-slate-500 mt-1">Found a bug or have a suggestion? Let us know and we'll address it promptly.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden p-6 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Issue Type */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Issue Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: t.value }))}
                  className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col items-start ${
                    form.type === t.value ? t.color + ' border-2 scale-[1.02] shadow-sm' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-primary/40'
                  }`}
                >
                  <div className={`p-2 rounded-lg mb-3 ${form.type === t.value ? 'bg-white/50 dark:bg-black/20' : 'bg-slate-200 dark:bg-slate-800'}`}>
                    <t.icon size={20} className={form.type === t.value ? '' : 'text-slate-500 dark:text-slate-400'} />
                  </div>
                  <p className="font-semibold text-sm">{t.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-slate-200 dark:bg-slate-800 w-full" />

          {/* Priority & Details */}
          <div className="space-y-5">
            <div>
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground block mb-3">Priority Level</label>
              <div className="flex gap-2 flex-wrap">
                {PRIORITIES.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, priority: p }))}
                    className={`px-5 py-2 rounded-lg border text-xs font-bold transition-all ${
                      form.priority === p ? PRIORITY_STYLES[p] + ' border-current scale-105 shadow-sm' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-primary/40 hover:text-foreground'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground block mb-2">Issue Title <span className="text-red-500">*</span></label>
              <Input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Brief summary of the issue..."
                required
                maxLength={120}
              />
              <p className="text-xs text-slate-400 mt-1.5 text-right">{form.title.length}/120 characters</p>
            </div>

            <div>
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground block mb-2">Detailed Description <span className="text-red-500">*</span></label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe the issue in detail. Include steps to reproduce if it's a bug. The more detail you provide, the faster we can resolve it."
                required
                rows={6}
                className="w-full text-sm bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-y"
              />
            </div>
          </div>

          {/* Priority Warning */}
          {form.priority === 'CRITICAL' && (
            <div className="bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800 rounded-xl p-4 flex items-start gap-3 animate-in slide-in-from-bottom-2">
              <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">
                <strong>Critical priority</strong> means the system is unusable or there is a major data breach. Your submission will immediately notify all admins. Please use this only for genuine emergencies.
              </p>
            </div>
          )}

          <div className="pt-2">
            <Button type="submit" disabled={submitting} className="w-full sm:w-auto" size="lg">
              <Send size={16} className="mr-2" />
              {submitting ? 'Submitting Report...' : 'Submit Issue Report'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
