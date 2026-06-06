import { useState } from 'react';
import { User, Lock, Bell, Shield, Save, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';

import { useAuth } from '@/context/AuthContext';

export default function Settings() {
  const { user, token, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || ''
  });
  const [profileImage, setProfileImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.profileImageUrl || null);
  const [isSaving, setIsSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const data = new FormData();
      data.append('firstName', formData.firstName);
      data.append('lastName', formData.lastName);
      data.append('phone', formData.phone);
      if (profileImage) {
        data.append('image', profileImage);
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: data
      });
      
      const json = await res.json();
      if (res.ok) {
        setUser({ ...user, ...json.user });
        toast.success('Profile updated successfully!');
      } else {
        toast.error(json.error || 'Failed to update profile');
      }
    } catch {
      toast.error('Network error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account preferences and system settings.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 space-y-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'profile' ? 'bg-primary text-primary-foreground' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <User size={18} /> Profile Information
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'security' ? 'bg-primary text-primary-foreground' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <Lock size={18} /> Security & Passwords
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'notifications' ? 'bg-primary text-primary-foreground' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <Bell size={18} /> Notifications
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 glass border border-border rounded-2xl p-6 md:p-8">
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <h2 className="text-xl font-bold mb-4">Profile Information</h2>
              
              <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6 mb-6">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200 shrink-0">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-3xl font-bold">
                      {user?.firstName?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
                <div className="space-y-2 text-center sm:text-left">
                  <h3 className="font-medium">Profile Image</h3>
                  <p className="text-sm text-slate-500 max-w-xs">Upload a professional headshot to represent your account across the system.</p>
                  <label className="inline-block px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg cursor-pointer transition-colors">
                    Choose Image
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1.5">First Name</label>
                  <Input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Last Name</label>
                  <Input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Email Address (Read-only)</label>
                  <Input value={user?.email || ''} readOnly className="bg-slate-50 text-slate-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Phone Number</label>
                  <Input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={isSaving} className="flex items-center gap-2">
                  <Save size={16} /> {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={(e) => { e.preventDefault(); toast.error('Change password not implemented yet') }} className="space-y-6">
              <h2 className="text-xl font-bold mb-4">Change Password</h2>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Current Password</label>
                <div className="relative">
                  <Input 
                    type={showCurrentPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">New Password</label>
                <div className="relative">
                  <Input 
                    type={showNewPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <Input 
                    type={showConfirmPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                </div>
              </div>
              <div className="pt-4">
                <Button type="submit">Update Password</Button>
              </div>
            </form>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold mb-4">Notification Preferences</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h4 className="font-medium text-sm">Order Updates</h4>
                    <p className="text-xs text-muted-foreground mt-1">Receive email alerts when orders change status.</p>
                  </div>
                  <input type="checkbox" className="w-4 h-4 rounded text-primary" defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h4 className="font-medium text-sm">Low Inventory Alerts</h4>
                    <p className="text-xs text-muted-foreground mt-1">Get notified when chemical stock drops below threshold.</p>
                  </div>
                  <input type="checkbox" className="w-4 h-4 rounded text-primary" defaultChecked />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button onClick={() => toast.success('Preferences saved')}>Save Preferences</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
