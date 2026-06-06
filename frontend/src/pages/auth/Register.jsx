import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Beaker, Mail, Lock, User, Building, Phone, Briefcase, Camera, ArrowRight, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('CUSTOMER');
  
  const [showPassword, setShowPassword] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('role', role);
      if (profileImage) {
        formData.append('image', profileImage);
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success('Registration successful! Please log in.');
        navigate('/login');
      } else {
        toast.error(data.error || 'Registration failed');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-muted/30 px-4 py-12">
      <div className="max-w-2xl w-full bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
        <div className="p-8 md:p-10">
          <div className="flex flex-col items-center">
            <img src="/chemicrown.png" alt="ChemiCrown Logo" className="h-16 w-16 mb-6 object-contain" />
          </div>
          <h2 className="text-3xl font-extrabold text-center text-foreground mb-2">Create an Account</h2>
          <p className="text-center text-muted-foreground mb-8 text-base">Register your company to access wholesale pricing</p>

          <form onSubmit={handleRegister} className="space-y-5">
            {/* Profile Image Upload */}
            <div className="flex flex-col items-center justify-center mb-6">
              <div 
                className="w-24 h-24 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center cursor-pointer overflow-hidden group relative"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-white font-medium">Upload</span>
                </div>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
              <p className="text-xs text-muted-foreground mt-2">Optional Profile Image</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">First Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input type="text" value={firstName} onChange={e=>setFirstName(e.target.value)} className="block w-full pl-10 pr-3 py-3 border border-input rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary" placeholder="John" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Last Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input type="text" value={lastName} onChange={e=>setLastName(e.target.value)} className="block w-full pl-10 pr-3 py-3 border border-input rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary" placeholder="Doe" required />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Company Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input type="text" className="block w-full pl-10 pr-3 py-3 border border-input rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary" placeholder="Acme Chemicals Ltd." required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input type="tel" className="block w-full pl-10 pr-3 py-3 border border-input rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary" placeholder="+91 98765 43210" required />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="block w-full pl-10 pr-3 py-3 border border-input rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary" placeholder="john@company.com" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">System Role</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <select 
                    value={role} 
                    onChange={e => setRole(e.target.value)} 
                    className="block w-full pl-10 pr-10 py-3 border border-input rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                    required
                  >
                    <option value="CUSTOMER">Customer / Buyer</option>
                    <option value="SALES">Sales Representative</option>
                    <option value="MANAGER">Manager</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={e=>setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-input rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary" 
                  placeholder="••••••••" 
                  required 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

              <button disabled={isLoading} type="submit" className={`w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                {isLoading ? 'Creating Account...' : <>Create Account <ArrowRight className="ml-2 w-5 h-5" /></>}
              </button>
          </form>
        </div>
        <div className="px-8 py-5 bg-muted/50 border-t border-border text-center">
          <span className="text-foreground text-sm">Already have an account? </span>
          <Link to="/login" className="font-medium text-primary hover:text-primary/80 text-sm">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
