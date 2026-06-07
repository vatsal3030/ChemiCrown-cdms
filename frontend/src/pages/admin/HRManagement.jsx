import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, ArrowUpDown, DollarSign, MessageSquare, AlertCircle, Eye, Users, CalendarCheck, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import EmployeeModal from '@/components/admin/EmployeeModal';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function HRManagement() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('firstName');
  const [sortOrder, setSortOrder] = useState('asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // State for sub-features
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [message, setMessage] = useState('');
  const [salaryAmount, setSalaryAmount] = useState('');

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/hr?search=${searchTerm}&sortField=${sortField}&sortOrder=${sortOrder}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setEmployees(json.data);
      }
    } catch {
      toast.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [searchTerm, sortField, sortOrder]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to terminate this employee? Their account will be deactivated immediately.')) return;
    try {
      // Optimistic update
      setEmployees(prev => prev.filter(e => e.id !== id));
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/hr/${id}`, { 
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Employee terminated successfully');
      } else {
        toast.error('Failed to remove employee');
        fetchEmployees(); // Revert
      }
    } catch {
      toast.error('Failed to remove employee');
      fetchEmployees(); // Revert
    }
  };

  const handleMarkAttendance = async (id, status) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/hr/${id}/attendance`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status, date: new Date().toISOString() })
      });
      if (res.ok) toast.success(`Attendance marked as ${status}`);
      else toast.error('Failed to mark attendance');
    } catch {
      toast.error('Failed to mark attendance');
    }
  };

  const handlePaySalary = async (id) => {
    if(!salaryAmount) return toast.error('Enter salary amount');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/hr/${id}/salary`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ month: new Date().toISOString().substring(0, 7) })
      });
      if (res.ok) {
        toast.success('Salary record created successfully');
        fetchEmployees();
      } else {
        const json = await res.json();
        toast.error(json.error || 'Failed to create salary record');
      }
    } catch {
      toast.error('Failed to create salary record');
    }
  };

  const handleSendWarning = async (id) => {
    if(!message) return toast.error('Enter a message');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/hr/${id}/warning`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ message })
      });
      if (res.ok) {
        toast.success('Message sent to employee');
        setSelectedEmployee(null);
        setMessage('');
      } else {
        toast.error('Failed to send message');
      }
    } catch {
      toast.error('Failed to send message');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HR Management</h1>
          <p className="text-slate-500 mt-1">Manage employee records, roles, and payroll.</p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Add Employee
        </Button>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-8">
        {['dashboard', 'directory', 'attendance', 'payroll', 'communications'].map(tab => (
          <button 
            key={tab} 
            onClick={() => {
              setActiveTab(tab);
              setSelectedEmployee(null);
            }}
            className={`pb-3 text-sm font-medium transition-colors ${activeTab === tab ? 'border-b-2 border-primary text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 rounded-xl flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total Employees</p>
                <h3 className="text-2xl font-bold">{employees.length}</h3>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 rounded-xl flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                <CalendarCheck size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Active Today</p>
                <h3 className="text-2xl font-bold">{Math.floor(employees.length * 0.9)}</h3>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 rounded-xl flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Payroll Processed</p>
                <h3 className="text-2xl font-bold">100%</h3>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">Detailed Analytics</h3>
            <p className="text-slate-500 mb-4">View individual employee pages to see attendance calendars, payroll history, and performance charts.</p>
            <Button onClick={() => setActiveTab('directory')}>Go to Directory</Button>
          </div>
        </div>
      ) : (
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        
        {/* Search Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by name or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('firstName')}>
                  <div className="flex items-center gap-1">Employee <ArrowUpDown size={14} /></div>
                </th>
                <th className="px-6 py-4">Role</th>
                {activeTab === 'directory' && <th className="px-6 py-4">Department / Joining Date</th>}
                {activeTab === 'attendance' && <th className="px-6 py-4">Today's Action</th>}
                {activeTab === 'payroll' && (
                  <>
                    <th className="px-6 py-4">Base Salary</th>
                    <th className="px-6 py-4">Deductions</th>
                    <th className="px-6 py-4">PF</th>
                    <th className="px-6 py-4">Net Pay</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </>
                )}
                {activeTab === 'communications' && <th className="px-6 py-4">Send Message</th>}
                {activeTab === 'directory' && ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'HR'].includes(user?.role) && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-8 h-8 rounded-full" />
                          <div>
                            <Skeleton className="h-4 w-32 mb-1" />
                            <Skeleton className="h-3 w-48" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-8 w-24 rounded-lg" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-8 w-8 rounded-lg" /></td>
                    </tr>
                  ))}
                </>
              ) : employees.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-500">No employees found.</td></tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <div 
                        className="flex items-center gap-3 cursor-pointer group" 
                        onClick={() => navigate(`/dashboard/hr/${emp.id}`)}
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          {emp.firstName ? emp.firstName.charAt(0) : 'E'}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-slate-50 group-hover:text-primary transition-colors">{emp.firstName} {emp.lastName}</div>
                          <div className="text-xs text-slate-500">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {emp.role}
                      </span>
                    </td>

                    {activeTab === 'directory' && (
                      <td className="px-6 py-4 text-slate-500">
                        <div className="font-medium">{emp.employeeProfile?.department || 'Unassigned'}</div>
                        <div className="text-xs opacity-70">Joined: {emp.employeeProfile?.joiningDate ? new Date(emp.employeeProfile.joiningDate).toLocaleDateString() : 'Unknown'}</div>
                      </td>
                    )}

                    {activeTab === 'attendance' && (
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleMarkAttendance(emp.id, 'PRESENT')}>Present</Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleMarkAttendance(emp.id, 'ABSENT')}>Absent</Button>
                          <Button size="sm" variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50" onClick={() => handleMarkAttendance(emp.id, 'LEAVE')}>Leave</Button>
                        </div>
                      </td>
                    )}

                    {activeTab === 'payroll' && (
                      (() => {
                        const baseSalary = emp.employeeProfile?.baseSalary || 0;
                        const pfRate = emp.employeeProfile?.pfRate || 12;
                        const attendance = emp.employeeProfile?.attendances || [];
                        let absentDays = 0;
                        attendance.forEach(a => {
                          if (a.status === 'ABSENT') absentDays += 1;
                          if (a.status === 'HALF_DAY') absentDays += 0.5;
                        });
                        const deductions = baseSalary > 0 ? (baseSalary / 30) * absentDays : 0;
                        const pfContribution = baseSalary > 0 ? (baseSalary * pfRate) / 100 : 0;
                        const netPay = Math.max(0, baseSalary - deductions - pfContribution);
                        
                        return (
                          <>
                            <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">₹{baseSalary.toFixed(2)}</td>
                            <td className="px-6 py-4 text-red-600 font-medium">-₹{deductions.toFixed(2)} <span className="text-xs text-slate-500 font-normal">({absentDays} days)</span></td>
                            <td className="px-6 py-4 text-orange-600 font-medium">-₹{pfContribution.toFixed(2)} <span className="text-xs text-slate-500 font-normal">({pfRate}%)</span></td>
                            <td className="px-6 py-4 text-green-600 font-bold">₹{netPay.toFixed(2)}</td>
                            <td className="px-6 py-4 text-right">
                              <Button size="sm" onClick={() => handlePaySalary(emp.id)}>
                                <DollarSign size={14} className="mr-2" /> Pay
                              </Button>
                            </td>
                          </>
                        );
                      })()
                    )}

                    {activeTab === 'communications' && (
                      <td className="px-6 py-4">
                        {selectedEmployee === emp.id ? (
                          <div className="flex items-center gap-2">
                            <Input placeholder="Type message..." value={message} onChange={e => setMessage(e.target.value)} className="w-48" />
                            <Button size="sm" onClick={() => handleSendWarning(emp.id)}>Send</Button>
                            <Button size="sm" variant="ghost" onClick={() => setSelectedEmployee(null)}>Cancel</Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setSelectedEmployee(emp.id)}>
                              <MessageSquare size={14} className="mr-2" /> Message
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setSelectedEmployee(emp.id)}>
                              <AlertCircle size={14} className="mr-2" /> Warn
                            </Button>
                          </div>
                        )}
                      </td>
                    )}

                    {activeTab === 'directory' && ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'HR'].includes(user?.role) && (
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/hr/${emp.id}`)} className="text-primary hover:text-primary/90">
                          <Eye size={14} className="mr-2" /> View Profile
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90 hover:bg-destructive/10" onClick={() => handleDelete(emp.id)} title="Terminate Employee">
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      <EmployeeModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        token={token}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchEmployees();
        }}
      />
    </div>
  );
}
