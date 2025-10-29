import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PropertyData {
  id: string;
  address: string;
  city: string;
  state: string;
  addressLine1?: string;
  addressLine2?: string;
  zipCode?: string;
  county?: string;
  countyFips?: string;
  stateFips?: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  lotSize?: number;
  yearBuilt?: number;
  assessorID?: string;
  legalDescription?: string;
  subdivision?: string;
  zoning?: string;
  lastSaleDate?: string;
  lastSalePrice?: number;
  formattedAddress?: string;
  latitude?: number;
  longitude?: number;
  managementCompany?: string;
  amenities?: string[];
  hoa?: {
    fee?: number;
  };
  features?: any;
  taxAssessments?: any;
  propertyTaxes?: any;
  history?: any;
  owner?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { city, state, limit = 500 } = await req.json();

    if (!state) {
      return new Response(
        JSON.stringify({ error: 'State is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const RENTCAST_API_KEY = Deno.env.get('RENTCAST_API_KEY');
    if (!RENTCAST_API_KEY) {
      throw new Error('RENTCAST_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const locationStr = city ? `${city}, ${state}` : state;
    console.log(`Fetching properties for ${locationStr}...`);

    // Fetch properties from RentCast
    const url = new URL('https://api.rentcast.io/v1/properties');
    if (city) {
      url.searchParams.append('city', city);
    }
    url.searchParams.append('state', state);
    url.searchParams.append('propertyType', 'Apartment'); // Only multifamily apartments
    url.searchParams.append('limit', limit.toString());

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'X-Api-Key': RENTCAST_API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('RentCast API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch from RentCast', details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const properties: PropertyData[] = await response.json();
    console.log(`Found ${properties.length} properties`);

    let inserted = 0;
    let skipped = 0;
    const errors = [];

    // Insert properties into database
    for (const property of properties) {
      try {
        const address = property.formattedAddress || property.address;
        
        // Check if property already exists
        const { data: existing } = await supabase
          .from('properties')
          .select('id')
          .eq('address', address)
          .eq('city', property.city)
          .eq('state', property.state)
          .single();

        if (existing) {
          skipped++;
          continue;
        }

        // Insert new property
        const { error } = await supabase
          .from('properties')
          .insert({
            rentcast_id: property.id,
            name: `${address}`,
            address: address,
            address_line1: property.addressLine1 || null,
            address_line2: property.addressLine2 || null,
            city: property.city,
            state: property.state,
            zip_code: property.zipCode || null,
            county: property.county || null,
            county_fips: property.countyFips || null,
            state_fips: property.stateFips || null,
            property_type: property.propertyType || null,
            beds: property.bedrooms || null,
            baths: property.bathrooms || null,
            square_footage: property.squareFootage || null,
            lot_size: property.lotSize || null,
            year_built: property.yearBuilt || null,
            assessor_id: property.assessorID || null,
            legal_description: property.legalDescription || null,
            subdivision: property.subdivision || null,
            zoning: property.zoning || null,
            last_sale_date: property.lastSaleDate || null,
            last_sale_price: property.lastSalePrice || null,
            rent: property.lastSalePrice || null,
            latitude: property.latitude || null,
            longitude: property.longitude || null,
            hoa_fee: property.hoa?.fee || null,
            management_company: property.managementCompany || null,
            amenities: property.amenities || null,
            features: property.features || null,
            tax_assessments: property.taxAssessments || null,
            property_taxes: property.propertyTaxes || null,
            history: property.history || null,
            owner: property.owner || null,
            status: 'approved',
            is_verified: false,
            verification_required: false,
            rentcast_data: property,
          });

        if (error) {
          console.error('Error inserting property:', error);
          errors.push({ address, error: error.message });
        } else {
          inserted++;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Error processing property:', err);
        errors.push({ address: property.address, error: errorMessage });
      }
    }

    console.log(`Scraping complete: ${inserted} inserted, ${skipped} skipped, ${errors.length} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        total: properties.length,
        inserted,
        skipped,
        errors: errors.slice(0, 10), // Only return first 10 errors
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in scrape-properties function:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});