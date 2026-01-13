import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, User, Bot, Upload, Star, ExternalLink, Shirt, Footprints } from "lucide-react";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  outfits?: Outfit[];
}

interface Outfit {
  id: number;
  name: string;
  image: string;
  items: { type: string; name: string; price: number; platform: string }[];
  style: string;
}

const AIStylist = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content: "Hi! I'm your personal AI Fashion Stylist ✨ I can help you with:\n\n• Outfit recommendations based on your preferences\n• Style suggestions for specific occasions\n• Finding more stylish alternatives to outfits you like\n• Complete look suggestions (Top + Bottom + Footwear + Accessories)\n\nHow can I help you look amazing today?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const mockOutfits: Outfit[] = [
    {
      id: 1,
      name: "Smart Casual Friday",
      image: "https://images.unsplash.com/photo-1516826957135-700dedea698c?w=400",
      items: [
        { type: "Top", name: "Navy Cotton Blazer", price: 3499, platform: "Myntra" },
        { type: "Bottom", name: "Beige Chinos", price: 1999, platform: "Amazon" },
        { type: "Footwear", name: "Brown Loafers", price: 2499, platform: "Ajio" },
        { type: "Accessory", name: "Leather Watch", price: 1499, platform: "Flipkart" },
      ],
      style: "Smart Casual",
    },
    {
      id: 2,
      name: "Weekend Brunch Look",
      image: "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=400",
      items: [
        { type: "Top", name: "White Linen Shirt", price: 1499, platform: "Myntra" },
        { type: "Bottom", name: "Light Blue Jeans", price: 2299, platform: "Levi's" },
        { type: "Footwear", name: "White Sneakers", price: 3999, platform: "Amazon" },
        { type: "Accessory", name: "Sunglasses", price: 999, platform: "Myntra" },
      ],
      style: "Casual Chic",
    },
    {
      id: 3,
      name: "Evening Date Night",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
      items: [
        { type: "Top", name: "Black Turtle Neck", price: 1299, platform: "H&M" },
        { type: "Bottom", name: "Dark Slim Jeans", price: 2499, platform: "Myntra" },
        { type: "Footwear", name: "Chelsea Boots", price: 3499, platform: "Amazon" },
        { type: "Accessory", name: "Silver Bracelet", price: 799, platform: "Ajio" },
      ],
      style: "Elegant Casual",
    },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      role: "user",
      content: inputValue,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    setTimeout(() => {
      const assistantMessage: Message = {
        id: messages.length + 2,
        role: "assistant",
        content: "Based on your preferences, here are some outfit recommendations that would look amazing on you! Each outfit is carefully curated with pieces from top brands at the best prices. 💫",
        outfits: mockOutfits,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 2000);
  };

  const quickPrompts = [
    "Suggest a smart casual outfit for office",
    "What should I wear for a date night?",
    "Help me find a stylish summer look",
    "I need an outfit for a wedding reception",
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="py-12 bg-gradient-hero border-b border-border">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/30 mb-4">
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="text-sm font-medium">AI-Powered Styling</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Your Personal <span className="text-gradient-gold">AI Fashion Stylist</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Get personalized outfit recommendations, styling tips, and complete look suggestions tailored just for you.
          </p>
        </div>
      </section>

      {/* Chat Section */}
      <section className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Messages */}
          <div className="space-y-6 mb-8 min-h-[400px]">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${message.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === "user" ? "bg-gold" : "bg-primary"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="w-5 h-5 text-accent-foreground" />
                  ) : (
                    <Bot className="w-5 h-5 text-primary-foreground" />
                  )}
                </div>
                <div
                  className={`flex-1 max-w-[80%] ${
                    message.role === "user" ? "text-right" : ""
                  }`}
                >
                  <div
                    className={`inline-block p-4 rounded-2xl ${
                      message.role === "user"
                        ? "bg-gold text-accent-foreground"
                        : "bg-secondary"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-left">{message.content}</p>
                  </div>

                  {/* Outfit Cards */}
                  {message.outfits && (
                    <div className="grid sm:grid-cols-3 gap-4 mt-4">
                      {message.outfits.map((outfit) => (
                        <div
                          key={outfit.id}
                          className="rounded-xl bg-card border border-border overflow-hidden shadow-card text-left"
                        >
                          <div className="aspect-[3/4] overflow-hidden">
                            <img
                              src={outfit.image}
                              alt={outfit.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium px-2 py-1 rounded-full bg-gold/10 text-gold">
                                {outfit.style}
                              </span>
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-gold fill-gold" />
                                <span className="text-xs font-medium">4.8</span>
                              </div>
                            </div>
                            <h4 className="font-semibold text-sm mb-3">{outfit.name}</h4>
                            <div className="space-y-2 mb-4">
                              {outfit.items.slice(0, 2).map((item, i) => (
                                <div key={i} className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground flex items-center gap-1">
                                    {item.type === "Top" ? <Shirt className="w-3 h-3" /> : <Footprints className="w-3 h-3" />}
                                    {item.name}
                                  </span>
                                  <span className="font-medium">₹{item.price}</span>
                                </div>
                              ))}
                              {outfit.items.length > 2 && (
                                <span className="text-xs text-muted-foreground">
                                  +{outfit.items.length - 2} more items
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-display font-bold">
                                ₹{outfit.items.reduce((sum, item) => sum + item.price, 0).toLocaleString()}
                              </span>
                              <Button variant="gold" size="sm">
                                <ExternalLink className="w-3 h-3" />
                                Shop Look
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="p-4 rounded-2xl bg-secondary">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse" />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: "0.2s" }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: "0.4s" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="flex flex-wrap gap-2 mb-4">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => setInputValue(prompt)}
                className="px-4 py-2 rounded-full bg-secondary text-sm font-medium hover:bg-gold/10 hover:text-gold transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="flex gap-4">
            <Button variant="outline" size="icon" className="flex-shrink-0 h-12 w-12">
              <Upload className="w-5 h-5" />
            </Button>
            <div className="relative flex-1">
              <Input
                placeholder="Describe your style preferences or ask for outfit suggestions..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="h-12 pr-12"
              />
              <Button
                variant="gold"
                size="icon"
                onClick={handleSend}
                className="absolute right-1 top-1 h-10 w-10"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AIStylist;
