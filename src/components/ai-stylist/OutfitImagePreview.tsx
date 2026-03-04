import { useState } from "react";
import { ImageIcon, Loader2, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import type { ParsedOutfit } from "./OutfitCard";

interface OutfitImagePreviewProps {
  outfit: ParsedOutfit;
  gender?: string;
}

export function OutfitImagePreview({ outfit, gender }: OutfitImagePreviewProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const generateImage = async () => {
    setIsGenerating(true);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-outfit-image`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          outfitName: outfit.name,
          items: outfit.items,
          gender: gender || "person",
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || "Image generation failed");
      }

      const data = await resp.json();
      setImageUrl(data.imageUrl);
    } catch (err: any) {
      console.error("Image generation error:", err);
      toast({
        title: "Image generation failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!imageUrl && !isGenerating) {
    return (
      <button
        onClick={generateImage}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border hover:border-gold/50 hover:bg-gold/5 text-muted-foreground hover:text-gold transition-all duration-200 text-xs font-medium"
      >
        <ImageIcon className="w-3.5 h-3.5" />
        Generate Outfit Preview
      </button>
    );
  }

  if (isGenerating) {
    return (
      <div className="w-full flex items-center justify-center gap-2 py-6 rounded-xl bg-secondary/50 border border-border text-muted-foreground text-xs">
        <Loader2 className="w-4 h-4 animate-spin text-gold" />
        <span>Creating outfit preview...</span>
      </div>
    );
  }

  return (
    <div className="relative group">
      <div
        className={`overflow-hidden rounded-xl border border-border cursor-pointer transition-all duration-300 ${
          isExpanded ? "fixed inset-4 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center" : ""
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <img
          src={imageUrl!}
          alt={`AI preview of ${outfit.name}`}
          className={`w-full object-cover transition-all duration-300 ${
            isExpanded ? "max-h-[80vh] w-auto rounded-xl shadow-elevated" : "h-40"
          }`}
        />
      </div>

      {isExpanded && (
        <button
          onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
          className="fixed top-6 right-6 z-50 p-2 rounded-full bg-background border border-border shadow-lg hover:bg-secondary transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {!isExpanded && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); generateImage(); }}
            className="p-1.5 rounded-lg bg-background/80 backdrop-blur-sm border border-border hover:bg-secondary transition-colors"
            title="Regenerate"
          >
            <RefreshCw className={`w-3 h-3 ${isGenerating ? "animate-spin" : ""}`} />
          </button>
        </div>
      )}
    </div>
  );
}
