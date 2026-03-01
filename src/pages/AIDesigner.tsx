import { useState, useRef } from "react";
import { Palette, Sparkles, Sun, Snowflake, CloudRain, Leaf, Wand2, RotateCcw, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useProductActions } from "@/hooks/use-product-actions";
import { OutfitCard, type ParsedOutfit } from "@/components/ai-stylist/OutfitCard";
import { OutfitImagePreview } from "@/components/ai-stylist/OutfitImagePreview";
import ReactMarkdown from "react-markdown";

const STYLES = [
  { id: "casual", label: "Casual", icon: "👕", desc: "Everyday comfort" },
  { id: "ethnic", label: "Ethnic", icon: "🪷", desc: "Traditional elegance" },
  { id: "party", label: "Party", icon: "🎉", desc: "Night out glam" },
  { id: "formal", label: "Formal", icon: "👔", desc: "Boardroom ready" },
  { id: "streetwear", label: "Streetwear", icon: "🧢", desc: "Urban edge" },
  { id: "boho", label: "Bohemian", icon: "🌻", desc: "Free-spirited" },
];

const COLORS = [
  { id: "black", label: "Black", hex: "#1a1a1a" },
  { id: "white", label: "White", hex: "#f5f5f5" },
  { id: "navy", label: "Navy", hex: "#1e3a5f" },
  { id: "red", label: "Red", hex: "#dc2626" },
  { id: "olive", label: "Olive", hex: "#556b2f" },
  { id: "beige", label: "Beige", hex: "#d4b896" },
  { id: "pink", label: "Pink", hex: "#ec4899" },
  { id: "brown", label: "Brown", hex: "#8b4513" },
  { id: "lavender", label: "Lavender", hex: "#9b8ec4" },
  { id: "mustard", label: "Mustard", hex: "#d4a017" },
];

const SEASONS = [
  { id: "summer", label: "Summer", icon: Sun, color: "text-amber-500" },
  { id: "winter", label: "Winter", icon: Snowflake, color: "text-blue-400" },
  { id: "monsoon", label: "Monsoon", icon: CloudRain, color: "text-slate-500" },
  { id: "spring", label: "Spring", icon: Leaf, color: "text-emerald-500" },
];

const BUDGETS = [
  { id: "budget", label: "Budget", desc: "Under ₹3,000" },
  { id: "medium", label: "Medium", desc: "₹3,000 – ₹8,000" },
  { id: "premium", label: "Premium", desc: "₹8,000+" },
];

type OutfitItem = {
  type: string;
  name: string;
  price: number;
  platform: string;
};

type Outfit = {
  name: string;
  items: OutfitItem[];
};

function parseOutfits(text: string): Outfit[] {
  const outfits: Outfit[] = [];
  const regex = /:::outfit\[(.+?)\]([\s\S]*?):::/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const name = match[1].trim();
    const block = match[2];
    const items: OutfitItem[] = [];
    const lines = block.split("\n").filter((l) => l.trim().startsWith("- "));
    for (const line of lines) {
      const cleaned = line.replace(/^-\s*/, "").trim();
      const parts = cleaned.split("|").map((p) => p.trim());
      if (parts.length >= 3) {
        const [typeAndName, priceStr, platform] = parts;
        const colonIdx = typeAndName.indexOf(":");
        const type = colonIdx > -1 ? typeAndName.slice(0, colonIdx).trim() : "Item";
        const itemName = colonIdx > -1 ? typeAndName.slice(colonIdx + 1).trim() : typeAndName;
        const price = parseInt(priceStr.replace(/[^\d]/g, "")) || 0;
        items.push({ type, name: itemName, price, platform });
      }
    }
    if (items.length > 0) outfits.push({ name, items });
  }
  return outfits;
}

export default function AIDesigner() {
  const [selectedStyle, setSelectedStyle] = useState("");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSeason, setSelectedSeason] = useState("");
  const [selectedBudget, setSelectedBudget] = useState("medium");
  const [isGenerating, setIsGenerating] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  const abortRef = useRef<AbortController | null>(null);

  const toggleColor = (id: string) => {
    setSelectedColors((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const canGenerate = selectedStyle && selectedColors.length > 0 && selectedSeason;

  const generate = async () => {
    if (!canGenerate) return;
    setIsGenerating(true);
    setResponseText("");
    setStep(4);

    try {
      abortRef.current = new AbortController();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-designer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            style: selectedStyle,
            colors: selectedColors,
            season: selectedSeason,
            budget: selectedBudget,
          }),
          signal: abortRef.current.signal,
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Generation failed" }));
        throw new Error(err.error || "Generation failed");
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              full += content;
              setResponseText(full);
            }
          } catch {}
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        toast({ title: "Error", description: e.message, variant: "destructive" });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const reset = () => {
    abortRef.current?.abort();
    setSelectedStyle("");
    setSelectedColors([]);
    setSelectedSeason("");
    setSelectedBudget("medium");
    setResponseText("");
    setIsGenerating(false);
    setStep(1);
  };

  const outfits = parseOutfits(responseText);
  const nonOutfitText = responseText
    .replace(/:::outfit\[.+?\][\s\S]*?:::/g, "")
    .trim();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero py-16 md:py-24">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-accent blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-accent blur-3xl" />
        </div>
        <div className="container relative text-center max-w-3xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent mb-6">
            <Wand2 className="w-4 h-4" />
            <span className="text-sm font-medium font-body">AI-Powered Fashion</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-4 tracking-tight">
            AI Fashion <span className="text-gradient-gold">Designer</span>
          </h1>
          <p className="text-muted-foreground text-lg font-body max-w-xl mx-auto">
            Tell us your vibe, pick your palette, and let AI craft stunning outfit suggestions tailored just for you.
          </p>
        </div>
      </section>

      <div className="container max-w-5xl mx-auto px-4 py-12 space-y-10">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 md:gap-4 text-sm font-body">
          {["Style", "Colors", "Season", "Results"].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  step > i + 1
                    ? "bg-accent text-accent-foreground"
                    : step === i + 1
                    ? "bg-primary text-primary-foreground ring-2 ring-accent ring-offset-2 ring-offset-background"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
              <span className={`hidden md:inline ${step >= i + 1 ? "text-foreground" : "text-muted-foreground"}`}>
                {label}
              </span>
              {i < 3 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {/* Step 1: Style */}
        {step >= 1 && step < 4 && (
          <div className="animate-fade-up space-y-4">
            <h2 className="text-2xl font-display font-semibold text-foreground">Pick Your Style</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {STYLES.map((s) => (
                <Card
                  key={s.id}
                  onClick={() => { setSelectedStyle(s.id); if (step === 1) setStep(2); }}
                  className={`cursor-pointer transition-all hover:shadow-card group ${
                    selectedStyle === s.id
                      ? "ring-2 ring-accent bg-accent/5 shadow-gold"
                      : "hover:bg-secondary/50"
                  }`}
                >
                  <CardContent className="p-4 text-center space-y-1">
                    <span className="text-3xl">{s.icon}</span>
                    <p className="font-semibold text-foreground font-body">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Colors */}
        {step >= 2 && step < 4 && (
          <div className="animate-fade-up space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-semibold text-foreground flex items-center gap-2">
                <Palette className="w-5 h-5 text-accent" /> Color Palette
              </h2>
              <span className="text-sm text-muted-foreground font-body">{selectedColors.length}/3 selected</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {COLORS.map((c) => {
                const active = selectedColors.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => { toggleColor(c.id); if (step === 2 && (selectedColors.length > 0 || !active)) setStep(3); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all font-body text-sm ${
                      active
                        ? "border-accent bg-accent/10 shadow-md"
                        : "border-border hover:border-accent/50 bg-card"
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full border border-border/50" style={{ backgroundColor: c.hex }} />
                    {c.label}
                    {active && <span className="text-accent">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Season + Budget + Generate */}
        {step >= 3 && step < 4 && (
          <div className="animate-fade-up space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-display font-semibold text-foreground">Season & Budget</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {SEASONS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <Card
                      key={s.id}
                      onClick={() => setSelectedSeason(s.id)}
                      className={`cursor-pointer transition-all hover:shadow-card ${
                        selectedSeason === s.id ? "ring-2 ring-accent bg-accent/5 shadow-gold" : "hover:bg-secondary/50"
                      }`}
                    >
                      <CardContent className="p-4 text-center space-y-1">
                        <Icon className={`w-6 h-6 mx-auto ${s.color}`} />
                        <p className="font-semibold text-foreground font-body text-sm">{s.label}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {BUDGETS.map((b) => (
                <Badge
                  key={b.id}
                  variant={selectedBudget === b.id ? "default" : "outline"}
                  className={`cursor-pointer px-4 py-2 text-sm transition-all ${
                    selectedBudget === b.id ? "bg-accent text-accent-foreground hover:bg-accent/90" : "hover:bg-secondary"
                  }`}
                  onClick={() => setSelectedBudget(b.id)}
                >
                  {b.label} · {b.desc}
                </Badge>
              ))}
            </div>

            <Button
              size="lg"
              disabled={!canGenerate || isGenerating}
              onClick={generate}
              className="w-full md:w-auto bg-accent text-accent-foreground hover:bg-accent/90 shadow-gold font-body text-base gap-2"
            >
              <Sparkles className="w-5 h-5" />
              {isGenerating ? "Designing..." : "Generate Outfits"}
            </Button>
          </div>
        )}

        {/* Step 4: Results */}
        {step === 4 && (
          <div className="space-y-8 animate-fade-up">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-display font-semibold text-foreground">Your Designs</h2>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Badge variant="outline" className="capitalize">{selectedStyle}</Badge>
                  {selectedColors.map((c) => {
                    const col = COLORS.find((x) => x.id === c);
                    return (
                      <Badge key={c} variant="outline" className="gap-1">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col?.hex }} />
                        {col?.label}
                      </Badge>
                    );
                  })}
                  <Badge variant="outline" className="capitalize">{selectedSeason}</Badge>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={reset} className="gap-1">
                <RotateCcw className="w-4 h-4" /> New Design
              </Button>
            </div>

            {isGenerating && outfits.length === 0 && (
              <div className="flex flex-col items-center py-20 gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-muted border-t-accent animate-spin" />
                  <Sparkles className="w-6 h-6 text-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-muted-foreground font-body animate-pulse-soft">AI is crafting your outfits...</p>
              </div>
            )}

            {outfits.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {outfits.map((outfit, i) => (
                  <div key={i} className="space-y-3">
                    <OutfitCard outfit={outfit} />
                    <OutfitImagePreview outfitName={outfit.name} items={outfit.items} />
                  </div>
                ))}
              </div>
            )}

            {nonOutfitText && (
              <Card className="bg-secondary/30 border-border">
                <CardContent className="p-6 prose prose-sm max-w-none text-foreground font-body">
                  <ReactMarkdown>{nonOutfitText}</ReactMarkdown>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
