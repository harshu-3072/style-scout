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
    const { messages, imageBase64 } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are StyleGenie — a world-class personal AI fashion stylist and designer. You speak with warmth, expertise, and enthusiasm. You give specific, actionable fashion advice.

Your capabilities:
1. **Outfit Suggestions**: When asked, suggest complete outfits with specific items (Top, Bottom, Footwear, Accessories). For each item provide: name, estimated price in INR, and a platform (Amazon, Myntra, Flipkart, Ajio, Meesho, H&M, Zara).
2. **Style Analysis**: If given an image of clothing, analyze it and suggest how to style it, what to pair with it, or suggest more premium/stylish alternatives.
3. **Personal Styling**: Ask about occasion, body type, budget, color preferences to give tailored advice.
4. **Trend Advice**: Share current fashion trends relevant to the user's query.

IMPORTANT FORMATTING RULES:
- When suggesting outfits, ALWAYS use this exact format for each outfit so the app can parse it:

:::outfit[Outfit Name]
- Top: Item Name | ₹Price | Platform
- Bottom: Item Name | ₹Price | Platform  
- Footwear: Item Name | ₹Price | Platform
- Accessory: Item Name | ₹Price | Platform
:::

- You can suggest 2-4 outfits per response.
- Prices should be realistic Indian market prices.
- Always explain WHY you're recommending something — the styling logic.
- Use emojis sparingly but effectively.
- Keep responses conversational but informative.
- If the user shares an image, analyze the garment and suggest styling options or alternatives.`;

    // Build messages array
    const aiMessages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    for (const msg of messages) {
      if (msg.role === "user" && msg.imageBase64) {
        const base64Data = msg.imageBase64.replace(/^data:image\/\w+;base64,/, "");
        aiMessages.push({
          role: "user",
          content: [
            { type: "text", text: msg.content || "Analyze this outfit and suggest how to style it or suggest better alternatives." },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Data}` } },
          ],
        });
      } else {
        aiMessages.push({ role: msg.role, content: msg.content });
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
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
    console.error("ai-stylist error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
