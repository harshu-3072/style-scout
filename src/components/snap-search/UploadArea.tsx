import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, Sparkles } from "lucide-react";

interface UploadAreaProps {
  selectedImage: string | null;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  onSearch: () => void;
  isSearching: boolean;
}

export function UploadArea({ selectedImage, onImageUpload, onClear, onSearch, isSearching }: UploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!selectedImage) {
    return (
      <div
        onClick={() => fileInputRef.current?.click()}
        className="relative p-10 md:p-16 border-2 border-dashed border-border rounded-3xl bg-card/50 hover:border-accent/50 hover:bg-accent/5 transition-all duration-300 cursor-pointer group"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onImageUpload}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-5">
          <div className="w-24 h-24 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 group-hover:scale-105 transition-all duration-300">
            <Upload className="w-12 h-12 text-accent" />
          </div>
          <div className="text-center">
            <p className="font-display text-lg font-semibold mb-1 text-foreground">Drop your fashion image here</p>
            <p className="text-sm text-muted-foreground">Supports JPG, PNG, WEBP up to 10MB</p>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <Button variant="gold" size="lg" className="gap-2 shadow-gold">
              <Upload className="w-4 h-4" />
              Upload Image
            </Button>
            <Button variant="outline" size="lg" className="gap-2">
              <Camera className="w-4 h-4" />
              Camera
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative rounded-3xl overflow-hidden bg-card shadow-elevated border border-border">
        <img
          src={selectedImage}
          alt="Uploaded fashion item"
          className="w-full max-h-[420px] object-contain"
        />
        <button
          onClick={onClear}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-foreground/80 text-background flex items-center justify-center hover:bg-foreground transition-colors shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="mt-6 flex justify-center">
        <Button
          variant="gold"
          size="lg"
          onClick={onSearch}
          disabled={isSearching}
          className="min-w-[220px] gap-2 shadow-gold text-base"
        >
          {isSearching ? (
            <>
              <div className="w-5 h-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
              Analyzing...
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
  );
}
