import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Camera, BarChart3, Sparkles, ArrowRight, Star, Shield, Zap } from "lucide-react";
import heroImage from "@/assets/hero-fashion.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Fashion hero"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40 dark:from-background/98 dark:via-background/85 dark:to-background/50" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/80 backdrop-blur-sm border border-border mb-6 animate-fade-up">
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="text-sm font-medium">AI-Powered Fashion Shopping</span>
          </div>
          
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            Shop Smarter with{" "}
            <span className="text-gradient-gold">StyleSnap</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-fade-up" style={{ animationDelay: "0.2s" }}>
            Snap a photo, compare prices across top brands, and get AI-powered outfit recommendations. Your personal fashion assistant awaits.
          </p>
          
          <div className="flex flex-wrap gap-4 animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <Button variant="hero" size="xl" asChild>
              <Link to="/snap-search">
                <Camera className="w-5 h-5" />
                Try Snap Search
              </Link>
            </Button>
            <Button variant="hero-outline" size="xl" asChild>
              <Link to="/ai-stylist">
                <Sparkles className="w-5 h-5" />
                Meet AI Stylist
              </Link>
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center gap-6 mt-12 pt-8 border-t border-border/50 animate-fade-up" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 text-gold fill-gold" />
                ))}
              </div>
              <span className="text-sm font-medium">4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4 text-gold" />
              <span>Secure Shopping</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="w-4 h-4 text-gold" />
              <span>50k+ Happy Users</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({
  icon: Icon,
  title,
  description,
  link,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  link: string;
}) => (
  <Link
    to={link}
    className="group block p-8 rounded-2xl bg-card border border-border hover:border-gold/50 shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1"
  >
    <div className="w-14 h-14 rounded-xl bg-gold/10 flex items-center justify-center mb-6 group-hover:bg-gold/20 transition-colors">
      <Icon className="w-7 h-7 text-gold" />
    </div>
    <h3 className="font-display text-xl font-semibold mb-3">{title}</h3>
    <p className="text-muted-foreground mb-4">{description}</p>
    <div className="flex items-center gap-2 text-gold font-medium">
      <span>Explore</span>
      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
    </div>
  </Link>
);

const FeaturesSection = () => {
  const features = [
    {
      icon: Camera,
      title: "Snap Search",
      description: "Upload or capture any fashion item photo to instantly find similar products across all major platforms.",
      link: "/snap-search",
    },
    {
      icon: BarChart3,
      title: "Price Compare",
      description: "Compare prices from Amazon, Myntra, Flipkart, Meesho and more. Always get the best deal guaranteed.",
      link: "/compare",
    },
    {
      icon: Sparkles,
      title: "AI Fashion Stylist",
      description: "Get personalized outfit recommendations and styling tips from your AI-powered fashion assistant.",
      link: "/ai-stylist",
    },
  ];

  return (
    <section className="py-24 bg-secondary/30 dark:bg-secondary/10">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Shop Smarter, Not Harder
          </h2>
          <p className="text-lg text-muted-foreground">
            Discover our powerful features designed to revolutionize your fashion shopping experience.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <FeatureCard key={i} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

const BrandsSection = () => {
  const brands = ["Amazon", "Myntra", "Flipkart", "Meesho", "Ajio", "Nykaa"];

  return (
    <section className="py-16 border-y border-border">
      <div className="container mx-auto px-4">
        <p className="text-center text-sm text-muted-foreground mb-8 uppercase tracking-wider">
          Compare prices across top platforms
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {brands.map((brand) => (
            <span
              key={brand}
              className="text-2xl md:text-3xl font-display font-semibold text-muted-foreground/50 hover:text-foreground transition-colors cursor-default"
            >
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

const CTASection = () => {
  return (
    <section className="py-24 bg-gradient-dark text-primary-foreground">
      <div className="container mx-auto px-4 text-center">
        <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
          Ready to Transform Your Shopping?
        </h2>
        <p className="text-lg text-primary-foreground/70 max-w-2xl mx-auto mb-10">
          Join thousands of fashion-forward shoppers who save time and money with StyleSnap's AI-powered platform.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button variant="gold" size="xl" asChild>
            <Link to="/snap-search">
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

const Index = () => {
  return (
    <>
      <HeroSection />
      <BrandsSection />
      <FeaturesSection />
      <CTASection />
    </>
  );
};

export default Index;
