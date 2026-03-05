import { useState, useRef } from "react";
import { Camera, Search, Sparkles, Eye, ShoppingBag, Star, ExternalLink, Heart, ShoppingCart, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProductActions } from "@/hooks/use-product-actions";
import { UploadArea } from "@/components/snap-search/UploadArea";
import { DetectedItemBadges } from "@/components/snap-search/DetectedItemBadges";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DetectedItem {
  type: string;
  color: string;
  style: string;
  material?: string;
  brand?: string;
}

interface PriceEntry {
  platform: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  link: string;
  source: string;
}

interface GroupedProduct {
  id: number;
  name: string;
  image: string;
  prices: PriceEntry[];
}

const SnapSearch = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [detectedItem, setDetectedItem] = useState<DetectedItem | null>(null);
  const [products, setProducts] = useState<GroupedProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToWishlist, addToCart } = useProductActions();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image must be under 10MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setProducts([]);
        setDetectedItem(null);
        setSearchQuery("");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSearch = async () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    setProducts([]);
    setDetectedItem(null);

    try {
      // Step 1: Analyze image with AI
      const { data, error } = await supabase.functions.invoke("analyze-image", {
        body: { imageBase64: selectedImage },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.success && data.detected_item) {
        setDetectedItem(data.detected_item);
        const item = data.detected_item;
        const query = `${item.color} ${item.style} ${item.type}${item.material ? " " + item.material : ""}`;
        setSearchQuery(query);
        setIsAnalyzing(false);

        // Step 2: Search real products via SerpAPI
        setIsSearching(true);
        try {
          const { data: searchData, error: searchError } = await supabase.functions.invoke("search-products", {
            body: { query },
          });

          if (searchError) throw searchError;
          if (searchData?.error) {
            toast.error(searchData.error);
            return;
          }

          setProducts(searchData?.products || []);
          toast.success(`Found ${searchData?.products?.length || 0} products!`);
        } catch (err) {
          console.error("Search error:", err);
          toast.error("Product search failed. Please try again.");
        } finally {
          setIsSearching(false);
        }
      }
    } catch (err) {
      console.error("Analysis error:", err);
      toast.error("Failed to analyze image. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setProducts([]);
    setDetectedItem(null);
    setSearchQuery("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getBestPrice = (prices: PriceEntry[]) => {
    return prices.reduce((min, p) => (p.price < min.price ? p : min), prices[0]);
  };

  const getDiscount = (price: number, originalPrice: number) => {
    if (originalPrice <= price) return 0;
    return Math.round((1 - price / originalPrice) * 100);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-28 bg-gradient-hero">
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-accent blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-accent blur-3xl" />
        </div>
        <div className="container relative mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent mb-6 border border-accent/20">
            <Camera className="w-4 h-4" />
            <span className="text-sm font-medium font-body">Visual Fashion Search</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
            <span className="text-gradient-gold">Snap</span> & Shop
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12 font-body">
            Upload any fashion image and shop similar products from real stores with actual prices, ratings, and direct buy links.
          </p>

          <div className="max-w-2xl mx-auto">
            <UploadArea
              selectedImage={selectedImage}
              onImageUpload={handleImageUpload}
              onClear={clearImage}
              onSearch={handleSearch}
              isSearching={isAnalyzing}
            />
          </div>
        </div>
      </section>

      {/* Detected Item Info */}
      {detectedItem && <DetectedItemBadges item={detectedItem} />}

      {/* Loading State */}
      {(isAnalyzing || isSearching) && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center gap-4 mb-10">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-muted border-t-accent animate-spin" />
                <Sparkles className="w-6 h-6 text-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-muted-foreground font-body animate-pulse">
                {isAnalyzing ? "AI is analyzing your image..." : "Searching products across stores..."}
              </p>
            </div>
            {isSearching && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden border-border">
                    <Skeleton className="h-56 w-full" />
                    <CardContent className="p-4 space-y-3">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-8 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Results Section */}
      {products.length > 0 && !isSearching && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
              <div>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                  Shop Similar Products
                </h2>
                <p className="text-muted-foreground font-body mt-1">
                  {products.length} products found for "{searchQuery}"
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {products.map((product) => {
                const bestPrice = getBestPrice(product.prices);
                const discount = getDiscount(bestPrice.price, bestPrice.originalPrice);

                return (
                  <Card
                    key={product.id}
                    className="group overflow-hidden border-border hover:shadow-elevated hover:border-accent/30 transition-all duration-300"
                  >
                    {/* Product Image */}
                    <div className="relative aspect-square bg-secondary/30 overflow-hidden">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-12 h-12 text-muted-foreground/30" />
                        </div>
                      )}

                      {/* Discount badge */}
                      {discount > 0 && (
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-destructive text-destructive-foreground font-bold text-xs px-2 py-1">
                            {discount}% OFF
                          </Badge>
                        </div>
                      )}

                      {/* Quick actions overlay */}
                      <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                          onClick={() =>
                            addToWishlist({
                              name: product.name,
                              price: bestPrice.price,
                              image: product.image,
                              platform: bestPrice.platform,
                              url: bestPrice.link,
                            })
                          }
                          className="w-9 h-9 rounded-full bg-background/90 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all shadow-sm"
                          title="Add to Wishlist"
                        >
                          <Heart className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            addToCart({
                              name: product.name,
                              price: bestPrice.price,
                              image: product.image,
                              platform: bestPrice.platform,
                              url: bestPrice.link,
                            })
                          }
                          className="w-9 h-9 rounded-full bg-background/90 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-accent/10 hover:text-accent hover:border-accent/30 transition-all shadow-sm"
                          title="Add to Cart"
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Platform count */}
                      {product.prices.length > 1 && (
                        <div className="absolute bottom-3 left-3">
                          <Badge variant="secondary" className="text-[10px] font-medium bg-background/90 backdrop-blur-sm">
                            {product.prices.length} stores
                          </Badge>
                        </div>
                      )}
                    </div>

                    <CardContent className="p-4 space-y-3">
                      {/* Product name */}
                      <h3 className="font-body font-medium text-sm leading-snug line-clamp-2 min-h-[2.5rem] text-foreground">
                        {product.name}
                      </h3>

                      {/* Rating */}
                      {bestPrice.rating > 0 && (
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                            <Star className="w-3 h-3 fill-current" />
                            <span className="text-xs font-bold">{bestPrice.rating}</span>
                          </div>
                          {bestPrice.reviews > 0 && (
                            <span className="text-xs text-muted-foreground">
                              ({bestPrice.reviews.toLocaleString()} reviews)
                            </span>
                          )}
                        </div>
                      )}

                      {/* Price */}
                      <div className="flex items-baseline gap-2">
                        <span className="font-display text-xl font-bold text-foreground">
                          ₹{bestPrice.price.toLocaleString()}
                        </span>
                        {discount > 0 && (
                          <span className="text-sm text-muted-foreground line-through">
                            ₹{bestPrice.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Platform prices */}
                      {product.prices.length > 1 && (
                        <div className="space-y-1.5 pt-1 border-t border-border">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Compare prices</p>
                          {product.prices.slice(0, 3).map((p, i) => (
                            <a
                              key={i}
                              href={p.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between text-xs hover:bg-secondary/50 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                            >
                              <span className="font-medium text-foreground">{p.platform || p.source}</span>
                              <span className="font-bold text-foreground">₹{p.price.toLocaleString()}</span>
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Buy button */}
                      <a href={bestPrice.link} target="_blank" rel="noopener noreferrer" className="block pt-1">
                        <Button variant="gold" size="sm" className="w-full gap-2 shadow-gold/20">
                          <ExternalLink className="w-4 h-4" />
                          Buy on {bestPrice.platform || bestPrice.source}
                        </Button>
                      </a>

                      {/* Add to cart + wishlist row */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1.5 text-xs hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                          onClick={() =>
                            addToWishlist({
                              name: product.name,
                              price: bestPrice.price,
                              image: product.image,
                              platform: bestPrice.platform,
                              url: bestPrice.link,
                            })
                          }
                        >
                          <Heart className="w-3.5 h-3.5" />
                          Wishlist
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1.5 text-xs hover:bg-accent/10 hover:text-accent hover:border-accent/30"
                          onClick={() =>
                            addToCart({
                              name: product.name,
                              price: bestPrice.price,
                              image: product.image,
                              platform: bestPrice.platform,
                              url: bestPrice.link,
                            })
                          }
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          Add to Cart
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl font-bold text-center mb-4 text-foreground">How It Works</h2>
          <p className="text-muted-foreground text-center mb-12 font-body max-w-lg mx-auto">
            Three simple steps to find and buy any fashion item online
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Upload Image", desc: "Take a photo or upload an image of any fashion item you like", icon: Camera },
              { step: "02", title: "AI Analysis", desc: "Our AI identifies the item and searches real products across major stores", icon: Eye },
              { step: "03", title: "Shop & Compare", desc: "Compare prices across platforms and buy directly with real product links", icon: ShoppingBag },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="text-center group">
                  <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/20 group-hover:scale-105 transition-all duration-300">
                    <Icon className="w-7 h-7 text-accent" />
                  </div>
                  <div className="inline-flex items-center gap-1 text-xs font-bold text-accent mb-2">
                    STEP {item.step}
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2 text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground font-body">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default SnapSearch;
