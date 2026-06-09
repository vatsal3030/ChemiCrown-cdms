import { useState } from 'react';
import { Bug, AlertTriangle, Lightbulb, Database, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const TYPES = [
  { value: 'BUG',             label: 'Bug Report',      icon: Bug,           color: 'text-red-600 bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-800',       desc: 'Something is broken or not working' },
  { value: 'FEATURE_REQUEST', label: 'Feature Request', icon: Lightbulb,     color: 'text-blue-600 bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-800', desc: 'Suggest a new feature or improvement' },
  { value: 'DATA_ISSUE',      label: 'Data Issue',      icon: Database,      color: 'text-amber-600 bg-amber-50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-800', desc: 'Incorrect or missing data' },
  { value: 'OTHER',           label: 'Other',           icon: AlertTriangle, color: 'text-purple-600 bg-purple-50 border-purple-300 dark:bg-purple-900/20 dark:border-purple-800', desc: 'Anything else' },
];

const PRIORITIES = [
  { value: 'LOW',      style: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' },
  { value: 'MEDIUM',   style: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700' },
  { value: 'HIGH',     style: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700' },
  { value: 'CRITICAL', style: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700' },
];

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
      <div className="max-w-5xl mx-auto mt-12 text-center space-y-4 animate-in zoom-in-95 duration-500">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
          <CheckCircle2 size={32} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Issue Reported!</h1>
        <p className="text-sm text-muted-foreground">Our team will review it and get back to you shortly. Track your tickets in the Support section.</p>
        <div className="flex justify-center gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={() => { setSubmitted(false); setForm({ type: 'BUG', priority: 'MEDIUM', title: '', description: '' }); }}>
            Report Another
          </Button>
          <Button size="sm" onClick={() => window.location.href = '/dashboard/support'}>
            Go to Support
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Report an Issue</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Found a bug or have a suggestion? Let us know and we'll address it promptly.</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Two-column layout on desktop: left = type+priority, right = fields */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">

          {/* ── Left panel: Issue Type + Priority ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Issue Type */}
            <div className="form-card">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Issue Type</h2>
              <div className="grid grid-cols-2 gap-2">
                {TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, type: t.value }))}
                    className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col items-start gap-1.5 ${
                      form.type === t.value
                        ? t.color + ' scale-[1.02] shadow-sm'
                        : 'bg-muted/30 border-border hover:border-primary/40 hover:bg-muted/60'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${form.type === t.value ? 'bg-white/50 dark:bg-black/20' : 'bg-muted'}`}>
                      <t.icon size={15} className={form.type === t.value ? '' : 'text-muted-foreground'} />
                    </div>
                    <p className="font-semibold text-xs leading-tight">{t.label}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div className="form-card">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Priority Level</h2>
              <div className="grid grid-cols-2 gap-2">
                {PRIORITIES.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, priority: p.value }))}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                      form.priority === p.value
                        ? p.style + ' border-current scale-[1.03] shadow-sm'
                        : 'bg-muted/30 border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    }`}
                  >
                    {p.value}
                  </button>
                ))}
              </div>

              {/* Critical warning */}
              {form.priority === 'CRITICAL' && (
                <div className="mt-3 bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800 rounded-xl p-3 flex items-start gap-2 animate-in slide-in-from-bottom-2">
                  <AlertTriangle size={14} className="text-red-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 dark:text-red-400">
                    <strong>Critical</strong> means the system is unusable or there is a data breach. All admins will be notified immediately.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Right panel: Title + Description + Submit ── */}
          <div className="lg:col-span-3 form-card flex flex-col gap-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Issue Details</h2>

            {/* Title */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Issue Title <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Brief summary of the issue..."
                required
                maxLength={120}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
              />
              <p className="text-[10px] text-muted-foreground mt-1 text-right">{form.title.length}/120</p>
            </div>

            {/* Description */}
            <div className="flex-1">
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Detailed Description <span className="text-destructive">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe the issue in detail. Include steps to reproduce if it's a bug. The more detail you provide, the faster we can resolve it."
                required
                rows={8}
                maxLength={2000}
                className="w-full text-sm bg-background border border-input rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary resize-y min-h-[200px]"
              />
              <p className="text-[10px] text-muted-foreground mt-1 text-right">{form.description.length}/2000</p>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-between flex-wrap gap-3 pt-1 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Selected: <span className="font-semibold text-foreground">{form.type.replace(/_/g, ' ')}</span> · <span className="font-semibold text-foreground">{form.priority}</span> priority
              </p>
              <Button type="submit" disabled={submitting}>
                <Send size={14} className="mr-2" />
                {submitting ? 'Submitting…' : 'Submit Report'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
