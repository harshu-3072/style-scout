import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Star, ExternalLink, TrendingDown, Heart, Filter } from "lucide-react";

interface Product {
  id: number;
  name: string;
  image: string;
  prices: {
    platform: string;
    price: number;
    originalPrice: number;
    rating: number;
    link: string;
  }[];
}

const Compare = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Product[]>([]);

  const mockProducts: Product[] = [
    {
      id: 1,
      name: "Nike Air Max 270",
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
      prices: [
        { platform: "Amazon", price: 8999, originalPrice: 14999, rating: 4.5, link: "#" },
        { platform: "Myntra", price: 9499, originalPrice: 14999, rating: 4.3, link: "#" },
        { platform: "Flipkart", price: 9299, originalPrice: 14999, rating: 4.4, link: "#" },
        { platform: "Ajio", price: 8799, originalPrice: 14999, rating: 4.2, link: "#" },
      ],
    },
    {
      id: 2,
      name: "Levi's 501 Original Jeans",
      image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400",
      prices: [
        { platform: "Myntra", price: 2999, originalPrice: 5999, rating: 4.4, link: "#" },
        { platform: "Amazon", price: 3299, originalPrice: 5999, rating: 4.3, link: "#" },
        { platform: "Flipkart", price: 3199, originalPrice: 5999, rating: 4.2, link: "#" },
        { platform: "Meesho", price: 2799, originalPrice: 5999, rating: 4.0, link: "#" },
      ],
    },
    {
      id: 3,
      name: "Ray-Ban Aviator Classic",
      image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400",
      prices: [
        { platform: "Amazon", price: 6499, originalPrice: 8999, rating: 4.6, link: "#" },
        { platform: "Flipkart", price: 6799, originalPrice: 8999, rating: 4.5, link: "#" },
        { platform: "Myntra", price: 6599, originalPrice: 8999, rating: 4.4, link: "#" },
        { platform: "Nykaa", price: 6999, originalPrice: 8999, rating: 4.3, link: "#" },
      ],
    },
  ];

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setTimeout(() => {
      setResults(mockProducts);
      setIsSearching(false);
    }, 1500);
  };

  const getBestDeal = (prices: Product["prices"]) => {
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
            Search for any product and compare prices across Amazon, Myntra, Flipkart, Meesho, and more. Always find the best deal.
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
                    handleSearch();
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
                <p className="text-muted-foreground">{results.length} products found across 6 platforms</p>
              </div>
              <Button variant="outline">
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>

            <div className="space-y-8">
              {results.map((product) => {
                const bestDeal = getBestDeal(product.prices);
                const maxPrice = Math.max(...product.prices.map((p) => p.price));
                
                return (
                  <div
                    key={product.id}
                    className="rounded-2xl bg-card border border-border overflow-hidden shadow-card"
                  >
                    <div className="grid lg:grid-cols-[280px_1fr] gap-6 p-6">
                      {/* Product Image & Info */}
                      <div className="flex lg:flex-col gap-4">
                        <div className="w-32 lg:w-full aspect-square rounded-xl overflow-hidden bg-secondary">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 lg:flex-none">
                          <h3 className="font-display text-xl font-semibold mb-2">{product.name}</h3>
                          <div className="flex items-center gap-2 mb-4">
                            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold flex items-center gap-1">
                              <TrendingDown className="w-4 h-4" />
                              Best: ₹{bestDeal.price.toLocaleString()} on {bestDeal.platform}
                            </span>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Heart className="w-4 h-4" />
                            Add to Wishlist
                          </Button>
                        </div>
                      </div>

                      {/* Price Comparison Table */}
                      <div className="overflow-x-auto">
                        <div className="grid grid-cols-4 gap-4 min-w-[500px]">
                          {product.prices.map((p, i) => (
                            <div
                              key={i}
                              className={`p-4 rounded-xl border ${
                                p.price === bestDeal.price
                                  ? "border-gold bg-gold/5"
                                  : "border-border"
                              }`}
                            >
                              <div className="font-semibold text-sm mb-2">{p.platform}</div>
                              <div className="font-display text-2xl font-bold mb-1">
                                ₹{p.price.toLocaleString()}
                              </div>
                              <div className="text-sm text-muted-foreground line-through mb-2">
                                ₹{p.originalPrice.toLocaleString()}
                              </div>
                              <div className="flex items-center gap-1 mb-3">
                                <Star className="w-4 h-4 text-gold fill-gold" />
                                <span className="text-sm font-medium">{p.rating}</span>
                              </div>
                              {p.price === bestDeal.price && (
                                <span className="inline-block px-2 py-1 rounded-full bg-gold text-accent-foreground text-xs font-semibold mb-2">
                                  Best Deal
                                </span>
                              )}
                              <Button
                                variant={p.price === bestDeal.price ? "gold" : "outline"}
                                size="sm"
                                className="w-full"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Buy Now
                              </Button>
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

      {/* Platforms Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-bold mb-4">Supported Platforms</h2>
          <p className="text-muted-foreground mb-12">We compare prices from all major e-commerce platforms</p>
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
