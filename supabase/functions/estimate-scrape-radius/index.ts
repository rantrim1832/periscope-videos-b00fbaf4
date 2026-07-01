import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, requireAdmin, authErrorResponse } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    await requireAdmin(req);
  } catch (err) {
    return authErrorResponse(err);
  }

  try {
    const { city, state, radius = 50 } = await req.json();

    if (!state || !city) {
      return new Response(
        JSON.stringify({ error: 'State and city are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const RENTCAST_API_KEY = Deno.env.get('RENTCAST_API_KEY');
    if (!RENTCAST_API_KEY) {
      throw new Error('RENTCAST_API_KEY not configured');
    }

    // First, get a property from the city to obtain coordinates
    console.log(`Getting coordinates for ${city}, ${state}`);
    const coordUrl = new URL('https://api.rentcast.io/v1/properties');
    coordUrl.searchParams.append('city', city);
    coordUrl.searchParams.append('state', state);
    coordUrl.searchParams.append('limit', '1');

    const coordResponse = await fetch(coordUrl.toString(), {
      headers: {
        'Accept': 'application/json',
        'X-Api-Key': RENTCAST_API_KEY,
      },
    });

    if (!coordResponse.ok) {
      const errorText = await coordResponse.text();
      console.error(`RentCast API error ${coordResponse.status}:`, errorText);
      throw new Error(`RentCast API error: ${coordResponse.status} - ${errorText}`);
    }

    const coordProperties = await coordResponse.json();
    if (!coordProperties || coordProperties.length === 0) {
      throw new Error(`No properties found in ${city}, ${state} to determine coordinates`);
    }

    const { latitude, longitude } = coordProperties[0];
    if (!latitude || !longitude) {
      throw new Error(`Could not determine coordinates for ${city}, ${state}`);
    }

    console.log(`Found coordinates: ${latitude}, ${longitude}`);
    
    // Now get properties within radius using the coordinates
    const url = new URL('https://api.rentcast.io/v1/properties');
    url.searchParams.append('latitude', latitude.toString());
    url.searchParams.append('longitude', longitude.toString());
    url.searchParams.append('radius', radius.toString());
    url.searchParams.append('limit', '500');

    console.log(`Fetching properties within ${radius} miles of coordinates`);
    console.log(`API URL: ${url.toString()}`);

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'X-Api-Key': RENTCAST_API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`RentCast API error ${response.status}:`, errorText);
      throw new Error(`RentCast API error: ${response.status} - ${errorText}`);
    }

    const properties = await response.json();
    
    // Extract unique cities and count units per city that have 50+ unit buildings
    const cityMap = new Map<string, { totalUnits: number, buildingUnits: Set<number> }>();
    
    for (const property of properties) {
      const cityName = property.city;
      const unitCount = property.features?.unitCount || 0;
      
      // Only count properties in buildings with 50+ units
      if (unitCount >= 50) {
        if (!cityMap.has(cityName)) {
          cityMap.set(cityName, { totalUnits: 0, buildingUnits: new Set() });
        }
        const cityData = cityMap.get(cityName)!;
        cityData.totalUnits++;
        cityData.buildingUnits.add(unitCount);
      }
    }

    // Convert to estimates array
    const estimates = Array.from(cityMap.entries()).map(([cityName, data]) => ({
      city: cityName,
      totalUnits: data.totalUnits,
      estimatedBuildings: data.buildingUnits.size,
    }));

    console.log(`Found ${estimates.length} cities with 50+ unit buildings within ${radius} miles`);

    return new Response(
      JSON.stringify({ estimates }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in estimate-scrape-radius function:', error);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
