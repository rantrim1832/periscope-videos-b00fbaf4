import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cities, state } = await req.json();

    if (!state || !cities || cities.length === 0) {
      return new Response(
        JSON.stringify({ error: 'State and cities array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const RENTCAST_API_KEY = Deno.env.get('RENTCAST_API_KEY');
    if (!RENTCAST_API_KEY) {
      throw new Error('RENTCAST_API_KEY not configured');
    }

    const estimates = [];

    for (const city of cities) {
      try {
        const url = new URL('https://api.rentcast.io/v1/properties');
        url.searchParams.append('city', city);
        url.searchParams.append('state', state);
        url.searchParams.append('propertyType', 'Apartment');
        url.searchParams.append('limit', '1');
        url.searchParams.append('includeTotalCount', 'true');

        const response = await fetch(url.toString(), {
          headers: {
            'Accept': 'application/json',
            'X-Api-Key': RENTCAST_API_KEY,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const totalCount = parseInt(response.headers.get('X-Total-Count') || '0');
          
          estimates.push({
            city,
            totalUnits: totalCount,
            estimatedBuildings: Math.round(totalCount / 50), // Rough estimate
          });
        } else {
          estimates.push({
            city,
            totalUnits: 0,
            estimatedBuildings: 0,
            error: 'Failed to fetch estimate'
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        estimates.push({
          city,
          totalUnits: 0,
          estimatedBuildings: 0,
          error: errorMessage
        });
      }
    }

    return new Response(
      JSON.stringify({ estimates }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in estimate-scrape function:', error);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
