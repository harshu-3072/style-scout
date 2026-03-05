import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Star, ExternalLink, TrendingDown, Heart, ShoppingBag, Filter, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProductActions } from "@/hooks/use-product-actions";

interface PriceEntry {
  platform: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  link: string;
  source: string;
}

interface Product {
  id: number;
  name: string;
  image: string;
  prices: PriceEntry[];
}

const Compare = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const { addToWishlist, addToCart } = useProductActions();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setHasSearched(true);

    try {
      const { data, error } = await supabase.functions.invoke("search-products", {
        body: { query: searchQuery },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResults(data?.products || []);
      if (data?.warning) {
        toast.warning(data.warning);
      }
      if (!data?.products?.length) {
        toast.info("No products found. Try a different search term.");
      }
    } catch (err: any) {
      console.error("Search error:", err);
      toast.error("Failed to search products. Please try again.");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const getBestDeal = (prices: PriceEntry[]) => {
    return prices.reduce((min, p) => (p.price < min.price ? p : min));
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Compare <span className="text-gradient-gold">Prices</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
            Search for any product and compare real prices across Amazon, Myntra, Flipkart, and more. Always find the best deal.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search for products (e.g., Nike shoes, Levi's jeans...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="h-14 pl-12 text-lg rounded-xl"
                />
              </div>
              <Button
                variant="gold"
                size="xl"
                onClick={handleSearch}
                disabled={isSearching}
              >
                {isSearching ? (
                  <div className="w-5 h-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Compare
                  </>
                )}
              </Button>
            </div>

            {/* Quick Search Tags */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {["Nike Shoes", "iPhone 15", "Samsung TV", "Levi's Jeans", "Adidas Hoodie"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setSearchQuery(tag);
                    setTimeout(() => handleSearch(), 0);
                  }}
                  className="px-4 py-2 rounded-full bg-secondary text-sm font-medium hover:bg-gold/10 hover:text-gold transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      {results.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-display text-2xl font-bold">Price Comparison Results</h2>
                <p className="text-muted-foreground">
                  {results.length} product{results.length !== 1 ? "s" : ""} found — live prices from Google Shopping
                </p>
              </div>
            </div>

            <div className="space-y-8">
              {results.map((product) => {
                const bestDeal = getBestDeal(product.prices);

                return (
                  <div
                    key={product.id}
                    className="rounded-2xl bg-card border border-border overflow-hidden shadow-card"
                  >
                    <div className="grid lg:grid-cols-[280px_1fr] gap-6 p-6">
                      {/* Product Image & Info */}
                      <div className="flex lg:flex-col gap-4">
                        <div className="w-32 lg:w-full aspect-square rounded-xl overflow-hidden bg-secondary">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              No Image
                            </div>
                          )}
                        </div>
                        <div className="flex-1 lg:flex-none">
                          <h3 className="font-display text-xl font-semibold mb-2">{product.name}</h3>
                          <div className="flex items-center gap-2 mb-4">
                            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold flex items-center gap-1">
                              <TrendingDown className="w-4 h-4" />
                              Best: ₹{bestDeal.price.toLocaleString()} on {bestDeal.platform}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Price Comparison Cards */}
                      <div className="overflow-x-auto">
                        <div className={`grid gap-4 min-w-[500px]`} style={{ gridTemplateColumns: `repeat(${Math.min(product.prices.length, 4)}, 1fr)` }}>
                          {product.prices.slice(0, 4).map((p, i) => (
                            <div
                              key={i}
                              className={`p-4 rounded-xl border ${
                                p.price === bestDeal.price
                                  ? "border-gold bg-gold/5"
                                  : "border-border"
                              }`}
                            >
                              <div className="font-semibold text-sm mb-2">{p.platform}</div>
                              <div className="text-xs text-muted-foreground mb-1 truncate">{p.source}</div>
                              <div className="font-display text-2xl font-bold mb-1">
                                ₹{p.price.toLocaleString()}
                              </div>
                              {p.originalPrice > p.price && (
                                <div className="text-sm text-muted-foreground line-through mb-2">
                                  ₹{p.originalPrice.toLocaleString()}
                                </div>
                              )}
                              {p.rating > 0 && (
                                <div className="flex items-center gap-1 mb-3">
                                  <Star className="w-4 h-4 text-gold fill-gold" />
                                  <span className="text-sm font-medium">{p.rating}</span>
                                  {p.reviews > 0 && (
                                    <span className="text-xs text-muted-foreground">({p.reviews})</span>
                                  )}
                                </div>
                              )}
                              {p.price === bestDeal.price && (
                                <span className="inline-block px-2 py-1 rounded-full bg-gold text-accent-foreground text-xs font-semibold mb-2">
                                  Best Deal
                                </span>
                              )}
                              <a href={p.link} target="_blank" rel="noopener noreferrer">
                                <Button
                                  variant={p.price === bestDeal.price ? "gold" : "outline"}
                                  size="sm"
                                  className="w-full"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Buy Now
                                </Button>
                              </a>
                              <div className="flex gap-2 mt-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => addToWishlist({ name: product.name, price: p.price, image: product.image, platform: p.platform, url: p.link })}
                                >
                                  <Heart className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => addToCart({ name: product.name, price: p.price, image: product.image, platform: p.platform, url: p.link })}
                                >
                                  <ShoppingBag className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* No Results */}
      {hasSearched && !isSearching && results.length === 0 && (
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold mb-2">No Results Found</h2>
            <p className="text-muted-foreground">Try searching with different keywords.</p>
          </div>
        </section>
      )}

      {/* Platforms Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-bold mb-4">Supported Platforms</h2>
          <p className="text-muted-foreground mb-12">We compare live prices from all major e-commerce platforms</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-12">
            {["Amazon", "Myntra", "Flipkart", "Meesho", "Ajio", "Nykaa"].map((platform) => (
              <div
                key={platform}
                className="px-8 py-4 rounded-xl bg-card border border-border shadow-card"
              >
                <span className="font-display text-xl font-semibold">{platform}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Compare;
