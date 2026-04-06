import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_ROUNDS = 5;
const BASE_DELAY_MS = 1200;

type GeminiKey = {
  name: string;
  value: string;
};

function getGeminiKeys(): GeminiKey[] {
  const keys: GeminiKey[] = [];
  const names = ["GOOGLE_GEMINI_API_KEY", "GOOGLE_GEMINI_API_KEY_2", "GOOGLE_GEMINI_API_KEY_3", "GOOGLE_GEMINI_API_KEY_4", "GOOGLE_GEMINI_API_KEY_5"];
  for (const name of names) {
    const val = Deno.env.get(name);
    if (val) keys.push({ name, value: val });
  }
  return keys;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryDelayMs(response: Response | null, round: number) {
  const retryAfter = response?.headers.get("retry-after") ?? null;
  const retryAfterSeconds = retryAfter ? Number(retryAfter) : NaN;

  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    return Math.min(retryAfterSeconds * 1000, 15000);
  }

  const retryAfterDateMs = retryAfter ? Date.parse(retryAfter) - Date.now() : NaN;
  if (Number.isFinite(retryAfterDateMs) && retryAfterDateMs > 0) {
    return Math.min(retryAfterDateMs, 15000);
  }

  return Math.min(BASE_DELAY_MS * 2 ** round, 10000);
}

function rotateKeys<T>(keys: T[]) {
  if (keys.length <= 1) return keys;
  const offset = Math.floor(Math.random() * keys.length);
  return [...keys.slice(offset), ...keys.slice(0, offset)];
}

function isInvalidGeminiKey(status: number, errorText: string) {
  if (status !== 400 && status !== 403) return false;

  const normalizedError = errorText.toUpperCase();
  return normalizedError.includes("API_KEY_INVALID") || normalizedError.includes("API KEY NOT VALID");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { outfitName, items, gender } = await req.json();

    const geminiKeys = rotateKeys(getGeminiKeys());
    if (geminiKeys.length === 0) throw new Error("No Gemini API keys configured");
    let activeKeys = [...geminiKeys];

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
    const invalidKeyNames = new Set<string>();

    for (let round = 0; round < MAX_ROUNDS; round++) {
      if (activeKeys.length === 0) break;

      let roundWasRateLimited = false;
      let retryDelayMs = 0;
      const nextRoundKeys: GeminiKey[] = [];

      for (let i = 0; i < activeKeys.length; i++) {
        const key = activeKeys[i];
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${key.value}`;

        console.log(`Trying Gemini key ${i + 1}/${activeKeys.length} in round ${round + 1}/${MAX_ROUNDS}`);

        const response = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: requestBody,
        });

        if (response.status === 429) {
          sawRateLimit = true;
          roundWasRateLimited = true;
          lastError = "Rate limit exceeded";
          retryDelayMs = Math.max(retryDelayMs, getRetryDelayMs(response, round));
          console.log(`Key ${i + 1} rate limited in round ${round + 1}, trying next...`);
          await response.text();
          nextRoundKeys.push(key);
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();

          if (isInvalidGeminiKey(response.status, errorText)) {
            invalidKeyNames.add(key.name);
            lastError = `Invalid API key: ${key.name}`;
            console.error(`Key ${i + 1} (${key.name}) is invalid and will be skipped for the rest of this request.`, response.status, errorText);
            continue;
          }

          lastError = `API error ${response.status}`;
          console.error(`Key ${i + 1} (${key.name}) error:`, response.status, errorText);

          if (response.status >= 500) {
            nextRoundKeys.push(key);
          }

          continue;
        }

        const data = await response.json();
        const imagePart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);

        if (!imagePart?.inlineData) {
          lastError = "No image generated";
          console.log(`Key ${i + 1} returned no image, trying next...`);
          nextRoundKeys.push(key);
          continue;
        }

        const imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
        return new Response(JSON.stringify({ imageUrl }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      activeKeys = rotateKeys(nextRoundKeys);

      if (roundWasRateLimited && round < MAX_ROUNDS - 1 && activeKeys.length > 0) {
        const waitMs = retryDelayMs || getRetryDelayMs(null, round);
        console.log(`Waiting ${waitMs}ms before retrying ${activeKeys.length} remaining key(s)...`);
        await delay(waitMs);
      }
    }

    const validKeyCount = geminiKeys.length - invalidKeyNames.size;

    if (validKeyCount === 0) {
      return new Response(JSON.stringify({ error: "No valid Gemini image-generation API keys are configured. Please replace the invalid keys." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (sawRateLimit && lastError === "Rate limit exceeded") {
      const errorMessage = invalidKeyNames.size > 0
        ? `The ${validKeyCount} valid image-generation key(s) are temporarily rate limited. ${invalidKeyNames.size} configured key(s) are invalid and should be replaced.`
        : "All image-generation keys are temporarily rate limited. Please try again in a few seconds.";

      return new Response(JSON.stringify({
        imageUrl: null,
        temporarilyUnavailable: true,
        retryAfterMs: getRetryDelayMs(null, MAX_ROUNDS - 1),
        message: errorMessage,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`All ${validKeyCount} valid API keys failed. Last error: ${lastError}`);
  } catch (error) {
    console.error("generate-outfit-image error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
