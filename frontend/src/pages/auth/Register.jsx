import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail, Lock, User, Building, Phone, Camera, ArrowRight,
  Eye, EyeOff, CreditCard, MapPin, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import ChemiCursor from '@/components/ui/ChemiCursor';

// GST validation: standard Indian GSTIN format (15 alphanumeric chars)
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// Name: letters, spaces, dots, hyphens — NO leading/trailing spaces
const NAME_REGEX = /^[A-Za-z][A-Za-z\s.\-']{0,48}[A-Za-z.]?$/;

export default function Register() {
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    phone: '',
    email: '',
    gstNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirm,  setShowConfirm]    = useState(false);
  const [profileImage, setProfileImage]   = useState(null);
  const [previewUrl,   setPreviewUrl]     = useState(null);
  const [isLoading,    setIsLoading]      = useState(false);
  const [registered,   setRegistered]     = useState(false);
  const [errors,       setErrors]         = useState({});

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return; }
    setProfileImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const validate = () => {
    const errs = {};
    const f = form;

    if (!f.firstName.trim())               errs.firstName = 'First name is required';
    else if (!NAME_REGEX.test(f.firstName.trim())) errs.firstName = 'Only letters, spaces, dots, hyphens allowed';

    if (!f.lastName.trim())                errs.lastName = 'Last name is required';
    else if (!NAME_REGEX.test(f.lastName.trim()))  errs.lastName = 'Only letters, spaces, dots, hyphens allowed';

    if (!f.companyName.trim())             errs.companyName = 'Company name is required';
    if (!f.phone.trim())                   errs.phone = 'Phone number is required';
    else if (!/^[+\d][\d\s\-()]{7,14}$/.test(f.phone.trim())) errs.phone = 'Enter a valid phone number';

    if (!f.email.trim())                   errs.email = 'Email is required';

    if (f.gstNumber && !GST_REGEX.test(f.gstNumber.trim().toUpperCase())) {
      errs.gstNumber = 'Invalid GSTIN format (e.g. 29ABCDE1234F1Z5)';
    }

    if (!f.password)                       errs.password = 'Password is required';
    else if (f.password.length < 8)        errs.password = 'Password must be at least 8 characters';

    if (f.password !== f.confirmPassword)  errs.confirmPassword = 'Passwords do not match';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    if (!validate()) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('email',       form.email.trim().toLowerCase());
      formData.append('password',    form.password);
      formData.append('firstName',   form.firstName.trim());
      formData.append('lastName',    form.lastName.trim());
      formData.append('companyName', form.companyName.trim());
      formData.append('phone',       form.phone.trim());
      if (form.gstNumber) formData.append('gstNumber', form.gstNumber.trim().toUpperCase());
      if (profileImage)   formData.append('image', profileImage);

      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setRegistered(true);
        toast.success('Registration submitted! Awaiting admin verification.');
      } else {
        if (data.error && data.error.toLowerCase().includes('email')) {
          setErrors({ email: data.error });
        } else {
          toast.error(data.error || 'Registration failed');
        }
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Success State ──────────────────────────────────────────────────────────
  if (registered) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30 px-4 py-12">
        <div className="max-w-4xl w-full bg-card rounded-2xl shadow-xl border border-border p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m4-2a10 10 0 11-20 0 10 10 0 0120 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">Account Pending Verification</h2>
          <p className="text-muted-foreground mb-2 text-sm leading-relaxed">
            Your registration was successful! Our team will review and verify your account shortly.
          </p>
          <p className="text-xs text-muted-foreground mb-8">
            This usually takes 1–2 business days. You'll be able to log in once an administrator approves your account.
          </p>
          <Link to="/login" className="inline-flex flex-wrap items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // ── Registration Form ──────────────────────────────────────────────────────
  const Field = ({ label, error, children, required }) => (
    <div>
      <label className="block text-xs font-semibold text-foreground mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );

  return (
    <div className="flex-1 flex items-stretch min-h-[calc(100vh-4rem)] bg-muted/30">
      {/* ── Left Brand Panel (desktop) ── */}
      <div className="hidden lg:flex flex-col justify-between w-[380px] shrink-0 bg-primary text-primary-foreground p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
        <div className="relative z-10">
          <Link to="/" className="inline-block mb-8">
            <img src="/chemicrown.png" alt="ChemiCrown" className="h-12 w-12 object-contain rounded-lg" />
          </Link>
          <h1 className="text-2xl font-extrabold leading-tight mb-3">Join ChemiCrown</h1>
          <p className="text-primary-foreground/70 text-sm leading-relaxed">
            Create your company account to access wholesale pricing, real-time inventory, and instant quotations.
          </p>
        </div>
        <div className="relative z-10 bg-white/10 rounded-xl p-5">
          <p className="text-xs font-semibold text-primary-foreground/60 uppercase tracking-wider mb-3">What happens next?</p>
          {[
            '1. Submit this registration form',
            '2. Admin reviews your application (1–2 days)',
            '3. Get verified and start ordering',
          ].map(s => (
            <p key={s} className="text-sm text-primary-foreground/80 mb-1.5">{s}</p>
          ))}
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex-grow flex-1 flex items-center justify-center px-4 py-6 overflow-y-auto">
        <div className="w-full max-w-5xl">
          {/* Mobile logo */}
          <div className="flex justify-center mb-5 lg:hidden">
            <Link to="/">
              <img src="/chemicrown.png" alt="ChemiCrown Logo" className="h-10 w-10 object-contain rounded-lg" />
            </Link>
          </div>

          <h2 className="text-2xl font-extrabold text-foreground mb-0.5">Create an Account</h2>
          <p className="text-muted-foreground text-sm mb-5">Register your company to access wholesale pricing</p>

          <form onSubmit={handleRegister} noValidate>
            {/* ── Profile Image + Name row ── */}
            <div className="flex items-start gap-5 mb-5">
              {/* Avatar upload */}
              <div className="flex flex-col items-center shrink-0">
                <div
                  className="w-16 h-16 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center cursor-pointer overflow-hidden group relative"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                    <span className="text-[10px] text-white font-medium">Upload</span>
                  </div>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                <p className="text-[10px] text-muted-foreground mt-1 text-center">Photo<br/>(optional)</p>
              </div>

              {/* First + Last name */}
              <div className="flex-1 grid grid-cols-2 gap-3">
                <Field label="First Name" error={errors.firstName} required>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text" value={form.firstName}
                      onChange={set('firstName')}
                      onBlur={() => {
                        const v = form.firstName.trim();
                        setForm(f => ({ ...f, firstName: v }));
                      }}
                      className={`block w-full pl-9 pr-3 py-2.5 border rounded-xl bg-background text-foreground text-sm focus:ring-2 focus:ring-primary ${errors.firstName ? 'border-red-400' : 'border-input'}`}
                      placeholder="John"
                    />
                  </div>
                </Field>
                <Field label="Last Name" error={errors.lastName} required>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text" value={form.lastName}
                      onChange={set('lastName')}
                      onBlur={() => {
                        const v = form.lastName.trim();
                        setForm(f => ({ ...f, lastName: v }));
                      }}
                      className={`block w-full pl-9 pr-3 py-2.5 border rounded-xl bg-background text-foreground text-sm focus:ring-2 focus:ring-primary ${errors.lastName ? 'border-red-400' : 'border-input'}`}
                      placeholder="Doe"
                    />
                  </div>
                </Field>
              </div>
            </div>

            {/* ── Row 2: Company + Phone ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <Field label="Company Name" error={errors.companyName} required>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text" value={form.companyName} onChange={set('companyName')}
                    className={`block w-full pl-9 pr-3 py-2.5 border rounded-xl bg-background text-foreground text-sm focus:ring-2 focus:ring-primary ${errors.companyName ? 'border-red-400' : 'border-input'}`}
                    placeholder="Acme Chemicals Ltd."
                  />
                </div>
              </Field>
              <Field label="Phone Number" error={errors.phone} required>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="tel" value={form.phone} onChange={set('phone')}
                    className={`block w-full pl-9 pr-3 py-2.5 border rounded-xl bg-background text-foreground text-sm focus:ring-2 focus:ring-primary ${errors.phone ? 'border-red-400' : 'border-input'}`}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </Field>
            </div>

            {/* ── Row 3: Email + GST ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <Field label="Email Address" error={errors.email} required>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email" value={form.email} onChange={set('email')}
                    className={`block w-full pl-9 pr-3 py-2.5 border rounded-xl bg-background text-foreground text-sm focus:ring-2 focus:ring-primary ${errors.email ? 'border-red-400' : 'border-input'}`}
                    placeholder="john@company.com"
                  />
                </div>
              </Field>
              <Field label="GST Number" error={errors.gstNumber}>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text" value={form.gstNumber}
                    onChange={(e) => setForm(f => ({ ...f, gstNumber: e.target.value.toUpperCase() }))}
                    maxLength={15}
                    className={`block w-full pl-9 pr-3 py-2.5 border rounded-xl bg-background text-foreground text-sm focus:ring-2 focus:ring-primary font-mono tracking-wider ${errors.gstNumber ? 'border-red-400' : 'border-input'}`}
                    placeholder="29ABCDE1234F1Z5"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1">
                  <Info size={10} />Optional — needed for B2B tax invoices
                </p>
              </Field>
            </div>

            {/* ── Row 4: Password + Confirm ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <Field label="Password" error={errors.password} required>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'} value={form.password}
                    onChange={set('password')}
                    className={`block w-full pl-9 pr-10 py-2.5 border rounded-xl bg-background text-foreground text-sm focus:ring-2 focus:ring-primary ${errors.password ? 'border-red-400' : 'border-input'}`}
                    placeholder="Min. 8 characters"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
              <Field label="Confirm Password" error={errors.confirmPassword} required>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showConfirm ? 'text' : 'password'} value={form.confirmPassword}
                    onChange={set('confirmPassword')}
                    className={`block w-full pl-9 pr-10 py-2.5 border rounded-xl bg-background text-foreground text-sm focus:ring-2 focus:ring-primary ${errors.confirmPassword ? 'border-red-400' : 'border-input'}`}
                    placeholder="Repeat password"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
            </div>

            {/* Role note */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 mb-5 text-xs text-blue-700 dark:text-blue-400">
              <Info size={13} className="shrink-0 mt-0.5" />
              <span>All self-registered accounts are created as <strong>Customer / Buyer</strong> accounts. Company roles (Manager, Sales, etc.) are assigned by your ChemiCrown administrator after account approval.</span>
            </div>

            <button
              disabled={isLoading}
              type="submit"
              className={`w-full flex justify-center items-center py-2.5 px-4 rounded-xl text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors shadow-sm ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Creating Account…' : <><span>Create Account</span><ArrowRight className="ml-2 w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-5">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:text-primary/80">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
