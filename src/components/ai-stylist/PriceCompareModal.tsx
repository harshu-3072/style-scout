import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ExternalLink, TrendingDown, Heart, ShoppingBag, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PriceEntry {
  platform: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  link: string;
  source: string;
}

interface CompareProduct {
  id: number;
  name: string;
  image: string;
  prices: PriceEntry[];
}

interface PriceCompareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  addToWishlist: (product: any) => void;
  addToCart: (product: any) => void;
}

export function PriceCompareModal({ open, onOpenChange, productName, addToWishlist, addToCart }: PriceCompareModalProps) {
  const [results, setResults] = useState<CompareProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (loading) return;
    setLoading(true);
    setSearched(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-products", {
        body: { query: productName },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.warning) console.warn("Price compare warning:", data.warning);
      setResults(data?.products || []);
    } catch (err) {
      console.error("Compare error:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-search when opened
  const onOpen = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (isOpen && !searched) {
      handleSearch();
    }
  };

  const getBestPrice = (prices: PriceEntry[]) =>
    prices.reduce((min, p) => (p.price < min.price ? p : min));

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            Compare Prices: <span className="text-gradient-gold">{productName}</span>
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
            <p className="text-sm text-muted-foreground">Searching across platforms...</p>
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No results found across platforms.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={handleSearch}>
              Retry
            </Button>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-4">
            {results.slice(0, 5).map((product) => {
              const best = getBestPrice(product.prices);
              return (
                <div key={product.id} className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex gap-4 p-4">
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-20 h-20 rounded-lg object-cover bg-secondary flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold leading-snug line-clamp-2 mb-1">{product.name}</h4>
                      <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-600 border-green-500/30">
                        <TrendingDown className="w-3 h-3 mr-1" />
                        Best: ₹{best.price.toLocaleString()} on {best.platform}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 px-4 pb-4">
                    {product.prices.slice(0, 6).map((p, i) => (
                      <div
                        key={i}
                        className={`rounded-lg p-2.5 border text-center transition-all ${
                          p.price === best.price
                            ? "border-gold bg-gold/5 shadow-sm"
                            : "border-border hover:border-gold/30"
                        }`}
                      >
                        <p className="text-[10px] font-medium text-muted-foreground truncate">{p.source || p.platform}</p>
                        <p className="font-display text-base font-bold mt-0.5">₹{p.price.toLocaleString()}</p>
                        {p.originalPrice > p.price && (
                          <p className="text-[10px] text-muted-foreground line-through">₹{p.originalPrice.toLocaleString()}</p>
                        )}
                        {p.rating > 0 && (
                          <div className="flex items-center justify-center gap-0.5 mt-1">
                            <Star className="w-3 h-3 text-gold fill-gold" />
                            <span className="text-[10px]">{p.rating}</span>
                          </div>
                        )}
                        {p.price === best.price && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 rounded-full bg-gold text-accent-foreground text-[9px] font-bold">
                            BEST
                          </span>
                        )}
                        <div className="flex items-center gap-1 mt-2 justify-center">
                          <a href={p.link} target="_blank" rel="noopener noreferrer">
                            <Button variant={p.price === best.price ? "gold" : "outline"} size="sm" className="h-6 text-[10px] px-2 gap-1">
                              <ExternalLink className="w-3 h-3" /> Buy
                            </Button>
                          </a>
                          <button
                            onClick={() => addToWishlist({ name: product.name, price: p.price, image: product.image, platform: p.platform, url: p.link })}
                            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Heart className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => addToCart({ name: product.name, price: p.price, image: product.image, platform: p.platform, url: p.link })}
                            className="p-1 rounded hover:bg-gold/10 text-muted-foreground hover:text-gold transition-colors"
                          >
                            <ShoppingBag className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
