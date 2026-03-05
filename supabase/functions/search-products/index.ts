import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SERPAPI_KEY = Deno.env.get('SERPAPI_KEY') || Deno.env.get('SERPAPI_API_KEY');
    if (!SERPAPI_KEY) {
      throw new Error('SERPAPI_KEY is not configured');
    }

    const { query } = await req.json();
    if (!query || typeof query !== 'string') {
      throw new Error('A search query string is required');
    }

    // Search Google Shopping for the product
    const searchUrl = new URL('https://serpapi.com/search.json');
    searchUrl.searchParams.set('engine', 'google_shopping');
    searchUrl.searchParams.set('q', query);
    searchUrl.searchParams.set('gl', 'in'); // India
    searchUrl.searchParams.set('hl', 'en');
    searchUrl.searchParams.set('num', '20');
    searchUrl.searchParams.set('api_key', SERPAPI_KEY);

    const response = await fetch(searchUrl.toString());
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SerpAPI request failed [${response.status}]: ${errorText}`);
    }

    const data = await response.json();
    const shoppingResults = data.shopping_results || [];

    // Group results by product name similarity and extract platform info
    const platformKeywords: Record<string, string[]> = {
      'Amazon': ['amazon.in', 'amazon.com'],
      'Flipkart': ['flipkart.com'],
      'Myntra': ['myntra.com'],
      'Ajio': ['ajio.com'],
      'Meesho': ['meesho.com'],
      'Nykaa': ['nykaa.com', 'nykaafashion.com'],
      'Snapdeal': ['snapdeal.com'],
      'Tata CLiQ': ['tatacliq.com'],
    };

    const getPlatform = (source: string, link: string): string => {
      const combined = `${source} ${link}`.toLowerCase();
      for (const [platform, keywords] of Object.entries(platformKeywords)) {
        if (keywords.some(kw => combined.includes(kw))) {
          return platform;
        }
      }
      return source || 'Other';
    };

    const products = shoppingResults.map((item: any, index: number) => {
      const price = item.extracted_price || item.price ? parseFloat(String(item.extracted_price || item.price).replace(/[^0-9.]/g, '')) : 0;
      const originalPrice = item.extracted_old_price || item.old_price 
        ? parseFloat(String(item.extracted_old_price || item.old_price).replace(/[^0-9.]/g, '')) 
        : Math.round(price * 1.3);
      
      return {
        id: index + 1,
        name: item.title || 'Unknown Product',
        image: item.thumbnail || '',
        platform: getPlatform(item.source || '', item.link || ''),
        price: price,
        originalPrice: originalPrice,
        rating: item.rating || 0,
        reviews: item.reviews || 0,
        link: item.link || '#',
        source: item.source || '',
      };
    }).filter((p: any) => p.price > 0);

    // Group by similar product names for comparison
    const groupedProducts: Record<string, any> = {};
    
    for (const product of products) {
      // Simple grouping: use first 4 words of product name as key
      const nameKey = product.name.split(' ').slice(0, 4).join(' ').toLowerCase();
      
      if (!groupedProducts[nameKey]) {
        groupedProducts[nameKey] = {
          id: Object.keys(groupedProducts).length + 1,
          name: product.name,
          image: product.image,
          prices: [],
        };
      }
      
      groupedProducts[nameKey].prices.push({
        platform: product.platform,
        price: product.price,
        originalPrice: product.originalPrice,
        rating: product.rating,
        reviews: product.reviews,
        link: product.link,
        source: product.source,
      });
    }

    const grouped = Object.values(groupedProducts).slice(0, 10);

    return new Response(JSON.stringify({ products: grouped }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in search-products:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
