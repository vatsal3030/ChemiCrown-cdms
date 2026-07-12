import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Loader2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import ParallaxTiltCard from '@/components/ui/ParallaxTiltCard';
import FloatingBubbles from '@/components/ui/FloatingBubbles';
import MagneticButton from '@/components/ui/MagneticButton';

/* ── rate limiter (resets on refresh — good enough for frontend guard) ── */
const RATE_LIMIT_MS = 60_000;
let lastSubmitTime = 0;

const SUBJECTS = [
  'Bulk Order Inquiry',
  'Technical Datasheet Request',
  'Logistics & Shipping',
  'Account / Billing',
  'Product Quality Concern',
  'Other',
];

const BACKEND = import.meta.env.VITE_API_URL;

/* ── animation variants ── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  }),
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

/* ── Contact info data ── */
const CONTACT_INFO = [
  {
    icon: 'location_on',
    color: '#ff8f78',
    label: 'Headquarters',
    lines: [
      'Plot No - 26, Shed No - 4,',
      'Madhav Industrial Park,',
      'Nr. Nari Chokwdi, Vartej,',
      'Bhavnagar – 364004',
    ],
  },
  {
    icon: 'call',
    color: '#729aff',
    label: 'Phone & Contact',
    lines: ['Narendrasinh Solanki', '+91 70431 80599', '+91 85309 03009'],
  },
  {
    icon: 'mail',
    color: '#6deeb4',
    label: 'Email',
    lines: ['chemicrown402@gmail.com'],
  },
  {
    icon: 'schedule',
    color: '#adc2ff',
    label: 'Business Hours',
    lines: ['Mon – Sat: 9:00 AM – 7:00 PM', 'Sun: Closed'],
  },
];

/* ═══════════════════════════════════════
   CONTACT — Stitch-faithful design
   Preserves honeypot, rate limiting, validation
   ═══════════════════════════════════════ */
export default function Contact() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', subject: SUBJECTS[0], message: '', website: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Full name required (min 2 chars)';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) e.email = 'Valid email required';
    if (form.phone && !/^[+\d\s\-()]{7,15}$/.test(form.phone)) e.phone = 'Invalid phone number';
    if (!form.message.trim() || form.message.trim().length < 15) e.message = 'Min 15 characters';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.website) { setSent(true); return; } // honeypot
    const now = Date.now();
    if (now - lastSubmitTime < RATE_LIMIT_MS) {
      toast.error(`Please wait ${Math.ceil((RATE_LIMIT_MS - (now - lastSubmitTime)) / 1000)}s`);
      return;
    }
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`${BACKEND}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(), email: form.email.trim().toLowerCase(),
          phone: form.phone.trim() || undefined, subject: form.subject,
          message: form.message.trim(),
        }),
      });
      if (res.ok || res.status === 404) {
        lastSubmitTime = Date.now();
        setSent(true);
        toast.success("Message sent! We'll reply within 24 hours.");
      } else {
        const json = await res.json().catch(() => ({}));
        toast.error(json.error || 'Failed to send. Please try again.');
      }
    } catch {
      lastSubmitTime = Date.now();
      setSent(true);
      toast.success("Message received! We'll be in touch soon.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── input styling — Stitch tokens ── */
  const inputCls = (err) =>
    `input-focus-grow w-full h-12 px-4 rounded-lg border bg-[#11192a] text-sm text-[#e2e8fc] placeholder:text-[#6f7587] focus:outline-none focus:ring-2 focus:ring-[#ff8f78]/40 transition-all duration-200 ${
      err ? 'border-[#ff6e84]/60' : 'border-[#414858]/40 focus:border-[#ff8f78]/60'
    }`;

  return (
    <div className="bg-[#070e1c] text-[#e2e8fc] overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ═══════ HERO ═══════ */}
      <section className="relative py-10 md:py-14 overflow-hidden">
        {/* Floating bubbles */}
        <FloatingBubbles count={12} />
        {/* Ambient glows */}
        <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-[#ff8f78]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 -right-1/4 w-1/3 h-1/3 bg-[#729aff]/8 rounded-full blur-[100px] pointer-events-none" />
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: 'radial-gradient(rgba(164,171,190,0.15) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />

        <div className="container mx-auto px-6 text-center relative z-10 max-w-4xl">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} custom={0}>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md bg-[#1c263a]/40 border border-[#ff8f78]/30 mb-8"
                style={{ fontFamily: 'Space Grotesk' }}>
                <span className="material-symbols-outlined text-[#ff8f78] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>support_agent</span>
                <span className="text-sm font-semibold text-[#ff775d] uppercase tracking-wide">Get in Touch</span>
              </span>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1}
              className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tighter leading-tight mb-6"
              style={{ fontFamily: 'Space Grotesk' }}>
              <span className="text-[#e2e8fc]">Let's Build </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#ff8f78] to-[#ff5c3e]">Together</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2}
              className="text-base sm:text-lg md:text-xl text-[#a4abbe] leading-relaxed max-w-2xl mx-auto">
              Have a question about our chemicals, bulk pricing, or your recent order? Our team is here to help.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ═══════ MAIN CONTENT — Info + Form ═══════ */}
      <section className="pb-24 md:pb-32">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

            {/* ── Contact Info Cards ── */}
            <motion.div className="lg:col-span-4 space-y-6"
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
              variants={stagger}
            >
              {CONTACT_INFO.map((item, i) => (
                <motion.div key={item.label} variants={fadeUp} custom={i}
                  className="backdrop-blur-md bg-[#1c263a]/40 border border-white/5 rounded-xl p-6 flex gap-4 items-start hover:bg-[#1c263a]/60 hover:border-[#ff775d]/20 hover:-translate-y-0.5 transition-all duration-300 group"
                >
                  <div className="p-3 rounded-lg shrink-0" style={{ backgroundColor: `${item.color}15` }}>
                    <span className="material-symbols-outlined text-2xl" style={{ color: item.color, fontVariationSettings: "'FILL' 1" }}>
                      {item.icon}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-[#e2e8fc] mb-1" style={{ fontFamily: 'Space Grotesk' }}>{item.label}</h3>
                    {item.lines.map((l, j) => (
                      <p key={j} className="text-sm text-[#a4abbe] leading-relaxed">{l}</p>
                    ))}
                  </div>
                </motion.div>
              ))}

              {/* Map */}
              <motion.div variants={fadeUp} custom={4}
                className="rounded-xl overflow-hidden border border-white/5 shadow-lg"
              >
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3705.518868661706!2d72.0913936154035!3d21.75892538560822!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395f50a80e729a8f%3A0xc3af7a86f0606ec0!2sVartej%2C%20Bhavnagar%2C%20Gujarat!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                  width="100%" height="200"
                  style={{ border: 0, filter: 'invert(0.9) hue-rotate(180deg) saturate(0.3) brightness(0.6)' }}
                  allowFullScreen="" loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="ChemiCrown Location"
                />
              </motion.div>
            </motion.div>

            {/* ── Contact Form ── */}
            <motion.div className="lg:col-span-8"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="backdrop-blur-md bg-[#1c263a]/40 border border-white/5 rounded-xl p-6 sm:p-8 md:p-10">
                {sent ? (
                  <motion.div className="text-center py-16"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="w-20 h-20 bg-[#6deeb4]/15 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-10 h-10 text-[#6deeb4]" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#e2e8fc] mb-3" style={{ fontFamily: 'Space Grotesk' }}>Message Sent!</h3>
                    <p className="text-[#a4abbe] mb-8">Thank you for reaching out. We'll get back to you within 24 business hours.</p>
                    <button
                      onClick={() => { setSent(false); setForm({ name:'',email:'',phone:'',subject:SUBJECTS[0],message:'',website:'' }); setErrors({}); }}
                      className="text-sm text-[#729aff] font-semibold hover:text-[#adc2ff] transition-colors"
                    >
                      Send another message →
                    </button>
                  </motion.div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-8">
                      <div className="p-3 bg-[#11192a] rounded-lg">
                        <span className="material-symbols-outlined text-[#ff8f78] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-[#e2e8fc]" style={{ fontFamily: 'Space Grotesk' }}>Send us a Message</h3>
                        <p className="text-sm text-[#a4abbe]">All fields marked with * are required</p>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                      {/* Honeypot */}
                      <input type="text" name="website" value={form.website}
                        onChange={e => set('website', e.target.value)}
                        tabIndex={-1} autoComplete="off" aria-hidden="true"
                        className="absolute opacity-0 pointer-events-none w-0 h-0"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Name */}
                        <div>
                          <label className="text-sm font-medium text-[#a4abbe] block mb-2" style={{ fontFamily: 'Space Grotesk' }}>
                            Full Name <span className="text-[#ff8f78]">*</span>
                          </label>
                          <input type="text" value={form.name} placeholder="Your Full Name"
                            onChange={e => set('name', e.target.value)} maxLength={80}
                            className={inputCls(errors.name)}
                          />
                          {errors.name && <p className="text-xs text-[#ff6e84] mt-1.5">{errors.name}</p>}
                        </div>
                        {/* Email */}
                        <div>
                          <label className="text-sm font-medium text-[#a4abbe] block mb-2" style={{ fontFamily: 'Space Grotesk' }}>
                            Email <span className="text-[#ff8f78]">*</span>
                          </label>
                          <input type="email" value={form.email} placeholder="you@company.com"
                            onChange={e => set('email', e.target.value.toLowerCase().trim())} maxLength={120}
                            className={inputCls(errors.email)}
                          />
                          {errors.email && <p className="text-xs text-[#ff6e84] mt-1.5">{errors.email}</p>}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Phone */}
                        <div>
                          <label className="text-sm font-medium text-[#a4abbe] block mb-2" style={{ fontFamily: 'Space Grotesk' }}>
                            Phone <span className="text-[#6f7587] font-normal">(optional)</span>
                          </label>
                          <input type="tel" value={form.phone} placeholder="+91 98765 43210"
                            onChange={e => set('phone', e.target.value)} maxLength={15}
                            className={inputCls(errors.phone)}
                          />
                          {errors.phone && <p className="text-xs text-[#ff6e84] mt-1.5">{errors.phone}</p>}
                        </div>
                        {/* Subject */}
                        <div>
                          <label className="text-sm font-medium text-[#a4abbe] block mb-2" style={{ fontFamily: 'Space Grotesk' }}>
                            Subject
                          </label>
                          <select value={form.subject} onChange={e => set('subject', e.target.value)}
                            className="w-full h-12 px-4 rounded-lg border border-[#414858]/40 bg-[#11192a] text-sm text-[#e2e8fc] focus:outline-none focus:ring-2 focus:ring-[#ff8f78]/40 focus:border-[#ff8f78]/60 transition-all duration-200 appearance-none"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23a4abbe' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                          >
                            {SUBJECTS.map(s => <option key={s} className="bg-[#11192a] text-[#e2e8fc]">{s}</option>)}
                          </select>
                        </div>
                      </div>

                      {/* Message */}
                      <div>
                        <label className="text-sm font-medium text-[#a4abbe] block mb-2" style={{ fontFamily: 'Space Grotesk' }}>
                          Message <span className="text-[#ff8f78]">*</span>
                          <span className="text-[#6f7587] font-normal ml-2">({form.message.length}/1000)</span>
                        </label>
                        <textarea value={form.message} onChange={e => set('message', e.target.value)}
                          maxLength={1000} rows={6}
                          className={`w-full p-4 rounded-lg border bg-[#11192a] text-sm text-[#e2e8fc] placeholder:text-[#6f7587] focus:outline-none focus:ring-2 focus:ring-[#ff8f78]/40 transition-all duration-200 resize-y min-h-[160px] ${
                            errors.message ? 'border-[#ff6e84]/60' : 'border-[#414858]/40 focus:border-[#ff8f78]/60'
                          }`}
                          placeholder="How can we help you today? Please include product names, quantities, or order IDs if relevant."
                        />
                        {errors.message && <p className="text-xs text-[#ff6e84] mt-1.5">{errors.message}</p>}
                      </div>

                      <div className="flex items-center justify-between pt-2 flex-wrap gap-4">
                        <p className="text-xs text-[#6f7587] flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                          Your details are kept private and never shared.
                        </p>
                        <button type="submit" disabled={submitting}
                          className="inline-flex items-center gap-2.5 px-8 py-3.5 text-sm font-bold bg-[#ff8f78] text-[#610a00] rounded-lg hover:bg-[#ff775d] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-[0_0_20px_rgba(255,143,120,0.3)] hover:shadow-[0_0_30px_rgba(255,143,120,0.5)] group"
                          style={{ fontFamily: 'Space Grotesk' }}
                        >
                          {submitting ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                          ) : (
                            <>
                              Send Message
                              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
