import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Plus, Trash2, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const emptyAddress = { full_name: "", phone: "", address_line1: "", address_line2: "", city: "", state: "", pincode: "", label: "Home" };

const AddressesPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyAddress);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) fetchAddresses();
  }, [user]);

  const fetchAddresses = async () => {
    const { data } = await supabase.from("addresses").select("*").eq("user_id", user!.id).order("is_default", { ascending: false });
    setAddresses(data || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    setSaving(true);
    const { error } = await supabase.from("addresses").insert({ ...form, user_id: user!.id });
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setShowForm(false);
      setForm(emptyAddress);
      fetchAddresses();
      toast({ title: "Address added!" });
    }
  };

  const removeAddress = async (id: string) => {
    await supabase.from("addresses").delete().eq("id", id);
    setAddresses(addresses.filter((a) => a.id !== id));
    toast({ title: "Address removed" });
  };

  const setDefault = async (id: string) => {
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user!.id);
    await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    fetchAddresses();
    toast({ title: "Default address updated" });
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-semibold">Addresses</h2>
        <Button variant="gold" size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" /> Add Address
        </Button>
      </div>

      {showForm && (
        <div className="p-6 rounded-xl border border-border bg-card mb-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Full Name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></div>
          </div>
          <div className="space-y-2"><Label>Address Line 1</Label><Input value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} required /></div>
          <div className="space-y-2"><Label>Address Line 2</Label><Input value={form.address_line2} onChange={(e) => setForm({ ...form, address_line2: e.target.value })} /></div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2"><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required /></div>
            <div className="space-y-2"><Label>State</Label><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Pincode</Label><Input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} required /></div>
          </div>
          <div className="flex gap-3">
            <Button variant="gold" onClick={handleAdd} disabled={saving}>{saving ? "Saving..." : "Save Address"}</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {addresses.length === 0 && !showForm ? (
        <div className="text-center py-16 text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No saved addresses</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div key={addr.id} className="p-4 rounded-xl border border-border bg-card relative">
              {addr.is_default && (
                <span className="absolute top-3 right-3 text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Star className="w-3 h-3" /> Default
                </span>
              )}
              <p className="font-medium">{addr.full_name}</p>
              <p className="text-sm text-muted-foreground mt-1">{addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ""}</p>
              <p className="text-sm text-muted-foreground">{addr.city}, {addr.state} - {addr.pincode}</p>
              <p className="text-sm text-muted-foreground">{addr.phone}</p>
              <div className="flex gap-2 mt-3">
                {!addr.is_default && (
                  <Button variant="ghost" size="sm" onClick={() => setDefault(addr.id)}>Set Default</Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => removeAddress(addr.id)} className="text-destructive hover:text-destructive">
                  <Trash2 className="w-3 h-3" /> Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressesPage;
