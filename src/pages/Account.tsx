import { useState, useEffect } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { User, Heart, ShoppingBag, MapPin, Package, LogOut, Shirt } from "lucide-react";

const accountLinks = [
  { name: "Profile", path: "/account", icon: User },
  { name: "Wardrobe", path: "/account/wardrobe", icon: Shirt },
  { name: "Wishlist", path: "/account/wishlist", icon: Heart },
  { name: "Cart", path: "/account/cart", icon: ShoppingBag },
  { name: "Orders", path: "/account/orders", icon: Package },
  { name: "Addresses", path: "/account/addresses", icon: MapPin },
];

const Account = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h1 className="font-display text-3xl font-bold mb-8">My Account</h1>
        <div className="grid lg:grid-cols-[260px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="space-y-1">
            {accountLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === link.path
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/50"
                )}
              >
                <link.icon className="w-4 h-4" />
                {link.name}
              </Link>
            ))}
            <button
              onClick={signOut}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </aside>

          {/* Content */}
          <div className="min-h-[50vh]">
            <Outlet />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Account;
