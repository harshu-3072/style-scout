import { useState } from "react";
import { Heart, ShoppingBag, Bookmark, BookmarkCheck, ExternalLink, Tag, BarChart3, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PriceCompareModal } from "./PriceCompareModal";
import { OutfitImagePreview } from "./OutfitImagePreview";

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

const TYPE_ICONS: Record<string, string> = {
  top: "👕",
  bottom: "👖",
  footwear: "👟",
  accessory: "💍",
  jacket: "🧥",
  dress: "👗",
  bag: "👜",
  watch: "⌚",
};

interface OutfitCardProps {
  outfit: ParsedOutfit;
  onSaveLook: (outfit: ParsedOutfit) => void;
  addToWishlist: (product: any) => void;
  addToCart: (product: any) => void;
  isSaved?: boolean;
  gender?: string;
}

export function OutfitCard({ outfit, onSaveLook, addToWishlist, addToCart, isSaved, gender }: OutfitCardProps) {
  const totalPrice = outfit.items.reduce((s, i) => s + i.price, 0);
  const ownItems = outfit.items.filter((i) => i.platform.toLowerCase() === "own wardrobe").length;
  const [compareItem, setCompareItem] = useState<string | null>(null);

  return (
    <>
      <div className="rounded-2xl bg-card border border-border p-5 text-left shadow-card hover:shadow-elevated transition-all duration-300 group relative overflow-hidden">
        {/* Subtle gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold/60 via-gold to-gold/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-gold" />
            </div>
            <div>
              <h4 className="font-display font-semibold text-sm leading-tight">{outfit.name}</h4>
              {ownItems > 0 && (
                <span className="text-[10px] text-green-600 font-medium">
                  ✓ {ownItems} from your wardrobe
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => onSaveLook(outfit)}
            className={`p-2 rounded-lg transition-all duration-200 ${
              isSaved
                ? "text-gold bg-gold/15 shadow-sm"
                : "hover:bg-gold/10 hover:text-gold text-muted-foreground hover:shadow-sm"
            }`}
            title={isSaved ? "Already saved" : "Save this look"}
          >
            {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
        </div>

        {/* Items */}
        <div className="space-y-2 mb-4">
          {outfit.items.map((item, ii) => {
            const searchUrl = getSearchUrl(item.platform, item.name);
            const isOwn = item.platform.toLowerCase() === "own wardrobe";
            const icon = TYPE_ICONS[item.type.toLowerCase()] || "🏷️";

            return (
              <div
                key={ii}
                className="rounded-xl bg-secondary/40 border border-transparent hover:border-border/60 p-3 transition-all duration-200 hover:bg-secondary/70"
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-base mt-0.5">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {item.type}
                        </span>
                        <p className="text-xs font-medium leading-snug">{item.name}</p>
                      </div>
                      <span className={`text-sm font-bold whitespace-nowrap ${isOwn ? "text-green-600" : "text-foreground"}`}>
                        {isOwn ? "Free ✓" : `₹${item.price.toLocaleString()}`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-2 py-0.5 h-auto font-medium rounded-full ${getPlatformColor(item.platform)}`}
                      >
                        {item.platform}
                      </Badge>
                      {!isOwn && (
                        <div className="flex items-center gap-0.5">
                          {/* Compare Prices Button */}
                          <button
                            onClick={() => setCompareItem(item.name)}
                            className="p-1.5 rounded-lg hover:bg-gold/10 text-muted-foreground hover:text-gold transition-colors"
                            title="Compare prices across platforms"
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                          </button>
                          {searchUrl && (
                            <a
                              href={searchUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                              title={`Search on ${item.platform}`}
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => addToWishlist({ name: item.name, price: item.price, platform: item.platform, url: searchUrl })}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            title="Add to wishlist"
                          >
                            <Heart className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => addToCart({ name: item.name, price: item.price, platform: item.platform, url: searchUrl })}
                            className="p-1.5 rounded-lg hover:bg-gold/10 text-muted-foreground hover:text-gold transition-colors"
                            title="Add to cart"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Image Preview */}
        <div className="mb-3">
          <OutfitImagePreview outfit={outfit} gender={gender} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border pt-3">
          <div>
            <span className="font-display font-bold text-base">₹{totalPrice.toLocaleString()}</span>
            {ownItems > 0 && (
              <span className="text-[10px] text-muted-foreground ml-1.5">
                ({ownItems} owned)
              </span>
            )}
          </div>
          <Button
            variant="gold"
            size="sm"
            className="h-8 text-xs gap-1.5 rounded-lg shadow-gold/20"
            onClick={() => {
              const buyItems = outfit.items.filter((i) => i.platform.toLowerCase() !== "own wardrobe");
              if (buyItems.length === 0) return;
              const url = getSearchUrl(buyItems[0].platform, buyItems[0].name);
              if (url) window.open(url, "_blank");
            }}
          >
            <Tag className="w-3 h-3" /> Shop This Look
          </Button>
        </div>
      </div>

      {/* Compare Prices Modal */}
      {compareItem && (
        <PriceCompareModal
          open={!!compareItem}
          onOpenChange={(open) => !open && setCompareItem(null)}
          productName={compareItem}
          addToWishlist={addToWishlist}
          addToCart={addToCart}
        />
      )}
    </>
  );
}
