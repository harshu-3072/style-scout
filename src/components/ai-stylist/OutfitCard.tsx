import { Heart, ShoppingBag, Bookmark, BookmarkCheck, ExternalLink, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface OutfitItem {
  type: string;
  name: string;
  price: number;
  platform: string;
}

export interface ParsedOutfit {
  name: string;
  items: OutfitItem[];
}

const PLATFORM_SEARCH_URLS: Record<string, (query: string) => string> = {
  amazon: (q) => `https://www.amazon.in/s?k=${encodeURIComponent(q)}`,
  myntra: (q) => `https://www.myntra.com/${encodeURIComponent(q.replace(/\s+/g, "-"))}`,
  flipkart: (q) => `https://www.flipkart.com/search?q=${encodeURIComponent(q)}`,
  ajio: (q) => `https://www.ajio.com/search/?text=${encodeURIComponent(q)}`,
  meesho: (q) => `https://www.meesho.com/search?q=${encodeURIComponent(q)}`,
  "h&m": (q) => `https://www2.hm.com/en_in/search-results.html?q=${encodeURIComponent(q)}`,
  zara: (q) => `https://www.zara.com/in/en/search?searchTerm=${encodeURIComponent(q)}`,
  google: (q) => `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(q)}`,
};

function getSearchUrl(platform: string, productName: string): string | null {
  if (platform.toLowerCase() === "own wardrobe") return null;
  const key = platform.toLowerCase();
  const builder = PLATFORM_SEARCH_URLS[key] || PLATFORM_SEARCH_URLS.google;
  return builder(productName);
}

function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    amazon: "bg-orange-500/15 text-orange-600 border-orange-500/30",
    myntra: "bg-pink-500/15 text-pink-600 border-pink-500/30",
    flipkart: "bg-blue-500/15 text-blue-600 border-blue-500/30",
    ajio: "bg-purple-500/15 text-purple-600 border-purple-500/30",
    meesho: "bg-rose-500/15 text-rose-600 border-rose-500/30",
    "h&m": "bg-red-500/15 text-red-600 border-red-500/30",
    zara: "bg-neutral-500/15 text-neutral-700 border-neutral-500/30",
    "own wardrobe": "bg-green-500/15 text-green-600 border-green-500/30",
  };
  return colors[platform.toLowerCase()] || "bg-muted text-muted-foreground border-border";
}

interface OutfitCardProps {
  outfit: ParsedOutfit;
  onSaveLook: (outfit: ParsedOutfit) => void;
  addToWishlist: (product: any) => void;
  addToCart: (product: any) => void;
  isSaved?: boolean;
}

export function OutfitCard({ outfit, onSaveLook, addToWishlist, addToCart, isSaved }: OutfitCardProps) {
  const totalPrice = outfit.items.reduce((s, i) => s + i.price, 0);
  const ownItems = outfit.items.filter((i) => i.platform.toLowerCase() === "own wardrobe").length;

  return (
    <div className="rounded-xl bg-card border border-border p-4 text-left shadow-card hover:shadow-lg transition-shadow group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-display font-semibold text-sm leading-tight">{outfit.name}</h4>
          {ownItems > 0 && (
            <span className="text-[10px] text-green-600 font-medium mt-0.5 inline-block">
              ✓ Uses {ownItems} item{ownItems > 1 ? "s" : ""} from your wardrobe
            </span>
          )}
        </div>
        <button
          onClick={() => onSaveLook(outfit)}
          className={`p-1.5 rounded-md transition-colors ${
            isSaved
              ? "text-gold bg-gold/10"
              : "hover:bg-gold/10 hover:text-gold text-muted-foreground"
          }`}
          title={isSaved ? "Already saved" : "Save this look"}
        >
          {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
        </button>
      </div>

      {/* Items */}
      <div className="space-y-2.5 mb-3">
        {outfit.items.map((item, ii) => {
          const searchUrl = getSearchUrl(item.platform, item.name);
          const isOwn = item.platform.toLowerCase() === "own wardrobe";

          return (
            <div key={ii} className="rounded-lg bg-secondary/50 p-2.5 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {item.type}
                  </span>
                  <p className="text-xs font-medium leading-snug truncate">{item.name}</p>
                </div>
                <span className={`text-xs font-bold whitespace-nowrap ${isOwn ? "text-green-600" : ""}`}>
                  {isOwn ? "Free" : `₹${item.price.toLocaleString()}`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 h-5 font-medium ${getPlatformColor(item.platform)}`}
                >
                  {item.platform}
                </Badge>
                {!isOwn && (
                  <div className="flex items-center gap-0.5">
                    {searchUrl && (
                      <a
                        href={searchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded-md hover:bg-primary/10 text-primary transition-colors"
                        title={`Search on ${item.platform}`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => addToWishlist({ name: item.name, price: item.price, platform: item.platform, url: searchUrl })}
                      className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title="Add to wishlist"
                    >
                      <Heart className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => addToCart({ name: item.name, price: item.price, platform: item.platform, url: searchUrl })}
                      className="p-1 rounded-md hover:bg-gold/10 text-muted-foreground hover:text-gold transition-colors"
                      title="Add to cart"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border pt-3">
        <div>
          <span className="font-display font-bold text-sm">₹{totalPrice.toLocaleString()}</span>
          {ownItems > 0 && (
            <span className="text-[10px] text-muted-foreground ml-1.5">
              ({ownItems} owned)
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={() => {
            const buyItems = outfit.items.filter((i) => i.platform.toLowerCase() !== "own wardrobe");
            if (buyItems.length === 0) return;
            // Open first item search as a quick action
            const url = getSearchUrl(buyItems[0].platform, buyItems[0].name);
            if (url) window.open(url, "_blank");
          }}
        >
          <Tag className="w-3 h-3" /> Shop This Look
        </Button>
      </div>
    </div>
  );
}
