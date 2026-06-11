export default function PrivacyPolicy() {
  const sections = [
    {
      title: '1. Information We Collect',
      content: [
        'When you use ChemiCrown CDMS, we collect information you provide directly, such as your name, email address, phone number, company name, GST number, and shipping address when you register or place an order.',
        'We also collect usage data including your IP address, browser type, pages visited, and actions taken within the platform to improve our services.',
        'Payment information is processed securely through Razorpay and is not stored on our servers.',
      ],
    },
    {
      title: '2. How We Use Your Information',
      content: [
        'To process and fulfill your chemical product orders.',
        'To communicate with you about order status, shipments, invoices, and account updates.',
        'To verify your business identity and GST compliance.',
        'To send you important notices about service changes, safety recalls, or regulatory updates affecting chemical products.',
        'To improve our platform, detect fraud, and ensure platform security.',
      ],
    },
    {
      title: '3. Sharing of Information',
      content: [
        'We do not sell, trade, or rent your personal information to third parties.',
        'We may share information with trusted service providers (logistics, payment processors) strictly for order fulfillment.',
        'We may disclose information if required by law, court order, or government regulation — particularly for hazardous material compliance.',
      ],
    },
    {
      title: '4. Data Retention',
      content: [
        'We retain your data for as long as your account is active or as needed to provide services.',
        'Order records, invoices, and transaction histories are retained for a minimum of 7 years as required by Indian GST and tax laws.',
        'You may request deletion of non-mandatory data by contacting our support team.',
      ],
    },
    {
      title: '5. Data Security',
      content: [
        'All data is transmitted over HTTPS/TLS encryption.',
        'Passwords are hashed using bcrypt and are never stored in plaintext.',
        'Access to customer data is restricted to authorized personnel only.',
        'We conduct regular security reviews and maintain audit logs of sensitive operations.',
      ],
    },
    {
      title: '6. Cookies',
      content: [
        'We use essential cookies to keep you logged in and maintain your session.',
        'We do not use advertising or tracking cookies.',
        'You can disable cookies in your browser settings, but some features may not function correctly.',
      ],
    },
    {
      title: '7. Your Rights',
      content: [
        'You have the right to access, correct, or delete your personal information.',
        'You may request a copy of the data we hold about you.',
        'To exercise these rights, contact us at chemicrown402@gmail.com.',
      ],
    },
    {
      title: '8. Contact Us',
      content: [
        'If you have questions about this Privacy Policy, please contact: chemicrown402@gmail.com',
        'ChemiCrown — Plot No - 26, Shed No - 4, Madhav Industrial Park, Vartej, Bhavnagar – 364004',
      ],
    },
  ];

  return (
    <div className="flex flex-col flex-1 pb-24">
      {/* Hero */}
      <div className="bg-muted py-12 md:py-16 border-b border-border">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm">Last updated: June 2025</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
          ChemiCrown ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our Chemical Distribution Management System (CDMS) platform and services.
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
