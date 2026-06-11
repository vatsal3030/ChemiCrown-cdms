export default function TermsOfService() {
  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: [
        'By registering for or using the ChemiCrown CDMS platform, you agree to be bound by these Terms of Service.',
        'These terms apply to all users including customers, employees, managers, and administrators.',
        'If you do not agree to these terms, you must not use our platform.',
      ],
    },
    {
      title: '2. Eligibility',
      content: [
        'You must be at least 18 years old and a registered business entity to place orders on ChemiCrown CDMS.',
        'Your business must be legally authorized to purchase, handle, and use chemical products as per applicable Indian laws and regulations.',
        'You are responsible for ensuring your organization complies with all relevant chemical safety and environmental regulations.',
      ],
    },
    {
      title: '3. Account Responsibilities',
      content: [
        'You are responsible for maintaining the confidentiality of your account credentials.',
        'All activity under your account is your responsibility.',
        'You must notify us immediately of any unauthorized use of your account at chemicrown402@gmail.com.',
        'ChemiCrown reserves the right to terminate accounts that violate these terms.',
      ],
    },
    {
      title: '4. Orders and Payments',
      content: [
        'All prices are listed in Indian Rupees (INR) and are subject to change without notice.',
        'Orders are subject to product availability and management approval.',
        'Pay on Delivery orders require admin verification before processing.',
        'ChemiCrown reserves the right to cancel any order that appears fraudulent or violates these terms.',
        'GST (18%) is applicable on all product transactions as per Indian tax law.',
      ],
    },
    {
      title: '5. Replacement and Return Policy',
      content: [
        'Claims for damaged or incorrect items must be reported within 48 hours of delivery with photographic evidence.',
        'Products that are tampered with, improperly stored, or used incorrectly are not eligible for replacement.',
        'Replacement decisions are at the sole discretion of ChemiCrown management after inspection.',
        'Refunds for cancelled orders will be processed within 5–7 business days via the original payment method.',
        'Hazardous materials returned incorrectly may be subject to additional handling fees.',
      ],
    },
    {
      title: '6. Chemical Product Safety',
      content: [
        'All chemical products must be handled, stored, and used in accordance with the Safety Data Sheets (SDS) provided.',
        'Customers are solely responsible for ensuring safe handling, PPE compliance, and adherence to all applicable safety regulations.',
        'ChemiCrown is not liable for any injuries, accidents, or environmental damage resulting from improper handling of purchased chemicals.',
        'Certain restricted chemicals may require additional documentation and compliance before purchase approval.',
      ],
    },
    {
      title: '7. Intellectual Property',
      content: [
        'All content on the ChemiCrown CDMS platform, including product descriptions, logos, and software, is the property of ChemiCrown.',
        'You may not reproduce, distribute, or create derivative works without written permission.',
      ],
    },
    {
      title: '8. Limitation of Liability',
      content: [
        'ChemiCrown shall not be liable for indirect, incidental, or consequential damages arising from use of our platform.',
        'Our total liability is limited to the value of the specific order in dispute.',
        'We are not responsible for delays caused by logistics partners, natural disasters, or government regulations.',
      ],
    },
    {
      title: '9. Governing Law',
      content: [
        'These terms are governed by the laws of India.',
        'Any disputes shall be subject to the jurisdiction of courts in Bhavnagar, Gujarat, India.',
      ],
    },
    {
      title: '10. Changes to Terms',
      content: [
        'We reserve the right to modify these Terms at any time.',
        'Changes will be notified via email or platform notifications.',
        'Continued use of the platform after changes constitutes acceptance of the new terms.',
      ],
    },
    {
      title: '11. Contact',
      content: [
        'For questions about these Terms, contact: chemicrown402@gmail.com',
        'ChemiCrown — Plot No - 26, Shed No - 4, Madhav Industrial Park, Vartej, Bhavnagar – 364004',
      ],
    },
  ];

  return (
    <div className="flex flex-col flex-1 pb-24">
      {/* Hero */}
      <div className="bg-muted py-12 md:py-16 border-b border-border">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Terms of Service</h1>
          <p className="text-muted-foreground text-sm">Last updated: June 2025</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
          These Terms of Service govern your access to and use of ChemiCrown CDMS. Please read them carefully before using our platform.
        </p>

        <div className="space-y-8">
          {sections.map(({ title, content }) => (
            <div key={title}>
              <h2 className="text-lg font-bold text-foreground mb-3">{title}</h2>
              <ul className="space-y-2">
                {content.map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-primary mt-1 shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
