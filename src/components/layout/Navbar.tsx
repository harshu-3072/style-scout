import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Search, ShoppingBag, User, Heart, Sparkles, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Snap Search", path: "/snap-search" },
    { name: "Compare", path: "/compare" },
    { name: "AI Stylist", path: "/ai-stylist" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="font-display text-xl font-semibold tracking-tight">
              StyleSnap
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-gold relative py-1",
                  isActive(link.path)
                    ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gold"
                    : "text-muted-foreground"
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Search className="w-5 h-5" />
            </Button>
            {user ? (
              <>
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/account/wishlist">
                    <Heart className="w-5 h-5" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/account/cart">
                    <ShoppingBag className="w-5 h-5" />
                  </Link>
                </Button>
                <Button variant="gold" size="sm" className="ml-2" asChild>
                  <Link to="/account">
                    <User className="w-4 h-4" />
                    Account
                  </Link>
                </Button>
              </>
            ) : (
              <Button variant="gold" size="sm" className="ml-2" asChild>
                <Link to="/sign-in">
                  <User className="w-4 h-4" />
                  Sign In
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden py-4 border-t border-border/50 animate-fade-in">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive(link.path)
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/50"
                  )}
                >
                  {link.name}
                </Link>
              ))}
              <div className="flex items-center gap-2 px-4 pt-4 mt-2 border-t border-border/50">
                {user ? (
                  <>
                    <Button variant="ghost" size="icon" asChild>
                      <Link to="/account/wishlist" onClick={() => setIsOpen(false)}>
                        <Heart className="w-5 h-5" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <Link to="/account/cart" onClick={() => setIsOpen(false)}>
                        <ShoppingBag className="w-5 h-5" />
                      </Link>
                    </Button>
                    <Button variant="gold" size="sm" className="ml-auto" asChild>
                      <Link to="/account" onClick={() => setIsOpen(false)}>
                        <User className="w-4 h-4" />
                        Account
                      </Link>
                    </Button>
                  </>
                ) : (
                  <Button variant="gold" size="sm" className="ml-auto" asChild>
                    <Link to="/sign-in" onClick={() => setIsOpen(false)}>
                      <User className="w-4 h-4" />
                      Sign In
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
