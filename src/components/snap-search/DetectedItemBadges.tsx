import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DetectedItem {
  type: string;
  color: string;
  style: string;
  material?: string;
  brand?: string;
}

interface DetectedItemBadgesProps {
  item: DetectedItem;
}

export function DetectedItemBadges({ item }: DetectedItemBadgesProps) {
  return (
    <section className="py-6 border-b border-border bg-card/50">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Eye className="w-4 h-4 text-accent" />
            <span className="font-medium">AI Detected:</span>
          </div>
          <Badge className="bg-accent text-accent-foreground font-semibold">
            {item.type}
          </Badge>
          <Badge variant="secondary">{item.color}</Badge>
          <Badge variant="secondary">{item.style}</Badge>
          {item.material && <Badge variant="secondary">{item.material}</Badge>}
          {item.brand && item.brand !== "Unknown" && (
            <Badge variant="outline" className="border-accent/30 text-accent font-medium">
              {item.brand}
            </Badge>
          )}
        </div>
      </div>
    </section>
  );
}
