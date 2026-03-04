import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Heart, ShoppingBag, Star } from "lucide-react";

interface Product {
  name: string;
  price: number;
  originalPrice: number;
  platform: string;
  similarity: number;
  searchQuery: string;
}

const platformUrls: Record<string, (q: string) => string> = {
  Amazon: (q) => `https://www.amazon.in/s?k=${encodeURIComponent(q)}`,
  Myntra: (q) => `https://www.myntra.com/${encodeURIComponent(q.replace(/ /g, "-"))}`,
  Flipkart: (q) => `https://www.flipkart.com/search?q=${encodeURIComponent(q)}`,
  Ajio: (q) => `https://www.ajio.com/search/?text=${encodeURIComponent(q)}`,
  Meesho: (q) => `https://www.meesho.com/search?q=${encodeURIComponent(q)}`,
  Nykaa: (q) => `https://www.nykaa.com/search/result/?q=${encodeURIComponent(q)}`,
};

const platformColors: Record<string, string> = {
  Amazon: "bg-orange-500/15 text-orange-600 border-orange-500/30",
  Myntra: "bg-pink-500/15 text-pink-600 border-pink-500/30",
  Flipkart: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  Ajio: "bg-purple-500/15 text-purple-600 border-purple-500/30",
  Meesho: "bg-rose-500/15 text-rose-600 border-rose-500/30",
  Nykaa: "bg-green-500/15 text-green-600 border-green-500/30",
};

function getProductLink(product: Product) {
  const fn = platformUrls[product.platform];
  return fn ? fn(product.searchQuery) : "#";
}

function getSimilarityColor(similarity: number) {
  if (similarity >= 85) return "bg-emerald-500 text-white";
  if (similarity >= 70) return "bg-accent text-accent-foreground";
  return "bg-muted text-muted-foreground";
}

interface ProductResultCardProps {
  product: Product;
  addToWishlist: (data: any) => void;
  addToCart: (data: any) => void;
}

export function ProductResultCard({ product, addToWishlist, addToCart }: ProductResultCardProps) {
  const link = getProductLink(product);
  const discount = Math.round((1 - product.price / product.originalPrice) * 100);

  return (
    <div className="group rounded-2xl bg-card border border-border overflow-hidden hover:shadow-elevated hover:border-accent/30 transition-all duration-300">
      {/* Match badge at top */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <Badge className={`text-xs font-bold px-2.5 py-1 ${getSimilarityColor(product.similarity)}`}>
          {product.similarity}% Match
        </Badge>
        <Badge variant="outline" className={`text-[10px] font-medium ${platformColors[product.platform] || "border-border"}`}>
          {product.platform}
        </Badge>
      </div>

      <div className="px-5 pb-5 space-y-3">
        <h3 className="font-body font-medium text-sm leading-snug line-clamp-2 min-h-[2.5rem]">{product.name}</h3>

        <div className="flex items-baseline gap-2">
          <span className="font-display text-xl font-bold text-foreground">₹{product.price.toLocaleString()}</span>
          <span className="text-sm text-muted-foreground line-through">₹{product.originalPrice.toLocaleString()}</span>
          {discount > 0 && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
              {discount}% off
            </span>
          )}
        </div>

        <a href={link} target="_blank" rel="noopener noreferrer" className="block">
          <Button variant="gold" size="sm" className="w-full gap-2 shadow-gold/20">
            <ExternalLink className="w-4 h-4" />
            Search on {product.platform}
          </Button>
        </a>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 text-xs hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
            onClick={() => addToWishlist({ name: product.name, price: product.price, platform: product.platform, url: link })}
          >
            <Heart className="w-3.5 h-3.5" />
            Wishlist
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 text-xs hover:bg-accent/10 hover:text-accent hover:border-accent/30"
            onClick={() => addToCart({ name: product.name, price: product.price, platform: product.platform, url: link })}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Cart
          </Button>
        </div>
      </div>
    </div>
  );
}
