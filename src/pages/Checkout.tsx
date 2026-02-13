import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  MapPin, Plus, CreditCard, Smartphone, Banknote,
  ChevronRight, ShoppingBag, CheckCircle2, Star,
} from "lucide-react";

type PaymentMethod = "UPI" | "Card" | "COD";

const paymentOptions: { method: PaymentMethod; label: string; icon: React.ElementType; desc: string }[] = [
  { method: "UPI", label: "UPI", icon: Smartphone, desc: "Pay via Google Pay, PhonePe, etc." },
  { method: "Card", label: "Credit / Debit Card", icon: CreditCard, desc: "Visa, Mastercard, RuPay" },
  { method: "COD", label: "Cash on Delivery", icon: Banknote, desc: "Pay when you receive" },
];

const Checkout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentMethod>("COD");
  const [placing, setPlacing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    const [cartRes, addrRes] = await Promise.all([
      supabase.from("cart_items").select("*").eq("user_id", user!.id),
      supabase.from("addresses").select("*").eq("user_id", user!.id).order("is_default", { ascending: false }),
    ]);
    const cart = cartRes.data || [];
    const addrs = addrRes.data || [];
    setCartItems(cart);
    setAddresses(addrs);
    if (addrs.length > 0) {
      const def = addrs.find((a: any) => a.is_default) || addrs[0];
      setSelectedAddress(def.id);
    }
    setLoading(false);
    if (cart.length === 0) {
      toast({ title: "Cart is empty", description: "Add items to cart first", variant: "destructive" });
      navigate("/account/cart");
    }
  };

  const total = cartItems.reduce((s, i) => s + i.product_price * i.quantity, 0);

  const placeOrder = async () => {
    if (!selectedAddress) {
      toast({ title: "Select an address", variant: "destructive" });
      return;
    }
    setPlacing(true);

    // Create order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({ user_id: user!.id, address_id: selectedAddress, payment_method: payment, total, status: "placed" })
      .select()
      .single();

    if (orderErr || !order) {
      toast({ title: "Failed to place order", description: orderErr?.message, variant: "destructive" });
      setPlacing(false);
      return;
    }

    // Add order items
    const items = cartItems.map((ci) => ({
      order_id: order.id,
      product_name: ci.product_name,
      product_image: ci.product_image,
      product_price: ci.product_price,
      product_url: ci.product_url,
      product_platform: ci.product_platform,
      quantity: ci.quantity,
    }));
    await supabase.from("order_items").insert(items);

    // Clear cart
    await supabase.from("cart_items").delete().eq("user_id", user!.id);

    setPlacing(false);
    navigate("/account/orders", { state: { orderPlaced: true } });
  };

  if (loading) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4 flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h1 className="font-display text-3xl font-bold mb-8">Checkout</h1>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-10">
          {[
            { n: 1, label: "Address" },
            { n: 2, label: "Payment" },
            { n: 3, label: "Review" },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <button
                onClick={() => s.n <= step && setStep(s.n as 1 | 2 | 3)}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                  step >= s.n ? "bg-gold text-accent-foreground" : "bg-secondary text-muted-foreground"
                )}
              >
                {step > s.n ? <CheckCircle2 className="w-4 h-4" /> : s.n}
              </button>
              <span className={cn("text-sm font-medium", step >= s.n ? "text-foreground" : "text-muted-foreground")}>{s.label}</span>
              {i < 2 && <ChevronRight className="w-4 h-4 text-muted-foreground mx-2" />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          {/* Main content */}
          <div>
            {/* Step 1: Address */}
            {step === 1 && (
              <div>
                <h2 className="font-display text-xl font-semibold mb-4">Select Delivery Address</h2>
                {addresses.length === 0 ? (
                  <div className="text-center py-12 border border-border rounded-xl">
                    <MapPin className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                    <p className="text-muted-foreground mb-4">No saved addresses</p>
                    <Button variant="gold" size="sm" onClick={() => navigate("/account/addresses")}>
                      <Plus className="w-4 h-4" /> Add Address
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((addr) => (
                      <button
                        key={addr.id}
                        onClick={() => setSelectedAddress(addr.id)}
                        className={cn(
                          "w-full text-left p-4 rounded-xl border transition-all",
                          selectedAddress === addr.id
                            ? "border-gold bg-gold/5 ring-1 ring-gold"
                            : "border-border bg-card hover:border-gold/40"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-medium">{addr.full_name}</span>
                            {addr.is_default && (
                              <span className="ml-2 text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
                                <Star className="w-3 h-3" /> Default
                              </span>
                            )}
                          </div>
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                            selectedAddress === addr.id ? "border-gold" : "border-muted-foreground/30"
                          )}>
                            {selectedAddress === addr.id && <div className="w-2.5 h-2.5 rounded-full bg-gold" />}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ""}, {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                        <p className="text-sm text-muted-foreground">{addr.phone}</p>
                      </button>
                    ))}
                    <Button variant="ghost" size="sm" onClick={() => navigate("/account/addresses")} className="mt-2">
                      <Plus className="w-4 h-4" /> Add New Address
                    </Button>
                  </div>
                )}
                <div className="mt-6">
                  <Button variant="gold" size="lg" onClick={() => setStep(2)} disabled={!selectedAddress}>
                    Continue to Payment <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <div>
                <h2 className="font-display text-xl font-semibold mb-4">Payment Method</h2>
                <div className="space-y-3">
                  {paymentOptions.map((opt) => (
                    <button
                      key={opt.method}
                      onClick={() => setPayment(opt.method)}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border flex items-center gap-4 transition-all",
                        payment === opt.method
                          ? "border-gold bg-gold/5 ring-1 ring-gold"
                          : "border-border bg-card hover:border-gold/40"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        payment === opt.method ? "bg-gold/20" : "bg-secondary"
                      )}>
                        <opt.icon className={cn("w-5 h-5", payment === opt.method ? "text-gold" : "text-muted-foreground")} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{opt.label}</p>
                        <p className="text-sm text-muted-foreground">{opt.desc}</p>
                      </div>
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                        payment === opt.method ? "border-gold" : "border-muted-foreground/30"
                      )}>
                        {payment === opt.method && <div className="w-2.5 h-2.5 rounded-full bg-gold" />}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-6 flex gap-3">
                  <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                  <Button variant="gold" size="lg" onClick={() => setStep(3)}>
                    Review Order <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div>
                <h2 className="font-display text-xl font-semibold mb-4">Review Your Order</h2>
                <div className="space-y-4">
                  {/* Address summary */}
                  <div className="p-4 rounded-xl border border-border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted-foreground">Delivery Address</span>
                      <button onClick={() => setStep(1)} className="text-xs text-gold hover:underline">Change</button>
                    </div>
                    {(() => {
                      const addr = addresses.find((a) => a.id === selectedAddress);
                      if (!addr) return null;
                      return (
                        <div>
                          <p className="font-medium">{addr.full_name}</p>
                          <p className="text-sm text-muted-foreground">{addr.address_line1}, {addr.city}, {addr.state} - {addr.pincode}</p>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Payment summary */}
                  <div className="p-4 rounded-xl border border-border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted-foreground">Payment Method</span>
                      <button onClick={() => setStep(2)} className="text-xs text-gold hover:underline">Change</button>
                    </div>
                    <p className="font-medium">{paymentOptions.find((p) => p.method === payment)?.label}</p>
                  </div>

                  {/* Items */}
                  <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                    <span className="text-sm font-medium text-muted-foreground">Items ({cartItems.length})</span>
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex gap-3 items-center">
                        {item.product_image && <img src={item.product_image} alt="" className="w-12 h-12 rounded-lg object-cover" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-semibold">₹{(item.product_price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                  <Button variant="gold" size="lg" onClick={placeOrder} disabled={placing}>
                    {placing ? "Placing Order..." : "Place Order"} <ShoppingBag className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:sticky lg:top-28 h-fit">
            <div className="p-6 rounded-xl border border-border bg-card">
              <h3 className="font-display text-lg font-semibold mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ({cartItems.length} items)</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="text-green-600 font-medium">FREE</span>
                </div>
                <div className="border-t border-border pt-2 mt-2 flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span className="text-gold">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Checkout;
