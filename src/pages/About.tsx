import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Target, Award, Heart } from "lucide-react";
import aboutImage from "@/assets/about-team.jpg";

const About = () => {
  const values = [
    {
      icon: Target,
      title: "Innovation First",
      description: "Pushing the boundaries of AI and fashion technology to create seamless shopping experiences.",
    },
    {
      icon: Users,
      title: "Customer Centric",
      description: "Every feature we build starts with understanding and solving real customer problems.",
    },
    {
      icon: Award,
      title: "Quality Obsessed",
      description: "We partner only with trusted brands and ensure every recommendation meets high standards.",
    },
    {
      icon: Heart,
      title: "Passion Driven",
      description: "We're fashion enthusiasts at heart, dedicated to making style accessible to everyone.",
    },
  ];

  const stats = [
    { value: "50K+", label: "Happy Users" },
    { value: "1M+", label: "Products Compared" },
    { value: "₹2Cr+", label: "Saved by Users" },
    { value: "99%", label: "Satisfaction Rate" },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Redefining How You{" "}
                <span className="text-gradient-gold">Shop Fashion</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                StyleSnap was born from a simple frustration: spending hours comparing prices across platforms and never knowing if you're getting the best deal. We built the solution we wished existed.
              </p>
              <p className="text-lg text-muted-foreground mb-8">
                Today, we're the leading AI-powered fashion platform, helping thousands of shoppers save time, money, and discover their perfect style.
              </p>
              <Button variant="hero" size="lg" asChild>
                <Link to="/snap-search">
                  Start Shopping Smarter
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gold/20 rounded-3xl blur-2xl" />
              <img
                src={aboutImage}
                alt="StyleSnap Team"
                className="relative rounded-2xl shadow-elevated w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="font-display text-4xl md:text-5xl font-bold text-gold mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-primary-foreground/70 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-4xl font-bold mb-4">Our Values</h2>
            <p className="text-lg text-muted-foreground">
              The principles that guide everything we do at StyleSnap.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-card border border-border hover:border-gold/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 text-gold" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">
                  {value.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display text-4xl font-bold text-center mb-12">
              Our Story
            </h2>
            <div className="prose prose-lg mx-auto text-muted-foreground">
              <p className="mb-6">
                It all started in 2023 when our founders, avid online shoppers themselves, realized they were spending more time comparing prices than actually shopping. The process was fragmented, frustrating, and often led to buyer's remorse.
              </p>
              <p className="mb-6">
                They envisioned a platform that could do all the heavy lifting – comparing prices across every major e-commerce site, using AI to understand personal style preferences, and making fashion advice accessible to everyone, not just those who could afford personal stylists.
              </p>
              <p>
                Today, StyleSnap combines cutting-edge AI technology with deep fashion expertise to create an experience that's intuitive, powerful, and delightful. We're just getting started, and we're excited to have you join us on this journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-dark text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
            Join Our Fashion Revolution
          </h2>
          <p className="text-lg text-primary-foreground/70 max-w-xl mx-auto mb-8">
            Experience the future of fashion shopping. It's free to start.
          </p>
          <Button variant="gold" size="xl" asChild>
            <Link to="/snap-search">
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default About;
