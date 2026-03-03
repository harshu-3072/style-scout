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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Strip data URL prefix if present and detect mime type
    let mimeType = "image/jpeg";
    const dataUrlMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
    if (dataUrlMatch) {
      mimeType = dataUrlMatch[1];
    }
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    // Validate base64 data isn't empty or too short
    if (!base64Data || base64Data.length < 100) {
      return new Response(
        JSON.stringify({ error: "Invalid or too small image data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const makeRequest = async (model: string) => {
      return await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: `You are a fashion product recognition AI. Analyze the image and identify the fashion item(s) shown. Return a JSON response using the tool provided. Include:
- The type of clothing/accessory (e.g., blazer, sneakers, sunglasses)
- Color and pattern details
- Style category (casual, formal, sporty, etc.)
- Material if identifiable
- Brand if visible
- Generate 4 search-friendly product names that someone would use to find similar items on e-commerce sites like Amazon, Myntra, Flipkart
- For each suggestion, estimate a realistic Indian market price range (in INR)
- Assign a similarity percentage (how close the suggestion matches the original)`
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analyze this fashion image and identify similar products I can buy online."
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${base64Data}`
                  }
                }
              ]
            }
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_products",
                description: "Return identified fashion products similar to the uploaded image",
                parameters: {
                  type: "object",
                  properties: {
                    detected_item: {
                      type: "object",
                      properties: {
                        type: { type: "string", description: "Type of item e.g. blazer, sneakers" },
                        color: { type: "string" },
                        style: { type: "string" },
                        material: { type: "string" },
                        brand: { type: "string", description: "Brand if visible, otherwise 'Unknown'" }
                      },
                      required: ["type", "color", "style"]
                    },
                    similar_products: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string", description: "Search-friendly product name" },
                          price: { type: "number", description: "Estimated price in INR" },
                          originalPrice: { type: "number", description: "Estimated MRP in INR" },
                          platform: { type: "string", enum: ["Amazon", "Myntra", "Flipkart", "Ajio", "Meesho", "Nykaa"] },
                          similarity: { type: "number", description: "Similarity percentage 0-100" },
                          searchQuery: { type: "string", description: "Optimized search query for the platform" }
                        },
                        required: ["name", "price", "originalPrice", "platform", "similarity", "searchQuery"]
                      }
                    }
                  },
                  required: ["detected_item", "similar_products"]
                }
              }
            }
          ],
          tool_choice: { type: "function", function: { name: "return_products" } }
        }),
      });
    };

    // Try primary model, fallback to another on 400 errors
    let response = await makeRequest("google/gemini-2.5-flash");
    
    if (response.status === 400) {
      console.log("Primary model failed with 400, trying fallback model...");
      response = await makeRequest("openai/gpt-5-mini");
    }

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      // Try parsing from content as fallback
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        try {
          const parsed = JSON.parse(content);
          return new Response(JSON.stringify({ success: true, ...parsed }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch {
          throw new Error("No structured response from AI");
        }
      }
      throw new Error("No structured response from AI");
    }

    const result = JSON.parse(toolCall.function.arguments);

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
