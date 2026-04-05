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
    const { messages, wardrobe } = await req.json();

    const GOOGLE_GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!GOOGLE_GEMINI_API_KEY) throw new Error("GOOGLE_GEMINI_API_KEY is not configured");

    let systemPrompt = `You are StyleGenie — a world-class personal AI fashion stylist and designer. You speak with warmth, expertise, and enthusiasm. You give specific, actionable fashion advice.

Your capabilities:
1. **Outfit Suggestions**: When asked, suggest complete outfits with specific items (Top, Bottom, Footwear, Accessories). For each item provide: name, estimated price in INR, and a platform (Amazon, Myntra, Flipkart, Ajio, Meesho, H&M, Zara).
2. **Style Analysis**: If given an image of clothing, analyze it and suggest how to style it, what to pair with it, or suggest more premium/stylish alternatives.
3. **Personal Styling**: Ask about occasion, body type, budget, color preferences to give tailored advice.
4. **Trend Advice**: Share current fashion trends relevant to the user's query.
5. **Wardrobe Styling**: When the user has wardrobe items, PRIORITIZE suggesting outfits using their existing clothes. Mix their items with new purchases when needed.

IMPORTANT FORMATTING RULES:
- When suggesting outfits, ALWAYS use this exact format for each outfit so the app can parse it:

:::outfit[Outfit Name]
- Top: Item Name | ₹Price | Platform
- Bottom: Item Name | ₹Price | Platform  
- Footwear: Item Name | ₹Price | Platform
- Accessory: Item Name | ₹Price | Platform
:::

- For items from the user's wardrobe, use "Own Wardrobe" as the platform and ₹0 as price.
- You can suggest 2-4 outfits per response.
- Prices should be realistic Indian market prices.
- Always explain WHY you're recommending something — the styling logic.
- Use emojis sparingly but effectively.
- Keep responses conversational but informative.
- If the user shares an image, analyze the garment and suggest styling options or alternatives.`;

    if (wardrobe && Array.isArray(wardrobe) && wardrobe.length > 0) {
      const wardrobeList = wardrobe.map((item: any) =>
        `- ${item.category}: ${item.name}${item.color ? ` (${item.color})` : ""}${item.brand ? ` by ${item.brand}` : ""}`
      ).join("\n");
      systemPrompt += `\n\n## USER'S WARDROBE (items they already own):\n${wardrobeList}\n\nWhen suggesting outfits, try to incorporate items from their wardrobe first, then suggest new purchases to complement.`;
    }

    // Build Gemini contents array
    const contents: any[] = [];

    // Add system instruction via the first user turn context
    for (const msg of messages) {
      if (msg.role === "user" && msg.imageBase64) {
        const base64Data = msg.imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const mimeMatch = msg.imageBase64.match(/^data:(image\/\w+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
        contents.push({
          role: "user",
          parts: [
            { text: msg.content || "Analyze this outfit and suggest how to style it or suggest better alternatives." },
            { inlineData: { mimeType, data: base64Data } },
          ],
        });
      } else {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        });
      }
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${GOOGLE_GEMINI_API_KEY}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Gemini API error: ${response.status}`);
    }

    // Transform Gemini SSE stream to OpenAI-compatible SSE stream
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIdx;
          while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, newlineIdx).trim();
            buffer = buffer.slice(newlineIdx + 1);

            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6);
            if (jsonStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                // Convert to OpenAI-compatible SSE format
                const chunk = JSON.stringify({
                  choices: [{ delta: { content: text } }],
                });
                await writer.write(encoder.encode(`data: ${chunk}\n\n`));
              }
            } catch {
              // skip unparseable lines
            }
          }
        }
        await writer.write(encoder.encode("data: [DONE]\n\n"));
      } catch (e) {
        console.error("Stream processing error:", e);
      } finally {
        writer.close();
      }
    })();

    return new Response(readable, {
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
