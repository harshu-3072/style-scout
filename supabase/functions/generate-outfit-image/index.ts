import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function callGeminiWithRetry(url: string, body: string, maxRetries = 3): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (response.status === 429 && attempt < maxRetries) {
      const delay = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s
      console.log(`Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }

    return response;
  }
  throw new Error("Max retries exceeded");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { outfitName, items, gender } = await req.json();

    const GOOGLE_GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!GOOGLE_GEMINI_API_KEY) throw new Error("GOOGLE_GEMINI_API_KEY is not configured");

    const itemDescriptions = items
      .map((item: any) => `${item.type}: ${item.name}`)
      .join(", ");

    const genderLabel = gender === "male" ? "male" : gender === "female" ? "female" : "stylish";

    const prompt = `Full-body fashion photograph, vertical portrait orientation. A ${genderLabel} model wearing: ${itemDescriptions}. Outfit name: "${outfitName}".

MANDATORY FRAMING REQUIREMENTS:
- Camera positioned at waist height, pointing straight ahead
- Frame starts 30cm ABOVE the top of the model's head
- Frame ends 30cm BELOW the soles of the shoes/feet
- The model occupies roughly 80% of the vertical frame height
- EVERY item listed must be clearly visible

BODY & FACE:
- Full face visible: eyes, nose, mouth, jawline — no cropping, no blur, no obstruction
- Hair fully visible including the top of the head
- Natural confident expression, slight smile
- 3/4 angle body pose, one hand relaxed at side

FEET & SHOES:
- Both shoes/feet COMPLETELY visible from toe to heel
- Floor/ground line visible beneath the shoes
- Shoes must not be cut off at the bottom edge under any circumstance

TECHNICAL:
- Clean light-grey seamless studio backdrop
- Soft professional studio lighting, no harsh shadows
- Ultra-sharp focus on the entire body from head to toe
- Magazine-quality editorial fashion photography
- Absolutely NO text, watermarks, logos, or overlays`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GOOGLE_GEMINI_API_KEY}`;

    const requestBody = JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    });

    const response = await callGeminiWithRetry(geminiUrl, requestBody);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini image error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Image generation failed: ${response.status}`);
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts;

    if (!parts) throw new Error("No image was generated");

    const imagePart = parts.find((p: any) => p.inlineData);
    if (!imagePart?.inlineData) {
      throw new Error("No image was generated");
    }

    const imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;

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
