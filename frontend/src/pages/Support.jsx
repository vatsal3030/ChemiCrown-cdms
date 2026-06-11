import { useState } from 'react';
import {
  HelpCircle, ChevronDown, ChevronUp, Mail, Phone, MessageSquare,
  FileText, AlertTriangle, FlaskConical, Shield, BookOpen, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const FAQ_ITEMS = [
  {
    category: 'Orders & Purchasing',
    icon: FileText,
    items: [
      { q: 'How do I place an order for a chemical?', a: 'Browse the Product Catalog, add items to your cart, and proceed to Checkout. You can choose between Online Payment (Razorpay) or Pay on Delivery. Pay on Delivery orders require manual verification by an admin before processing.' },
      { q: 'Can I cancel an order after placing it?', a: 'Yes, orders in "Requested" or "Pending" status can be cancelled from My Orders. Once an order moves to Processing, it cannot be cancelled through the system — contact your account manager.' },
      { q: 'What is the minimum order quantity (MOQ)?', a: 'MOQ varies by product and is specified on the product detail page. Bulk orders above the listed quantity may qualify for volume pricing.' },
      { q: 'How do I get a quotation or proforma invoice?', a: 'Quotations are generated automatically upon order creation. Contact your account manager for custom quotations for large volumes.' },
    ]
  },
  {
    category: 'Chemical Safety & Compliance',
    icon: AlertTriangle,
    items: [
      { q: 'Where can I find the Safety Data Sheet (SDS) for a product?', a: 'SDS documents are available on each product\'s detail page. Look for the "Download SDS" button. If no SDS is listed, contact your account manager.' },
      { q: 'How are hazardous chemicals handled and shipped?', a: 'All hazardous chemicals are classified per the UN/GHS system. They are packed per IATA/ADR regulations. The UN number and hazard class are displayed on every product listing.' },
      { q: 'What does the CAS number mean?', a: 'CAS (Chemical Abstracts Service) Registry Number is a unique identifier for every chemical substance. It helps you verify the exact compound you are ordering.' },
      { q: 'Are all products compliant with Indian Chemicals Regulations?', a: 'Yes. All products sold through ChemiCrown comply with the Environment Protection Act, Manufacture Storage and Import of Hazardous Chemical Rules, and applicable BIS standards.' },
    ]
  },
  {
    category: 'Inventory & Stock',
    icon: FlaskConical,
    items: [
      { q: 'How is low stock monitored?', a: 'Each product has a configurable Low Stock Alert Threshold. When stock drops below this level, a notification is sent to the Inventory Manager and relevant staff automatically.' },
      { q: 'Can I reserve stock for future orders?', a: 'Currently, the system deducts stock upon order confirmation. To reserve stock, please coordinate with your Inventory Manager directly.' },
    ]
  },
  {
    category: 'HR & Payroll',
    icon: Shield,
    items: [
      { q: 'How do I apply for leave?', a: 'Navigate to My Dashboard (sidebar → My Attendance) and click "Request Leave". Fill in the date, type, and reason. Your manager will be notified and will approve/reject the request.' },
      { q: 'How do I confirm my salary receipt?', a: 'When your salary is paid, you\'ll receive a notification. Go to My Dashboard → Salary History and click "Confirm Receipt" next to the paid month.' },
      { q: 'Who can mark attendance?', a: 'Attendance can only be marked by HR (Manager/Owner/Super Admin). Employees cannot mark their own attendance to prevent fraud. You can submit leave requests which, once approved, auto-update your attendance.' },
    ]
  },
];

export default function Support() {
  const { token } = useAuth();
  const [openItems, setOpenItems] = useState({});
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const toggle = (key) => setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));

  const handleContact = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type: 'OTHER',
          priority: 'MEDIUM',
          title: contactForm.subject,
          description: `From: ${contactForm.name} (${contactForm.email})\n\n${contactForm.message}`
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Message sent! We\'ll get back to you shortly.');
        setContactForm({ name: '', email: '', subject: '', message: '' });
      } else {
        toast.error(json.message || 'Failed to send');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      {/* Header */}
      <div className="page-header mb-0">
        <div className="page-header-icon bg-primary/10 text-primary">
          <HelpCircle size={22} />
        </div>
        <div>
          <h1 className="page-title">Help & Support</h1>
          <p className="page-subtitle">Answers, documentation, and contact options for ChemiCrown CDMS users.</p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: BookOpen, label: 'Documentation', color: 'bg-blue-500/10 text-blue-600', href: '#faq' },
          { icon: AlertTriangle, label: 'Report Issue', color: 'bg-red-500/10 text-red-600', href: '/dashboard/report-issue' },
          { icon: MessageSquare, label: 'Contact Team', color: 'bg-green-500/10 text-green-600', href: '#contact' },
          { icon: Shield, label: 'Safety Guidelines', color: 'bg-amber-500/10 text-amber-600', href: '#safety' },
        ].map(item => (
          <a
            key={item.label}
            href={item.href}
            className="kpi-card text-center flex flex-col items-center gap-3 py-5 hover:scale-[1.02] transition-transform"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
              <item.icon size={20} />
            </div>
            <span className="text-sm font-semibold text-foreground">{item.label}</span>
          </a>
        ))}
      </div>

      {/* Chemical Safety Notice */}
      <div id="safety" className="bg-amber-50 border-l-4 border-amber-500 dark:bg-amber-900/20 dark:border-amber-600 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-bold text-amber-900 dark:text-amber-300 mb-1">⚠️ Chemical Safety Policy</h2>
            <ul className="text-sm text-amber-800 dark:text-amber-400 space-y-1 list-disc list-inside">
              <li>All chemicals must be handled by trained and authorized personnel only.</li>
              <li>Verify CAS and UN numbers before placing any order.</li>
              <li>Ensure proper storage and PPE before accepting delivery of hazardous materials.</li>
              <li>In case of emergency, contact local emergency services and refer to the product's SDS.</li>
              <li>Unauthorized ordering or mishandling of Class I/II hazardous materials is a violation of company policy and Indian law.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div id="faq" className="space-y-6">
        <h2 className="text-xl font-bold text-foreground border-l-4 border-primary pl-4">Frequently Asked Questions</h2>
        {FAQ_ITEMS.map(cat => (
          <div key={cat.category} className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <cat.icon size={16} className="text-primary" />
              <h3 className="font-semibold text-base text-foreground">{cat.category}</h3>
            </div>
            {cat.items.map((item, i) => {
              const key = `${cat.category}-${i}`;
              return (
                <div key={key} className="data-table-wrapper overflow-visible">
                  <button
                    onClick={() => toggle(key)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/40 transition-colors rounded-2xl"
                  >
                    <span className="font-medium text-sm text-foreground pr-4">{item.q}</span>
                    {openItems[key] ? <ChevronUp size={16} className="text-muted-foreground shrink-0" /> : <ChevronDown size={16} className="text-muted-foreground shrink-0" />}
                  </button>
                  {openItems[key] && (
                    <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3 mx-4 mb-2">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Contact Form */}
      <div id="contact" className="form-card">
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <MessageSquare size={18} className="text-primary" />
          <h2 className="text-lg font-bold text-foreground">Contact Support</h2>
        </div>
        <form onSubmit={handleContact} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Your Name</label>
              <input
                type="text"
                value={contactForm.name}
                onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))}
                placeholder="John Doe"
                required
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="form-label">Email Address</label>
              <input
                type="email"
                value={contactForm.email}
                onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@company.com"
                required
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="form-label">Subject</label>
            <input
              type="text"
              value={contactForm.subject}
              onChange={e => setContactForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="Brief description of your query..."
              required
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="form-label">Message</label>
            <textarea
              value={contactForm.message}
              onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Describe your query in detail..."
              required
              rows={4}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              <Mail size={16} className="mr-2" />
              {submitting ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
