import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_ROUNDS = 3;
const BASE_DELAY_MS = 1200;

function getGeminiKeys(): string[] {
  const keys: string[] = [];
  const names = ["GOOGLE_GEMINI_API_KEY", "GOOGLE_GEMINI_API_KEY_2", "GOOGLE_GEMINI_API_KEY_3"];
  for (const name of names) {
    const val = Deno.env.get(name);
    if (val) keys.push(val);
  }
  return keys;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryDelayMs(response: Response, round: number) {
  const retryAfter = response.headers.get("retry-after");
  const retryAfterSeconds = retryAfter ? Number(retryAfter) : NaN;

  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    return Math.min(retryAfterSeconds * 1000, 15000);
  }

  return Math.min(BASE_DELAY_MS * 2 ** round, 10000);
}

function rotateKeys(keys: string[]) {
  if (keys.length <= 1) return keys;
  const offset = Math.floor(Math.random() * keys.length);
  return [...keys.slice(offset), ...keys.slice(0, offset)];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { outfitName, items, gender } = await req.json();

    const geminiKeys = rotateKeys(getGeminiKeys());
    if (geminiKeys.length === 0) throw new Error("No Gemini API keys configured");

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

    const requestBody = JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
    });

    let lastError = "";
    let sawRateLimit = false;

    for (let round = 0; round < MAX_ROUNDS; round++) {
      let roundWasRateLimited = false;

      for (let i = 0; i < geminiKeys.length; i++) {
        const key = geminiKeys[i];
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${key}`;

        console.log(`Trying Gemini key ${i + 1}/${geminiKeys.length} in round ${round + 1}/${MAX_ROUNDS}`);

        const response = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: requestBody,
        });

        if (response.status === 429) {
          sawRateLimit = true;
          roundWasRateLimited = true;
          lastError = "Rate limit exceeded";
          console.log(`Key ${i + 1} rate limited in round ${round + 1}, trying next...`);
          await response.text();
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          lastError = `API error ${response.status}`;
          console.error(`Key ${i + 1} error:`, response.status, errorText);
          continue;
        }

        const data = await response.json();
        const imagePart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);

        if (!imagePart?.inlineData) {
          lastError = "No image generated";
          console.log(`Key ${i + 1} returned no image, trying next...`);
          continue;
        }

        const imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
        return new Response(JSON.stringify({ imageUrl }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (roundWasRateLimited && round < MAX_ROUNDS - 1) {
        const waitMs = getRetryDelayMs(new Response(null), round);
        console.log(`All keys were rate limited in round ${round + 1}. Waiting ${waitMs}ms before retrying...`);
        await delay(waitMs);
      }
    }

    if (sawRateLimit && lastError === "Rate limit exceeded") {
      return new Response(JSON.stringify({ error: "All image-generation keys are temporarily rate limited. Please try again in a few seconds." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`All ${geminiKeys.length} API keys failed. Last error: ${lastError}`);
  } catch (error) {
    console.error("generate-outfit-image error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
