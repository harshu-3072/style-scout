import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface SavedLook {
  id: string;
  name: string;
  items: { type: string; name: string; price: number; platform: string }[];
  created_at: string;
}

const SavedLooksPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: looks = [], isLoading } = useQuery({
    queryKey: ["saved-looks", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_looks" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as SavedLook[];
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("saved_looks" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-looks"] });
      toast({ title: "Look deleted" });
    },
  });

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">Loading saved looks...</div>;
  }

  if (looks.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <Sparkles className="w-12 h-12 mx-auto text-muted-foreground/40" />
        <h2 className="font-display text-xl font-semibold">No saved looks yet</h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Chat with the AI Stylist to get outfit suggestions, then save the ones you love!
        </p>
        <Link to="/ai-stylist">
          <Button variant="gold" className="mt-2">Open AI Stylist</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-bold mb-6">Saved Looks</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {looks.map((look) => (
          <div key={look.id} className="rounded-xl bg-card border border-border p-5 shadow-card">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-display font-semibold text-sm">{look.name}</h3>
              <button
                onClick={() => deleteMutation.mutate(look.id)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Delete look"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5 mb-3">
              {look.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">{item.type}:</span> {item.name}
                  </span>
                  <span className="font-medium whitespace-nowrap ml-2">₹{item.price.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="font-display font-bold text-sm">
                Total: ₹{look.items.reduce((s, i) => s + i.price, 0).toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(look.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedLooksPage;
