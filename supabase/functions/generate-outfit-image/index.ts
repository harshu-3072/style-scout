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
    const { outfitName, items, gender } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build a detailed prompt showing a model wearing the outfit
    const itemDescriptions = items
      .map((item: any) => `${item.type}: ${item.name}`)
      .join(", ");

    const genderLabel = gender === "male" ? "male" : gender === "female" ? "female" : "stylish";

    const prompt = `Create a stunning high-resolution full-body fashion editorial photograph in 2:3 portrait aspect ratio of a ${genderLabel} model wearing this complete outfit called "${outfitName}": ${itemDescriptions}.

ABSOLUTELY CRITICAL - DO NOT VIOLATE:
1. FULL BODY FRAMING: The photograph MUST show the model from the TOP OF THE HEAD (including hair) all the way down to the BOTTOM OF THE FEET/SHOES. Leave adequate space above the head and below the feet. Never crop the face, head, hair, or feet.
2. FACE: The model's face must be fully visible, well-lit, with natural expression. Show clear facial features - eyes, nose, mouth. No obscuring, no blurring, no cropping of the face.
3. FEET & SHOES: The footwear/shoes must be COMPLETELY visible at the bottom of the frame. Show the full shoe from toe to heel.
4. OUTFIT VISIBILITY: Every single item described must be clearly visible and distinguishable on the model.
5. POSE: Natural, confident standing pose - slightly angled 3/4 view to show outfit dimension. Arms relaxed or one hand on hip.
6. LIGHTING: Professional fashion studio lighting - soft key light with fill, creating depth and highlighting fabric textures.
7. BACKGROUND: Clean, minimal studio backdrop (light grey or white seamless paper).
8. QUALITY: Ultra high resolution, sharp focus throughout, magazine-quality fashion photography.
9. NO text, NO watermarks, NO logos, NO overlays of any kind.
10. The image should look like it belongs in Vogue or Elle magazine.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("Image generation error:", response.status, errorText);
      throw new Error(`Image generation failed: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error("No image was generated");
    }

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-outfit-image error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
