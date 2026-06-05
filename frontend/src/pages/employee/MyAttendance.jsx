import { ClipboardCheck, Calendar } from 'lucide-react';

export default function MyAttendance() {
  const currentMonth = "June 2026";
  const records = [
    { date: '2026-06-05', status: 'PRESENT' },
    { date: '2026-06-04', status: 'PRESENT' },
    { date: '2026-06-03', status: 'HALF_DAY' },
    { date: '2026-06-02', status: 'PRESENT' },
    { date: '2026-06-01', status: 'ABSENT' },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <ClipboardCheck className="w-8 h-8 text-primary" /> My Profile & Attendance
        </h1>
        <p className="text-muted-foreground mt-2">View your personal attendance records and salary history.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border p-6 rounded-xl shadow-sm text-center">
          <h3 className="text-muted-foreground font-medium mb-2">Total Present</h3>
          <p className="text-4xl font-bold text-success">18</p>
          <p className="text-xs text-muted-foreground mt-1">Days this month</p>
        </div>
        <div className="bg-card border border-border p-6 rounded-xl shadow-sm text-center">
          <h3 className="text-muted-foreground font-medium mb-2">Total Absent</h3>
          <p className="text-4xl font-bold text-destructive">2</p>
          <p className="text-xs text-muted-foreground mt-1">Days this month</p>
        </div>
        <div className="bg-card border border-border p-6 rounded-xl shadow-sm text-center">
          <h3 className="text-muted-foreground font-medium mb-2">Available Leaves</h3>
          <p className="text-4xl font-bold text-primary">8</p>
          <p className="text-xs text-muted-foreground mt-1">Annual Quota</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden mt-8">
        <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Attendance History ({currentMonth})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground text-xs uppercase font-semibold border-b border-border">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {records.map((rec, i) => (
                <tr key={i} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">{rec.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      rec.status === 'PRESENT' ? 'bg-success/10 text-success' :
                      rec.status === 'ABSENT' ? 'bg-destructive/10 text-destructive' :
                      'bg-warning/10 text-warning'
                    }`}>
                      {rec.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
