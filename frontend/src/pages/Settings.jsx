import { useState, useRef, useEffect } from 'react';
import {
  User, Lock, Bell, Shield, Save, Eye, EyeOff, Camera,
  Phone, Mail, CheckCircle2, AlertTriangle, Globe,
  Settings as SettingsIcon, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning';

const PREDEFINED_AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=c0aede",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper&backgroundColor=ffdfbf",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Robot&backgroundColor=d1d4f9",
  "https://api.dicebear.com/7.x/identicon/svg?seed=Tech&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Sara&backgroundColor=c0aede",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Brian&backgroundColor=ffdfbf",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Mia&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Leo&backgroundColor=d1d4f9",
  "https://api.dicebear.com/7.x/micah/svg?seed=John&backgroundColor=ffdfbf",
  "https://api.dicebear.com/7.x/micah/svg?seed=Jane&backgroundColor=c0aede",
  "https://api.dicebear.com/7.x/initials/svg?seed=Admin&backgroundColor=b6e3f4"
];

const TABS = [
  { id: 'profile',       label: 'Profile',       icon: User },
  { id: 'security',      label: 'Security',      icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

function TabButton({ tab, active, onClick }) {
  const Icon = tab.icon;
  return (
    <button
      onClick={() => onClick(tab.id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left ${
        active
          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
      }`}
    >
      <Icon size={17} className="shrink-0" />
      {tab.label}
    </button>
  );
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 p-4 bg-muted/40 rounded-xl border border-border hover:border-primary/30 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative w-10 h-5.5 rounded-full transition-colors shrink-0 mt-0.5 ${checked ? 'bg-primary' : 'bg-border'}`}
        style={{ width: '40px', height: '22px' }}
      >
        <span
          className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-all duration-200 ${checked ? 'left-[20px]' : 'left-[2px]'}`}
        />
      </button>
    </div>
  );
}

export default function Settings() {
  const { user, token, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const fileInputRef = useRef(null);

  // Profile
  const SESSION_KEY = `settings_form_${user?.id}`;

  const [formData, setFormData] = useState(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) return JSON.parse(saved);
    } catch (err) { console.error('Session storage read error', err); }
    return {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || ''
    };
  });

  const [profileImage, setProfileImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.profileImageUrl || null);
  const [isSaving, setIsSaving] = useState(false);

  const isDirty = !!(formData.firstName !== user?.firstName || formData.lastName !== user?.lastName || formData.phone !== user?.phone);
  useUnsavedChangesWarning(isDirty && !isSaving);

  useEffect(() => {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(formData)); }
    catch (err) { console.error('Session storage write error', err); }
  }, [formData, SESSION_KEY]);

  // Security
  const [pwData, setPwData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '', otp: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [isChangingPw, setIsChangingPw] = useState(false);
  const [useOtpReset, setUseOtpReset] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);

  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => setOtpTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Notifications
  const [notifPrefs, setNotifPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem(`chemicrown_notif_prefs_${user?.id}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      orderUpdates: true,
      lowInventory: true,
      newCustomers: true,
      payrollReady: false,
      taskAssigned: true,
      loginAlerts: false
    };
  });

  const handleSaveNotifPrefs = () => {
    try {
      localStorage.setItem(`chemicrown_notif_prefs_${user?.id}`, JSON.stringify(notifPrefs));
      toast.success('Notification preferences saved successfully!');
    } catch {
      toast.error('Failed to save preferences');
    }
  };
  
  const [customerMode, setCustomerMode] = useState(() => localStorage.getItem('customerMode') !== 'false');

  const handleCustomerModeChange = () => {
    const newValue = !customerMode;
    setCustomerMode(newValue);
    localStorage.setItem('customerMode', newValue.toString());
    window.dispatchEvent(new Event('storage')); // Notify other components (DashboardLayout)
    toast.success(`Customer mode ${newValue ? 'enabled' : 'disabled'}`);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
      setProfileImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSelectPredefinedAvatar = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], "avatar.svg", { type: "image/svg+xml" });
      setProfileImage(file);
      setPreviewUrl(url);
    } catch (err) {
      toast.error('Failed to load avatar');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!formData.firstName.trim()) { toast.error('First name is required'); return; }
    if (formData.phone && !/^\+?[0-9\s\-]{10,15}$/.test(formData.phone)) {
      toast.error('Invalid phone number format (10-15 digits expected)'); 
      return; 
    }
    setIsSaving(true);
    try {
      const data = new FormData();
      data.append('firstName', formData.firstName);
      data.append('lastName', formData.lastName);
      data.append('phone', formData.phone);
      if (profileImage) data.append('image', profileImage);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: data
      });
      const json = await res.json();
      if (res.ok) {
        setUser({ ...user, ...json.user });
        setProfileImage(null);
        toast.success('Profile updated!');
      } else {
        toast.error(json.error || 'Failed to update profile');
      }
    } catch (err) { console.error(err); toast.error('Network error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwData.newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (pwData.newPassword !== pwData.confirmPassword) { toast.error('Passwords do not match'); return; }
    
    if (useOtpReset && pwData.otp.length < 6) { toast.error('Please enter a valid 6-digit OTP'); return; }

    setIsChangingPw(true);
    try {
      const endpoint = useOtpReset ? '/api/auth/reset-password' : '/api/auth/change-password';
      const body = useOtpReset 
        ? { email: user.email, otp: pwData.otp, newPassword: pwData.newPassword }
        : { currentPassword: pwData.currentPassword, newPassword: pwData.newPassword };

      const res = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (res.ok) {
        setPwData({ currentPassword: '', newPassword: '', confirmPassword: '', otp: '' });
        setUseOtpReset(false);
        setOtpSent(false);
        toast.success('Password changed successfully!');
      } else {
        toast.error(json.error || 'Failed to change password');
      }
    } catch (err) { console.error(err); toast.error('Network error'); }
    finally {
      setIsChangingPw(false);
    }
  };

  const handleSendOtp = async () => {
    if (sendingOtp || otpTimer > 0) return; // prevent multiple clicks
    setSendingOtp(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`OTP sent to ${user.email}`);
        setOtpSent(true);
        setOtpTimer(60);
      } else {
        toast.error(data.error || 'Failed to send OTP');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSendingOtp(false);
    }
  };

  const initials = ((user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')).toUpperCase() || 'U';
  const roleLabel = user?.role?.replace(/_/g, ' ') || '';

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-icon bg-primary/10 text-primary">
          <SettingsIcon size={22} />
        </div>
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account preferences and security.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-52 space-y-1 shrink-0">
          <div className="form-card p-4! mb-4">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 overflow-hidden flex items-center justify-center text-primary font-bold text-xl">
                {previewUrl
                  ? <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
                  : initials}
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-muted-foreground capitalize">{roleLabel.toLowerCase()}</p>
              </div>
            </div>
          </div>
          {TABS.map(tab => (
            <TabButton key={tab.id} tab={tab} active={activeTab === tab.id} onClick={setActiveTab} />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="form-card space-y-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">Profile Information</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Update your personal details and profile photo.</p>
              </div>

              {/* Avatar */}
              <div className="flex flex-wrap items-center gap-5">
                <div
                  className="w-20 h-20 rounded-2xl bg-muted overflow-hidden flex items-center justify-center text-xl font-bold text-primary cursor-pointer group relative border-2 border-dashed border-border hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewUrl
                    ? <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                    : initials}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                    <Camera size={20} className="text-white" />
                  </div>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                <div>
                  <p className="font-semibold text-sm text-foreground">Profile Photo</p>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-2">JPG, PNG or WEBP · Max 5MB</p>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs font-semibold text-primary hover:underline">
                    Change Photo
                  </button>
                  {profileImage && (
                    <button type="button" onClick={() => { setProfileImage(null); setPreviewUrl(user?.profileImageUrl || null); }} className="ml-3 text-xs text-muted-foreground hover:text-destructive">
                      Reset
                    </button>
                  )}
                </div>
              </div>

              <div>
                <p className="font-semibold text-sm text-foreground mb-3">Or choose a pre-defined avatar</p>
                <div className="flex flex-wrap gap-4">
                  {PREDEFINED_AVATARS.map((url, i) => (
                    <div 
                      key={i} 
                      onClick={() => handleSelectPredefinedAvatar(url)}
                      className={`w-14 h-14 rounded-2xl cursor-pointer overflow-hidden border-2 transition-all hover:scale-105 ${previewUrl === url ? 'border-primary shadow-md shadow-primary/20' : 'border-transparent hover:border-primary/50'}`}
                    >
                      <img src={url} alt="Predefined Avatar" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">First Name</label>
                  <Input className="w-full" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} placeholder="John" required />
                </div>
                <div>
                  <label className="form-label">Last Name</label>
                  <Input className="w-full" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} placeholder="Doe" />
                </div>
                <div>
                  <label className="form-label">Email Address</label>
                  <div className="relative w-full">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input value={user?.email || ''} readOnly className="pl-9 w-full bg-muted/60 text-muted-foreground cursor-not-allowed" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Email cannot be changed.</p>
                </div>
                <div>
                  <label className="form-label">Phone Number</label>
                  <div className="relative w-full">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 98765 43210" className="pl-9 w-full" />
                  </div>
                </div>
                <div>
                  <label className="form-label">Role</label>
                  <div className="relative w-full">
                    <Shield size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input value={roleLabel} readOnly className="pl-9 w-full bg-muted/60 text-muted-foreground cursor-not-allowed capitalize" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isSaving} className="gap-2">
                  <Save size={15} /> {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <form onSubmit={handleChangePassword} className="form-card space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Change Password</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Use a strong password with at least 8 characters.</p>
                </div>

                {useOtpReset ? (
                  <>
                    <div>
                      <label className="form-label">6-Digit OTP</label>
                      <div className="flex gap-3">
                        <Input
                          type="text"
                          maxLength={6}
                          placeholder="------"
                          value={pwData.otp}
                          onChange={e => setPwData({ ...pwData, otp: e.target.value })}
                          className="tracking-widest text-center text-lg"
                          required
                        />
                        <Button type="button" variant="outline" onClick={handleSendOtp} disabled={otpTimer > 0 || sendingOtp}>
                          {sendingOtp ? <><Loader2 size={14} className="mr-1 animate-spin" /> Sending...</> : otpTimer > 0 ? `Resend (${otpTimer}s)` : (otpSent ? 'Resend OTP' : 'Send OTP')}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">Sent to {user?.email}</p>
                    </div>
                    {[
                      { key: 'newPassword', label: 'New Password', showKey: 'new' },
                      { key: 'confirmPassword', label: 'Confirm New Password', showKey: 'confirm' }
                    ].map(({ key, label, showKey }) => (
                      <div key={key}>
                        <label className="form-label">{label}</label>
                        <div className="relative">
                          <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            type={showPw[showKey] ? 'text' : 'password'}
                            className="pl-9 pr-10"
                            placeholder="••••••••"
                            value={pwData[key]}
                            onChange={e => setPwData({ ...pwData, [key]: e.target.value })}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPw(p => ({ ...p, [showKey]: !p[showKey] }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPw[showKey] ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    {[
                      { key: 'currentPassword', label: 'Current Password', showKey: 'current' },
                      { key: 'newPassword', label: 'New Password', showKey: 'new' },
                      { key: 'confirmPassword', label: 'Confirm New Password', showKey: 'confirm' }
                    ].map(({ key, label, showKey }) => (
                      <div key={key}>
                        <label className="form-label">{label}</label>
                        <div className="relative">
                          <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            type={showPw[showKey] ? 'text' : 'password'}
                            className="pl-9 pr-10"
                            placeholder="••••••••"
                            value={pwData[key]}
                            onChange={e => setPwData({ ...pwData, [key]: e.target.value })}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPw(p => ({ ...p, [showKey]: !p[showKey] }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPw[showKey] ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                        {key === 'newPassword' && pwData.newPassword && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {pwData.newPassword.length >= 8
                              ? <CheckCircle2 size={13} className="text-emerald-500" />
                              : <AlertTriangle size={13} className="text-amber-500" />}
                            <span className={`text-xs ${pwData.newPassword.length >= 8 ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {pwData.newPassword.length >= 8 ? 'Meets minimum length' : 'Minimum 8 characters required'}
                            </span>
                          </div>
                        )}
                        {key === 'confirmPassword' && pwData.confirmPassword && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {pwData.newPassword === pwData.confirmPassword
                              ? <CheckCircle2 size={13} className="text-emerald-500" />
                              : <AlertTriangle size={13} className="text-destructive" />}
                            <span className={`text-xs ${pwData.newPassword === pwData.confirmPassword ? 'text-emerald-600' : 'text-destructive'}`}>
                              {pwData.newPassword === pwData.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}

                <div className="flex justify-between items-center mt-2">
                  <button 
                    type="button" 
                    onClick={() => {
                      setUseOtpReset(!useOtpReset);
                      if (!useOtpReset && !otpSent) handleSendOtp();
                    }}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {useOtpReset ? 'Know your current password?' : 'Forgot your current password?'}
                  </button>
                  <Button type="submit" disabled={isChangingPw || (useOtpReset && !otpSent)} className="gap-2">
                    <Lock size={15} /> {isChangingPw ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </form>

              {/* Active Sessions (informational) */}
              <div className="form-card p-4!">
                <h3 className="font-bold text-foreground mb-1">Active Session</h3>
                <p className="text-sm text-muted-foreground mb-4">You are currently logged in on this device.</p>
                <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/50 rounded-xl">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Globe size={17} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Web Browser</p>
                    <p className="text-xs text-muted-foreground">Current session · Active now</p>
                  </div>
                  <span className="badge badge-success">Active</span>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="form-card space-y-5">
              <div>
                <h2 className="text-lg font-bold text-foreground">Notification Preferences</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Control which alerts you receive in the app.</p>
              </div>

              <div className="space-y-3">
                <div className="border-b border-border pb-4 mb-4">
                  <h3 className="font-semibold text-sm mb-3 uppercase tracking-wider text-muted-foreground">General Features</h3>
                  <ToggleRow
                    label="Customer Mode"
                    description="Enable shopping features like My Cart, Wishlist, and personal Orders in the sidebar."
                    checked={customerMode}
                    onChange={handleCustomerModeChange}
                  />
                </div>
                
                <h3 className="font-semibold text-sm mb-3 uppercase tracking-wider text-muted-foreground">Alerts</h3>
                <ToggleRow
                  label="Order Status Updates"
                  description="Get notified when orders are placed, dispatched, or delivered."
                  checked={notifPrefs.orderUpdates}
                  onChange={() => setNotifPrefs(p => ({ ...p, orderUpdates: !p.orderUpdates }))}
                />
                <ToggleRow
                  label="Low Inventory Alerts"
                  description="Alert when product stock drops below minimum threshold."
                  checked={notifPrefs.lowInventory}
                  onChange={() => setNotifPrefs(p => ({ ...p, lowInventory: !p.lowInventory }))}
                />
                <ToggleRow
                  label="New Customer Registrations"
                  description="Notify when a new customer registers and awaits verification."
                  checked={notifPrefs.newCustomers}
                  onChange={() => setNotifPrefs(p => ({ ...p, newCustomers: !p.newCustomers }))}
                />
                <ToggleRow
                  label="Payroll Ready"
                  description="Alert when monthly payroll slips are generated."
                  checked={notifPrefs.payrollReady}
                  onChange={() => setNotifPrefs(p => ({ ...p, payrollReady: !p.payrollReady }))}
                />
                <ToggleRow
                  label="Task Assignments"
                  description="Notify when a task is assigned to you or your team."
                  checked={notifPrefs.taskAssigned}
                  onChange={() => setNotifPrefs(p => ({ ...p, taskAssigned: !p.taskAssigned }))}
                />
                <ToggleRow
                  label="Login Alerts"
                  description="Receive notifications on new device logins."
                  checked={notifPrefs.loginAlerts}
                  onChange={() => setNotifPrefs(p => ({ ...p, loginAlerts: !p.loginAlerts }))}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveNotifPrefs} className="gap-2">
                  <Save size={15} /> Save Preferences
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
