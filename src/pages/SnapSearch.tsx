import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, Search, ExternalLink, Star, Sparkles, Heart, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProductActions } from "@/hooks/use-product-actions";

interface DetectedItem {
  type: string;
  color: string;
  style: string;
  material?: string;
  brand?: string;
}

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

const SnapSearch = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [detectedItem, setDetectedItem] = useState<DetectedItem | null>(null);
  const [results, setResults] = useState<Product[]>([]);
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
        setResults([]);
        setDetectedItem(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSearch = async () => {
    if (!selectedImage) return;
    setIsSearching(true);
    setResults([]);
    setDetectedItem(null);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-image", {
        body: { imageBase64: selectedImage },
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.success) {
        setDetectedItem(data.detected_item);
        setResults(data.similar_products || []);
        toast.success(`Found ${data.similar_products?.length || 0} similar products!`);
      }
    } catch (err) {
      console.error("Analysis error:", err);
      toast.error("Failed to analyze image. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setResults([]);
    setDetectedItem(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getProductLink = (product: Product) => {
    const fn = platformUrls[product.platform];
    return fn ? fn(product.searchQuery) : "#";
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-gradient-gold">Snap</span> & Search
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
            Upload any fashion image and our AI will analyze it to find similar products across all major e-commerce platforms.
          </p>

          {/* Upload Area */}
          <div className="max-w-2xl mx-auto">
            {!selectedImage ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative p-12 border-2 border-dashed border-border rounded-2xl bg-card hover:border-gold/50 transition-colors cursor-pointer group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                    <Upload className="w-10 h-10 text-gold" />
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Drop your image here or click to upload</p>
                    <p className="text-sm text-muted-foreground">Supports JPG, PNG, WEBP up to 10MB</p>
                  </div>
                  <div className="flex items-center gap-4 mt-4">
                    <Button variant="elegant" size="lg">
                      <Upload className="w-4 h-4" />
                      Upload Image
                    </Button>
                    <Button variant="outline" size="lg">
                      <Camera className="w-4 h-4" />
                      Use Camera
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden bg-card shadow-elevated">
                  <img
                    src={selectedImage}
                    alt="Uploaded"
                    className="w-full max-h-[400px] object-contain"
                  />
                  <button
                    onClick={clearImage}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-primary/80 text-primary-foreground flex items-center justify-center hover:bg-primary transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="mt-6">
                  <Button
                    variant="gold"
                    size="xl"
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="min-w-[200px]"
                  >
                    {isSearching ? (
                      <>
                        <div className="w-5 h-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                        Analyzing with AI...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Analyze & Find Products
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Detected Item Info */}
      {detectedItem && (
        <section className="py-8 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-sm text-muted-foreground">AI Detected:</span>
              <span className="px-3 py-1 rounded-full bg-gold/10 text-gold text-sm font-semibold">
                {detectedItem.type}
              </span>
              <span className="px-3 py-1 rounded-full bg-secondary text-sm">{detectedItem.color}</span>
              <span className="px-3 py-1 rounded-full bg-secondary text-sm">{detectedItem.style}</span>
              {detectedItem.material && (
                <span className="px-3 py-1 rounded-full bg-secondary text-sm">{detectedItem.material}</span>
              )}
              {detectedItem.brand && detectedItem.brand !== "Unknown" && (
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  {detectedItem.brand}
                </span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Results Section */}
      {results.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-display text-2xl font-bold">Similar Products Found</h2>
                <p className="text-muted-foreground">{results.length} AI-matched products across platforms</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {results.map((product, idx) => (
                <div
                  key={idx}
                  className="group rounded-2xl bg-card border border-border overflow-hidden hover:shadow-elevated transition-all duration-300"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-1 rounded-full bg-gold text-accent-foreground text-xs font-semibold">
                        {product.similarity}% Match
                      </span>
                      <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {product.platform}
                      </span>
                    </div>
                    <h3 className="font-medium text-sm mb-3 line-clamp-2">{product.name}</h3>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="font-display text-xl font-bold">₹{product.price.toLocaleString()}</span>
                      <span className="text-sm text-muted-foreground line-through">
                        ₹{product.originalPrice.toLocaleString()}
                      </span>
                      <span className="text-xs text-green-600 font-semibold">
                        {Math.round((1 - product.price / product.originalPrice) * 100)}% off
                      </span>
                    </div>
                    <a href={getProductLink(product)} target="_blank" rel="noopener noreferrer">
                      <Button variant="hero" size="sm" className="w-full">
                        <ExternalLink className="w-4 h-4" />
                        Search on {product.platform}
                      </Button>
                    </a>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={() => addToWishlist({ name: product.name, price: product.price, platform: product.platform, url: getProductLink(product) })}
                      >
                        <Heart className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={() => addToCart({ name: product.name, price: product.price, platform: product.platform, url: getProductLink(product) })}
                      >
                        <ShoppingBag className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Upload Image", desc: "Take a photo or upload an image of any fashion item you like" },
              { step: "02", title: "AI Analysis", desc: "Gemini AI analyzes the style, color, pattern, and design elements" },
              { step: "03", title: "Get Results", desc: "Instantly find similar products with links to buy on real platforms" },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                  <span className="font-display text-2xl font-bold text-gold">{item.step}</span>
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default SnapSearch;
