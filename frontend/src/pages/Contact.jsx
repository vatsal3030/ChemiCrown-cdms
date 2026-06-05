import { Mail, Phone, MapPin, Send } from 'lucide-react';

export default function Contact() {
  return (
    <div className="flex flex-col flex-1 pb-24">
      {/* Page Header */}
      <div className="bg-muted py-16 md:py-24 border-b border-border">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Contact Support</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Have a question about our chemicals, bulk pricing, or your recent order? Our team is here to help you.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-16 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Get in Touch</h2>
              <p className="text-muted-foreground mb-8">
                We typically respond to all inquiries within 24 business hours. For urgent matters regarding hazardous shipments, please use the phone number provided.
              </p>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Headquarters</h3>
                <p className="text-muted-foreground mt-1">Plot No - 26, Shed No - 4,<br/>Madhav Industrial Park,<br/>Nr. Nari Chokwdi, Vartej,<br/>Bhavnagar. 364004</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-secondary/10 p-3 rounded-lg">
                <Phone className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Phone & Contact</h3>
                <p className="text-muted-foreground mt-1">Narendrasinh Solanki<br/>+91 - 7043180599<br/>+91 - 8530903009</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-success/10 p-3 rounded-lg">
                <Mail className="h-6 w-6 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Email</h3>
                <p className="text-muted-foreground mt-1">chemicrown402@gmail.com</p>
              </div>
            </div>
            
            {/* Google Maps Embed */}
            <div className="mt-8 rounded-2xl overflow-hidden border border-border shadow-sm">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3705.518868661706!2d72.0913936154035!3d21.75892538560822!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395f50a80e729a8f%3A0xc3af7a86f0606ec0!2sVartej%2C%20Bhavnagar%2C%20Gujarat!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin" 
                width="100%" 
                height="250" 
                style={{ border: 0 }} 
                allowFullScreen="" 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="ChemiCrown Location"
              ></iframe>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border p-8 md:p-10 rounded-2xl shadow-sm">
              <h3 className="text-2xl font-bold text-foreground mb-8">Send us a Message</h3>
              
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Full Name</label>
                    <input 
                      type="text" 
                      className="w-full h-12 px-4 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow" 
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email Address</label>
                    <input 
                      type="email" 
                      className="w-full h-12 px-4 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow" 
                      placeholder="john@company.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Subject</label>
                  <select className="w-full h-12 px-4 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow text-foreground">
                    <option>Bulk Order Inquiry</option>
                    <option>Technical Datasheet Request</option>
                    <option>Logistics & Shipping</option>
                    <option>Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Message</label>
                  <textarea 
                    className="w-full min-h-[150px] p-4 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow resize-y" 
                    placeholder="How can we help you today?"
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  className="inline-flex items-center justify-center px-8 py-3.5 w-full md:w-auto text-base font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
