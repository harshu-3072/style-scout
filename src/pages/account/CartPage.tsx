import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, Trash2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const CartPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchCart();
  }, [user]);

  const fetchCart = async () => {
    const { data } = await supabase.from("cart_items").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  const updateQuantity = async (id: string, quantity: number) => {
    if (quantity < 1) return removeItem(id);
    await supabase.from("cart_items").update({ quantity }).eq("id", id);
    setItems(items.map((i) => (i.id === id ? { ...i, quantity } : i)));
  };

  const removeItem = async (id: string) => {
    await supabase.from("cart_items").delete().eq("id", id);
    setItems(items.filter((i) => i.id !== id));
    toast({ title: "Removed from cart" });
  };

  const total = items.reduce((sum, item) => sum + item.product_price * item.quantity, 0);

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold mb-6">Shopping Cart</h2>
      {items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Your cart is empty</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 p-4 rounded-xl border border-border bg-card">
              {item.product_image && (
                <img src={item.product_image} alt={item.product_name} className="w-20 h-20 rounded-lg object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">{item.product_name}</h3>
                {item.product_platform && <p className="text-xs text-muted-foreground">{item.product_platform}</p>}
                <p className="text-sm font-semibold text-gold mt-1">₹{item.product_price}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1.5 border border-border rounded-md hover:bg-secondary">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1.5 border border-border rounded-md hover:bg-secondary">
                  <Plus className="w-3 h-3" />
                </button>
                <button onClick={() => removeItem(item.id)} className="p-1.5 hover:bg-destructive/10 rounded-md ml-2">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-xl font-bold text-gold">₹{total.toFixed(2)}</span>
          </div>
          <Button variant="gold" size="lg" className="w-full" onClick={() => navigate("/checkout")}>
            Proceed to Checkout
          </Button>
        </div>
      )}
    </div>
  );
};

export default CartPage;
