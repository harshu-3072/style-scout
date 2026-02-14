import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Shirt, X, Upload, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const CATEGORIES = ["Top", "Bottom", "Footwear", "Jacket", "Dress", "Accessory", "Ethnic", "Activewear", "Other"];

interface WardrobeItem {
  id: string;
  name: string;
  category: string;
  color: string | null;
  brand: string | null;
  image_url: string | null;
  notes: string | null;
  created_at: string;
}

const WardrobePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", category: "Top", color: "", brand: "", notes: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["wardrobe", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wardrobe_items" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as WardrobeItem[];
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      let imageUrl: string | null = null;

      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${user!.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("wardrobe").upload(path, imageFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("wardrobe").getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("wardrobe_items" as any).insert({
        user_id: user!.id,
        name: form.name,
        category: form.category,
        color: form.color || null,
        brand: form.brand || null,
        image_url: imageUrl,
        notes: form.notes || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wardrobe"] });
      setForm({ name: "", category: "Top", color: "", brand: "", notes: "" });
      setImageFile(null);
      setImagePreview(null);
      setShowForm(false);
      setUploading(false);
      toast({ title: "Item added to wardrobe 👕" });
    },
    onError: (err: any) => {
      setUploading(false);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("wardrobe_items" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wardrobe"] });
      toast({ title: "Item removed" });
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const grouped = CATEGORIES.reduce<Record<string, WardrobeItem[]>>((acc, cat) => {
    const catItems = items.filter((i) => i.category === cat);
    if (catItems.length > 0) acc[cat] = catItems;
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold">My Wardrobe</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Save your clothes and get personalized AI suggestions
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/ai-stylist">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Sparkles className="w-4 h-4" /> Style My Wardrobe
            </Button>
          </Link>
          <Button size="sm" className="gap-1.5" onClick={() => setShowForm(!showForm)}>
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Cancel" : "Add Item"}
          </Button>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="rounded-xl border border-border bg-card p-5 mb-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input placeholder="Item name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Color (e.g. Navy Blue)" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            <Input placeholder="Brand (optional)" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
          </div>
          <Input placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

          <div className="flex items-center gap-3">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1.5">
              <Upload className="w-4 h-4" /> Photo
            </Button>
            {imagePreview && (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="h-16 rounded-lg border border-border" />
                <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <Button onClick={() => addMutation.mutate()} disabled={!form.name.trim() || uploading} className="w-full sm:w-auto">
            {uploading ? "Saving..." : "Save to Wardrobe"}
          </Button>
        </div>
      )}

      {/* Items */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading wardrobe...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Shirt className="w-12 h-12 mx-auto text-muted-foreground/50" />
          <p className="text-muted-foreground">Your wardrobe is empty</p>
          <Button size="sm" onClick={() => setShowForm(true)}>Add your first item</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, catItems]) => (
            <div key={category}>
              <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">{category} ({catItems.length})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {catItems.map((item) => (
                  <div key={item.id} className="group rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    {item.image_url ? (
                      <div className="aspect-square bg-secondary">
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="aspect-square bg-secondary flex items-center justify-center">
                        <Shirt className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="p-3">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {item.color && <span className="text-xs text-muted-foreground">{item.color}</span>}
                        {item.brand && <span className="text-xs text-muted-foreground">• {item.brand}</span>}
                      </div>
                      <button
                        onClick={() => deleteMutation.mutate(item.id)}
                        className="mt-2 text-xs text-destructive hover:underline flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WardrobePage;
