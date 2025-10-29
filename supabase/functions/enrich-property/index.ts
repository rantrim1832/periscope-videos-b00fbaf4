import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.77.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address, city, state } = await req.json();
    console.log('Enriching property:', { address, city, state });

    const RENTCAST_API_KEY = Deno.env.get('RENTCAST_API_KEY');
    if (!RENTCAST_API_KEY) {
      throw new Error('RENTCAST_API_KEY not configured');
    }

    // Call RentCast API to get property data
    const rentcastUrl = `https://api.rentcast.io/v1/properties?address=${encodeURIComponent(address)}&city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`;
    
    const response = await fetch(rentcastUrl, {
      headers: {
        'X-Api-Key': RENTCAST_API_KEY,
        'accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('RentCast API error:', response.status, await response.text());
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch property data from RentCast' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    const rentcastData = await response.json();
    console.log('RentCast response:', rentcastData);

    // Extract relevant data
    const enrichedData = {
      beds: rentcastData[0]?.bedrooms || null,
      baths: rentcastData[0]?.bathrooms || null,
      rent: rentcastData[0]?.rent || null,
      latitude: rentcastData[0]?.latitude || null,
      longitude: rentcastData[0]?.longitude || null,
      rentcast_data: rentcastData[0] || {}
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: enrichedData 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error enriching property:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
