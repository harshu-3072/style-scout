import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, MessageSquare, Clock, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message Sent!",
      description: "We'll get back to you within 24 hours.",
    });
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Email",
      value: "support@stylesnap.com",
      description: "We respond within 24 hours",
    },
    {
      icon: Phone,
      title: "Phone",
      value: "+91 1800-XXX-XXXX",
      description: "Toll-free, Mon-Sat",
    },
    {
      icon: MapPin,
      title: "Office",
      value: "Bangalore, India",
      description: "Tech Hub, HSR Layout",
    },
    {
      icon: Clock,
      title: "Support Hours",
      value: "9 AM - 9 PM IST",
      description: "Monday to Saturday",
    },
  ];

  const faqItems = [
    {
      question: "How does Snap Search work?",
      answer: "Simply upload or capture a photo of any fashion item, and our AI will find similar products across all major e-commerce platforms instantly.",
    },
    {
      question: "Is StyleSnap free to use?",
      answer: "Yes! Basic features including Snap Search and Price Compare are completely free. Premium features are available with our subscription plans.",
    },
    {
      question: "Which platforms do you compare prices from?",
      answer: "We compare prices from Amazon, Myntra, Flipkart, Meesho, Ajio, Nykaa, and many more platforms.",
    },
    {
      question: "How accurate is the AI Stylist?",
      answer: "Our AI Stylist learns from your preferences and style history to provide increasingly accurate recommendations over time.",
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Get in <span className="text-gradient-gold">Touch</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Have questions? We'd love to hear from you. Our team is always ready to help you with anything you need.
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16 -mt-8">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-card border border-border shadow-card hover:shadow-elevated transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-4">
                  <info.icon className="w-6 h-6 text-gold" />
                </div>
                <h3 className="font-semibold mb-1">{info.title}</h3>
                <p className="font-display text-lg font-medium mb-1">{info.value}</p>
                <p className="text-sm text-muted-foreground">{info.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & FAQ */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-gold" />
                </div>
                <h2 className="font-display text-2xl font-bold">Send us a Message</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name</label>
                    <Input
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="h-12"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="h-12"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Subject</label>
                  <Input
                    placeholder="How can we help?"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                    className="h-12"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <Textarea
                    placeholder="Tell us more about your inquiry..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={5}
                    className="resize-none"
                  />
                </div>
                
                <Button variant="hero" size="lg" type="submit" className="w-full sm:w-auto">
                  <Send className="w-4 h-4" />
                  Send Message
                </Button>
              </form>
            </div>

            {/* FAQ */}
            <div>
              <h2 className="font-display text-2xl font-bold mb-8">
                Frequently Asked Questions
              </h2>
              <div className="space-y-6">
                {faqItems.map((item, i) => (
                  <div
                    key={i}
                    className="p-6 rounded-xl bg-secondary/50 border border-border"
                  >
                    <h3 className="font-semibold mb-2">{item.question}</h3>
                    <p className="text-sm text-muted-foreground">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Care Banner */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-bold mb-4">
            Need Immediate Assistance?
          </h2>
          <p className="text-primary-foreground/70 mb-6 max-w-xl mx-auto">
            Our customer care team is available 9 AM - 9 PM IST to help you with any queries.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="gold" size="lg">
              <Phone className="w-4 h-4" />
              Call Us Now
            </Button>
            <Button variant="elegant" size="lg" className="border-primary-foreground/30 text-primary-foreground hover:border-gold hover:text-gold">
              <MessageSquare className="w-4 h-4" />
              Live Chat
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
