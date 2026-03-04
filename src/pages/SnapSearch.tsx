import { useState, useRef } from "react";
import { Camera, Search, Sparkles, ArrowRight, Zap, Eye, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProductActions } from "@/hooks/use-product-actions";
import { UploadArea } from "@/components/snap-search/UploadArea";
import { DetectedItemBadges } from "@/components/snap-search/DetectedItemBadges";
import { ProductResultCard } from "@/components/snap-search/ProductResultCard";

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
            <span className="text-gradient-gold">Snap</span> & Search
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12 font-body">
            Upload any fashion image and our AI will find similar products across all major Indian e-commerce platforms instantly.
          </p>

          <div className="max-w-2xl mx-auto">
            <UploadArea
              selectedImage={selectedImage}
              onImageUpload={handleImageUpload}
              onClear={clearImage}
              onSearch={handleSearch}
              isSearching={isSearching}
            />
          </div>
        </div>
      </section>

      {/* Detected Item Info */}
      {detectedItem && <DetectedItemBadges item={detectedItem} />}

      {/* Loading State */}
      {isSearching && (
        <section className="py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-muted border-t-accent animate-spin" />
              <Sparkles className="w-6 h-6 text-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-muted-foreground font-body animate-pulse">AI is analyzing your image...</p>
          </div>
        </section>
      )}

      {/* Results Section */}
      {results.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                  Similar Products Found
                </h2>
                <p className="text-muted-foreground font-body mt-1">
                  {results.length} AI-matched products across platforms
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {results.map((product, idx) => (
                <ProductResultCard
                  key={idx}
                  product={product}
                  addToWishlist={addToWishlist}
                  addToCart={addToCart}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl font-bold text-center mb-4 text-foreground">How It Works</h2>
          <p className="text-muted-foreground text-center mb-12 font-body max-w-lg mx-auto">
            Three simple steps to find any fashion item online
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Upload Image", desc: "Take a photo or upload an image of any fashion item you like", icon: Camera },
              { step: "02", title: "AI Analysis", desc: "Our AI analyzes the style, color, pattern, and design elements", icon: Eye },
              { step: "03", title: "Shop Instantly", desc: "Get similar products with direct links to buy across platforms", icon: ShoppingBag },
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
