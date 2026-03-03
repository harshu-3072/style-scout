import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Heart, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const WishlistPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchWishlist();
  }, [user]);

  const fetchWishlist = async () => {
    const { data, error } = await supabase.from("wishlist").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
    if (error) toast({ title: "Error loading wishlist", description: error.message, variant: "destructive" });
    setItems(data || []);
    setLoading(false);
  };

  const removeItem = async (id: string) => {
    await supabase.from("wishlist").delete().eq("id", id);
    setItems(items.filter((i) => i.id !== id));
    toast({ title: "Removed from wishlist" });
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold mb-6">Wishlist</h2>
      {items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Heart className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Your wishlist is empty</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 p-4 rounded-xl border border-border bg-card">
              {item.product_image && (
                <img src={item.product_image} alt={item.product_name} className="w-20 h-20 rounded-lg object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">{item.product_name}</h3>
                {item.product_platform && <p className="text-xs text-muted-foreground">{item.product_platform}</p>}
                {item.product_price && <p className="text-sm font-semibold text-gold mt-1">₹{item.product_price}</p>}
              </div>
              <div className="flex flex-col gap-1">
                {item.product_url && (
                  <a href={item.product_url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-secondary rounded-lg transition-colors">
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </a>
                )}
                <button onClick={() => removeItem(item.id)} className="p-2 hover:bg-destructive/10 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
