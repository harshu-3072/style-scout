import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Package, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  placed: "bg-blue-100 text-blue-700",
  confirmed: "bg-yellow-100 text-yellow-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const OrdersPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const [orders, setOrders] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, any[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  useEffect(() => {
    if ((location.state as any)?.orderPlaced) {
      toast({ title: "🎉 Order placed successfully!" });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Error loading orders", description: error.message, variant: "destructive" });
    setOrders(data || []);
    setLoading(false);
  };

  const toggleExpand = async (orderId: string) => {
    if (expanded === orderId) {
      setExpanded(null);
      return;
    }
    setExpanded(orderId);
    if (!orderItems[orderId]) {
      const { data } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);
      setOrderItems((prev) => ({ ...prev, [orderId]: data || [] }));
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold mb-6">Orders</h2>
      {orders.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No orders yet</p>
          <p className="text-sm mt-1">Your order history will appear here once you place your first order.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl border border-border bg-card overflow-hidden">
              <button
                onClick={() => toggleExpand(order.id)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Package className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      {" · "}{order.payment_method}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn("text-xs px-2 py-1 rounded-full font-medium capitalize", statusColors[order.status] || "bg-secondary text-muted-foreground")}>
                    {order.status}
                  </span>
                  <span className="font-semibold text-sm">₹{Number(order.total).toFixed(2)}</span>
                  {expanded === order.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {expanded === order.id && (
                <div className="border-t border-border p-4 space-y-3 bg-secondary/20">
                  {(orderItems[order.id] || []).map((item) => (
                    <div key={item.id} className="flex gap-3 items-center">
                      {item.product_image && <img src={item.product_image} alt="" className="w-12 h-12 rounded-lg object-cover" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.product_name}</p>
                        {item.product_platform && <p className="text-xs text-muted-foreground">{item.product_platform}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">₹{Number(item.product_price).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
