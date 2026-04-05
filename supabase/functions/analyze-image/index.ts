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
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "Image data is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GOOGLE_GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!GOOGLE_GEMINI_API_KEY) {
      throw new Error("GOOGLE_GEMINI_API_KEY is not configured");
    }

    let mimeType = "image/jpeg";
    const dataUrlMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
    if (dataUrlMatch) {
      mimeType = dataUrlMatch[1];
    }
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    if (!base64Data || base64Data.length < 100) {
      return new Response(
        JSON.stringify({ error: "Invalid or too small image data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are a fashion product recognition AI. Analyze the image and identify the fashion item(s) shown. Return a JSON response with:
- detected_item: { type, color, style, material (if identifiable), brand (if visible or "Unknown") }
- similar_products: array of 4 items, each with { name (search-friendly), price (INR number), originalPrice (INR number), platform (Amazon/Myntra/Flipkart/Ajio/Meesho/Nykaa), similarity (0-100), searchQuery (optimized search query) }

IMPORTANT: Return ONLY valid JSON, no markdown, no code blocks, just the raw JSON object.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_GEMINI_API_KEY}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{
          role: "user",
          parts: [
            { text: "Analyze this fashion image and identify similar products I can buy online." },
            { inlineData: { mimeType, data: base64Data } },
          ],
        }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse JSON from content (strip markdown code blocks if present)
    const jsonStr = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const result = JSON.parse(jsonStr);

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-image error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
