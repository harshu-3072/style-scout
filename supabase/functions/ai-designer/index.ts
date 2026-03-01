import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { style, colors, season, gender, budget } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an elite AI Fashion Designer. Given user preferences, generate 3 stunning outfit suggestions with complementary alternatives.

RULES:
- Each outfit must be a COMPLETE look (top, bottom, footwear, accessory minimum)
- Suggest realistic items available on Indian platforms (Amazon, Myntra, Flipkart, Ajio, H&M, Zara)
- Prices in INR, realistic market rates
- For each outfit, also suggest 1 complementary alternative outfit that pairs well
- Be specific with item names, colors, and brands

FORMAT each outfit EXACTLY like this:

:::outfit[Outfit Name]
- Top: Item Name | ₹Price | Platform
- Bottom: Item Name | ₹Price | Platform
- Footwear: Item Name | ₹Price | Platform
- Accessory: Item Name | ₹Price | Platform
:::

After the main outfits, add a section:

## ✨ Complementary Picks
Brief explanation of why these complement the above outfits, then list 2 bonus outfits in the same format.

Style notes: explain the design philosophy, color theory, and seasonal appropriateness.`;

    const userPrompt = `Design outfits with these preferences:
- Style: ${style}
- Color Preference: ${colors.join(", ")}
- Season: ${season}
- Gender: ${gender || "Unisex"}
- Budget: ${budget || "Medium"}

Create 3 main outfits + 2 complementary alternatives. Make them fashionable, trendy, and cohesive.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("ai-designer error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
