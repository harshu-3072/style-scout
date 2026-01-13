import { Link } from "react-router-dom";
import { Sparkles, Instagram, Twitter, Facebook, Youtube } from "lucide-react";

const Footer = () => {
  const footerLinks = {
    shop: [
      { name: "Snap Search", path: "/snap-search" },
      { name: "Price Compare", path: "/compare" },
      { name: "AI Stylist", path: "/ai-stylist" },
      { name: "Trending", path: "/" },
    ],
    support: [
      { name: "Contact Us", path: "/contact" },
      { name: "FAQs", path: "/" },
      { name: "Track Order", path: "/" },
      { name: "Returns", path: "/" },
    ],
    company: [
      { name: "About Us", path: "/about" },
      { name: "Careers", path: "/" },
      { name: "Press", path: "/" },
      { name: "Blog", path: "/" },
    ],
    legal: [
      { name: "Privacy Policy", path: "/" },
      { name: "Terms of Service", path: "/" },
      { name: "Cookie Policy", path: "/" },
    ],
  };

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="font-display text-xl font-semibold">
                StyleSnap
              </span>
            </Link>
            <p className="text-sm text-primary-foreground/70 mb-6">
              Your AI-powered fashion companion for smarter shopping.
            </p>
            <div className="flex items-center gap-3">
              {[Instagram, Twitter, Facebook, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 rounded-full border border-primary-foreground/20 flex items-center justify-center hover:bg-gold hover:border-gold transition-colors group"
                >
                  <Icon className="w-4 h-4 group-hover:text-accent-foreground" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-display text-sm font-semibold uppercase tracking-wider mb-4">
                {title}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className="text-sm text-primary-foreground/70 hover:text-gold transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-primary-foreground/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-primary-foreground/50">
            © 2024 StyleSnap. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <img
              src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/visa.svg"
              alt="Visa"
              className="h-6 opacity-50 invert"
            />
            <img
              src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/mastercard.svg"
              alt="Mastercard"
              className="h-6 opacity-50 invert"
            />
            <img
              src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/paypal.svg"
              alt="PayPal"
              className="h-6 opacity-50 invert"
            />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
