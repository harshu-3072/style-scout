import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface ProductData {
  name: string;
  price: number;
  image?: string;
  platform?: string;
  url?: string;
}

export const useProductActions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const requireAuth = () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to continue", variant: "destructive" });
      navigate("/sign-in");
      return false;
    }
    return true;
  };

  const addToWishlist = async (product: ProductData) => {
    if (!requireAuth()) return;
    const { error } = await supabase.from("wishlist").insert({
      user_id: user!.id,
      product_name: product.name,
      product_price: product.price,
      product_image: product.image || null,
      product_platform: product.platform || null,
      product_url: product.url || null,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Added to wishlist ❤️" });
    }
  };

  const addToCart = async (product: ProductData) => {
    if (!requireAuth()) return;
    const { error } = await supabase.from("cart_items").insert({
      user_id: user!.id,
      product_name: product.name,
      product_price: product.price,
      product_image: product.image || null,
      product_platform: product.platform || null,
      product_url: product.url || null,
      quantity: 1,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Added to cart 🛒" });
    }
  };

  return { addToWishlist, addToCart };
};
