import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, Search, ExternalLink, Star } from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice: number;
  platform: string;
  image: string;
  rating: number;
  similarity: number;
}

const SnapSearch = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mockResults: Product[] = [
    {
      id: 1,
      name: "Classic Cotton Blazer - Navy Blue",
      price: 2499,
      originalPrice: 4999,
      platform: "Myntra",
      image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400",
      rating: 4.5,
      similarity: 98,
    },
    {
      id: 2,
      name: "Premium Tailored Blazer",
      price: 2999,
      originalPrice: 5499,
      platform: "Amazon",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
      rating: 4.3,
      similarity: 95,
    },
    {
      id: 3,
      name: "Formal Cotton Jacket",
      price: 1999,
      originalPrice: 3999,
      platform: "Flipkart",
      image: "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=400",
      rating: 4.1,
      similarity: 92,
    },
    {
      id: 4,
      name: "Slim Fit Office Blazer",
      price: 1799,
      originalPrice: 2999,
      platform: "Meesho",
      image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=400",
      rating: 4.0,
      similarity: 89,
    },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSearch = () => {
    if (!selectedImage) return;
    setIsSearching(true);
    setTimeout(() => {
      setResults(mockResults);
      setIsSearching(false);
    }, 2000);
  };

  const clearImage = () => {
    setSelectedImage(null);
    setResults([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
            Upload any fashion image and instantly find similar products across all major e-commerce platforms at the best prices.
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
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5" />
                        Find Similar Products
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Results Section */}
      {results.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-display text-2xl font-bold">Similar Products Found</h2>
                <p className="text-muted-foreground">{results.length} products across multiple platforms</p>
              </div>
              <Button variant="outline">
                Sort by Price
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {results.map((product) => (
                <div
                  key={product.id}
                  className="group rounded-2xl bg-card border border-border overflow-hidden hover:shadow-elevated transition-all duration-300"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-gold text-accent-foreground text-xs font-semibold">
                      {product.similarity}% Match
                    </div>
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-primary/80 text-primary-foreground text-xs font-medium">
                      {product.platform}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-sm mb-2 line-clamp-2">{product.name}</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-display text-xl font-bold">₹{product.price.toLocaleString()}</span>
                      <span className="text-sm text-muted-foreground line-through">₹{product.originalPrice.toLocaleString()}</span>
                      <span className="text-xs text-green-600 font-semibold">
                        {Math.round((1 - product.price / product.originalPrice) * 100)}% off
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mb-4">
                      <Star className="w-4 h-4 text-gold fill-gold" />
                      <span className="text-sm font-medium">{product.rating}</span>
                    </div>
                    <Button variant="hero" size="sm" className="w-full">
                      <ExternalLink className="w-4 h-4" />
                      View on {product.platform}
                    </Button>
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
          <h2 className="font-display text-3xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Upload Image", desc: "Take a photo or upload an image of any fashion item you like" },
              { step: "02", title: "AI Analysis", desc: "Our AI analyzes the style, color, pattern, and design elements" },
              { step: "03", title: "Get Results", desc: "Instantly find similar products with prices compared across platforms" },
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
