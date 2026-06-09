import { Users, History, Lightbulb, Target } from 'lucide-react';

export default function About() {
  return (
    <div className="flex flex-col flex-1 pb-24">
      {/* Page Header */}
      <div className="bg-muted py-16 md:py-24 border-b border-border">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">About ChemiCrown</h1>
          <p className="text-lg text-muted-foreground max-w-5xl mx-auto">
            Building the foundation of modern manufacturing through reliable, pure, and high-performance chemical solutions since 1995.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-16 max-w-5xl">
        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-24">
          <div className="bg-card border border-border p-8 rounded-2xl shadow-sm">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-foreground">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              To empower industrial growth by delivering uncompromisingly pure chemicals, ensuring seamless supply chains, and maintaining the highest standards of environmental safety and corporate responsibility.
            </p>
          </div>
          
          <div className="bg-card border border-border p-8 rounded-2xl shadow-sm">
            <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-6">
              <Lightbulb className="h-6 w-6 text-secondary" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-foreground">Our Vision</h2>
            <p className="text-muted-foreground leading-relaxed">
              To be the most trusted name in chemical distribution globally, pioneering digital supply chain innovations (like this CDMS platform) to bring absolute transparency to our partners.
            </p>
          </div>
        </div>

        {/* History Timeline */}
        <div className="mb-24">
          <h2 className="text-3xl font-bold mb-12 text-center text-foreground">Our Journey</h2>
          <div className="space-y-10">
            
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="hidden md:flex flex-col items-center">
                <div className="px-4 py-2 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs shrink-0 whitespace-nowrap">Est. 1995</div>
                <div className="h-full w-px bg-border my-2 min-h-[100px]"></div>
              </div>
              <div className="bg-muted/50 p-6 rounded-xl border border-border flex-1">
                <div className="flex items-center gap-4 mb-2 md:hidden">
                  <div className="px-4 py-1.5 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs whitespace-nowrap">Est. 1995</div>
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">Foundation</h3>
                <p className="text-muted-foreground">ChemiCrown was established in a small manufacturing unit, focusing on high-grade GP Thinner for local automotive industries.</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="hidden md:flex flex-col items-center">
                <div className="px-4 py-2 rounded-full bg-secondary flex items-center justify-center text-primary-foreground font-bold text-xs shrink-0 whitespace-nowrap">Year 2010</div>
                <div className="h-full w-px bg-border my-2 min-h-[100px]"></div>
              </div>
              <div className="bg-muted/50 p-6 rounded-xl border border-border flex-1">
                <div className="flex items-center gap-4 mb-2 md:hidden">
                  <div className="px-4 py-1.5 rounded-full bg-secondary flex items-center justify-center text-primary-foreground font-bold text-xs whitespace-nowrap">Year 2010</div>
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">National Expansion</h3>
                <p className="text-muted-foreground">Expanded our portfolio to over 50 chemical variants and established distribution hubs in 5 major Indian states.</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="hidden md:flex flex-col items-center">
                <div className="px-4 py-2 rounded-full bg-success flex items-center justify-center text-primary-foreground font-bold text-xs shrink-0 whitespace-nowrap">Year 2026</div>
              </div>
              <div className="bg-muted/50 p-6 rounded-xl border border-border flex-1">
                <div className="flex items-center gap-4 mb-2 md:hidden">
                  <div className="px-4 py-1.5 rounded-full bg-success flex items-center justify-center text-primary-foreground font-bold text-xs whitespace-nowrap">Year 2026</div>
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">Digital Transformation</h3>
                <p className="text-muted-foreground">Launch of the ChemiCrown CDMS (Chemical Distribution Management System), revolutionizing how our customers order and track inventory.</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
