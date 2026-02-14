import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, User, Bot, Upload, Heart, ShoppingBag, X, Image, Shirt } from "lucide-react";
import { useProductActions } from "@/hooks/use-product-actions";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  imagePreview?: string;
}

interface ParsedOutfit {
  name: string;
  items: { type: string; name: string; price: number; platform: string }[];
}

function parseOutfits(content: string): ParsedOutfit[] {
  const outfits: ParsedOutfit[] = [];
  const regex = /:::outfit\[(.+?)\]\n([\s\S]*?):::/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const name = match[1];
    const items: ParsedOutfit["items"] = [];
    const lines = match[2].trim().split("\n");
    for (const line of lines) {
      const m = line.match(/^-\s*(\w+):\s*(.+?)\s*\|\s*₹([\d,]+)\s*\|\s*(.+)$/);
      if (m) {
        items.push({ type: m[1], name: m[2].trim(), price: parseInt(m[3].replace(/,/g, "")), platform: m[4].trim() });
      }
    }
    if (items.length > 0) outfits.push({ name, items });
  }
  return outfits;
}

function stripOutfitBlocks(content: string): string {
  return content.replace(/:::outfit\[.+?\]\n[\s\S]*?:::/g, "").trim();
}

const AIStylist = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content:
        "Hi! I'm **StyleGenie** — your personal AI Fashion Stylist ✨\n\nI can help you with:\n\n• **Outfit recommendations** for any occasion\n• **Style analysis** — upload a photo and I'll suggest how to wear it\n• **Premium alternatives** to outfits you already own\n• **Complete looks** (Top + Bottom + Footwear + Accessories)\n\nTell me about your style, an occasion, or upload a photo to get started!",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToWishlist, addToCart } = useProductActions();
  const { user } = useAuth();

  const { data: wardrobeItems = [] } = useQuery({
    queryKey: ["wardrobe", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("wardrobe_items" as any)
        .select("name, category, color, brand")
        .eq("user_id", user!.id);
      return (data || []) as unknown as { name: string; category: string; color: string | null; brand: string | null }[];
    },
    enabled: !!user,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPendingImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text && !pendingImage) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: text || "Analyze this outfit and suggest styling ideas",
      imagePreview: pendingImage || undefined,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue("");
    const sentImage = pendingImage;
    setPendingImage(null);
    setIsTyping(true);

    // Build chat history for the API
    const chatHistory = updatedMessages
      .filter((m) => m.id !== 1) // skip initial greeting
      .map((m) => ({
        role: m.role,
        content: m.content,
        ...(m.imagePreview ? { imageBase64: m.imagePreview } : {}),
      }));

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-stylist`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: chatHistory, wardrobe: wardrobeItems.length > 0 ? wardrobeItems : undefined }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || "Request failed");
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && last.id === -1) {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
                }
                return [...prev, { id: -1, role: "assistant", content: assistantContent }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Finalize assistant message with a real ID
      setMessages((prev) =>
        prev.map((m) => (m.id === -1 ? { ...m, id: Date.now() } : m))
      );
    } catch (err: any) {
      console.error("AI Stylist error:", err);
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), role: "assistant", content: `Sorry, something went wrong: ${err.message}. Please try again.` },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickPrompts = wardrobeItems.length > 0
    ? [
        "Style an outfit from my wardrobe for office",
        "What can I wear from my closet for a date night?",
        "Suggest outfits using my existing clothes",
        "What's missing from my wardrobe?",
      ]
    : [
        "Suggest a smart casual outfit for office",
        "What should I wear for a date night?",
        "Suggest a stylish summer look under ₹5000",
        "Help me style a black blazer",
      ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="py-10 bg-gradient-hero border-b border-border">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/30 mb-3">
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="text-sm font-medium">AI-Powered Personal Stylist</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">
            Your Personal <span className="text-gradient-gold">StyleGenie</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm">
            Get real AI-powered outfit recommendations, style your existing wardrobe, or upload a photo for instant analysis.
          </p>
          {user && wardrobeItems.length > 0 && (
            <Link to="/account/wardrobe" className="inline-flex items-center gap-1.5 mt-3 text-xs text-gold hover:underline">
              <Shirt className="w-3.5 h-3.5" /> {wardrobeItems.length} items in your wardrobe — AI will use them
            </Link>
          )}
          {user && wardrobeItems.length === 0 && (
            <Link to="/account/wardrobe" className="inline-flex items-center gap-1.5 mt-3 text-xs text-muted-foreground hover:text-gold transition-colors">
              <Shirt className="w-3.5 h-3.5" /> Add clothes to your wardrobe for personalized suggestions
            </Link>
          )}
        </div>
      </section>

      {/* Chat */}
      <section className="flex-1 py-6">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="space-y-5 mb-6 min-h-[400px]">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} addToWishlist={addToWishlist} addToCart={addToCart} />
            ))}

            {isTyping && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="p-3 rounded-2xl bg-secondary">
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
          {messages.length <= 2 && (
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
          )}

          {/* Pending Image Preview */}
          {pendingImage && (
            <div className="mb-3 relative inline-block">
              <img src={pendingImage} alt="Upload preview" className="h-20 rounded-lg border border-border" />
              <button
                onClick={() => setPendingImage(null)}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Input */}
          <div className="flex gap-3">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <Button
              variant="outline"
              size="icon"
              className="flex-shrink-0 h-12 w-12"
              onClick={() => fileInputRef.current?.click()}
            >
              <Image className="w-5 h-5" />
            </Button>
            <div className="relative flex-1">
              <Input
                placeholder="Ask about outfits, styling tips, or upload a photo..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                className="h-12 pr-12"
                disabled={isTyping}
              />
              <Button
                variant="gold"
                size="icon"
                onClick={handleSend}
                disabled={isTyping && !inputValue.trim() && !pendingImage}
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

function MessageBubble({
  message,
  addToWishlist,
  addToCart,
}: {
  message: Message;
  addToWishlist: (p: any) => void;
  addToCart: (p: any) => void;
}) {
  const isUser = message.role === "user";
  const outfits = !isUser ? parseOutfits(message.content) : [];
  const textContent = !isUser ? stripOutfitBlocks(message.content) : message.content;

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? "bg-gold" : "bg-primary"
        }`}
      >
        {isUser ? <User className="w-4 h-4 text-accent-foreground" /> : <Bot className="w-4 h-4 text-primary-foreground" />}
      </div>
      <div className={`flex-1 max-w-[85%] ${isUser ? "text-right" : ""}`}>
        {/* Image attachment */}
        {message.imagePreview && (
          <div className={`mb-2 ${isUser ? "flex justify-end" : ""}`}>
            <img src={message.imagePreview} alt="Uploaded" className="h-40 rounded-xl border border-border object-cover" />
          </div>
        )}

        {textContent && (
          <div className={`inline-block p-4 rounded-2xl text-left ${isUser ? "bg-gold text-accent-foreground" : "bg-secondary"}`}>
            {isUser ? (
              <p className="whitespace-pre-wrap">{textContent}</p>
            ) : (
              <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-li:my-0.5 prose-headings:mb-2 prose-headings:mt-3">
                <ReactMarkdown>{textContent}</ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* Outfit Cards */}
        {outfits.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            {outfits.map((outfit, oi) => (
              <div key={oi} className="rounded-xl bg-card border border-border p-4 text-left shadow-card">
                <h4 className="font-display font-semibold text-sm mb-3">{outfit.name}</h4>
                <div className="space-y-2 mb-3">
                  {outfit.items.map((item, ii) => (
                    <div key={ii} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        <span className="font-medium text-foreground">{item.type}:</span> {item.name}
                      </span>
                      <span className="font-medium whitespace-nowrap ml-2">₹{item.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="font-display font-bold text-sm">
                    Total: ₹{outfit.items.reduce((s, i) => s + i.price, 0).toLocaleString()}
                  </span>
                  <div className="flex gap-1">
                    {outfit.items.map((item, ii) => (
                      <div key={ii} className="flex gap-1">
                        <button
                          onClick={() => addToWishlist({ name: item.name, price: item.price, platform: item.platform })}
                          className="p-1.5 rounded-md hover:bg-secondary transition-colors"
                          title={`Save ${item.name}`}
                        >
                          <Heart className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => addToCart({ name: item.name, price: item.price, platform: item.platform })}
                          className="p-1.5 rounded-md hover:bg-secondary transition-colors"
                          title={`Add ${item.name} to cart`}
                        >
                          <ShoppingBag className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AIStylist;
