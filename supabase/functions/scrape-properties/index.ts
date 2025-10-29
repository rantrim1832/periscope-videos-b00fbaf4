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

// Helper function to normalize building address (remove unit numbers)
function normalizeAddress(address: string): string {
  // Remove common unit identifiers
  return address
    .replace(/,?\s*(apt|apartment|unit|#|ste|suite)\s*[0-9a-z-]+/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let logId: string | null = null;

  try {
    const { city, state, limit = 500, minUnits = 50 } = await req.json();

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

    // Create initial log entry
    const { data: logEntry } = await supabase
      .from('scrape_logs')
      .insert({
        city,
        state,
        status: 'in_progress',
      })
      .select()
      .single();
    
    logId = logEntry?.id || null;

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
    console.log(`Found ${properties.length} raw properties`);

    // Filter for properties that are part of buildings with 50+ units
    // RentCast returns individual units, but each has features.unitCount indicating building size
    const qualifiedUnits = properties.filter(property => {
      const unitCount = property.features?.unitCount || 0;
      return unitCount >= minUnits;
    });

    console.log(`Found ${qualifiedUnits.length} units in buildings with ${minUnits}+ total units`);

    // Aggregate by building address to group all units from the same building
    const buildingMap = new Map<string, { units: PropertyData[], unitCount: number }>();
    
    for (const property of qualifiedUnits) {
      const baseAddress = normalizeAddress(property.formattedAddress || property.address);
      const key = `${baseAddress}|${property.city}|${property.state}`;
      
      if (!buildingMap.has(key)) {
        buildingMap.set(key, { 
          units: [], 
          unitCount: property.features?.unitCount || 0 
        });
      }
      
      const building = buildingMap.get(key)!;
      building.units.push(property);
    }

    console.log(`Aggregated into ${buildingMap.size} buildings with ${minUnits}+ units`);

    const qualifiedBuildings = Array.from(buildingMap.entries());

    console.log(`Found ${qualifiedBuildings.length} buildings with ${minUnits}+ units`);

    let inserted = 0;
    let skipped = 0;
    const errors = [];

    // Insert buildings into database
    for (const [key, building] of qualifiedBuildings) {
      try {
        // Use the first unit as representative data for the building
        const representative = building.units[0];
        const baseAddress = normalizeAddress(representative.formattedAddress || representative.address);
        
        // Check if building already exists
        const { data: existing } = await supabase
          .from('properties')
          .select('id')
          .eq('address', baseAddress)
          .eq('city', representative.city)
          .eq('state', representative.state)
          .maybeSingle();

        if (existing) {
          skipped++;
          continue;
        }

        // Calculate average values from all units we captured for this building
        const capturedUnitCount = building.units.length;
        const avgBeds = Math.round(
          building.units.reduce((sum, u) => sum + (u.bedrooms || 0), 0) / capturedUnitCount
        );
        const avgBaths = 
          building.units.reduce((sum, u) => sum + (u.bathrooms || 0), 0) / capturedUnitCount;
        const avgSqft = Math.round(
          building.units.reduce((sum, u) => sum + (u.squareFootage || 0), 0) / capturedUnitCount
        );
        const avgRent = 
          building.units.reduce((sum, u) => sum + (u.lastSalePrice || 0), 0) / capturedUnitCount;

        // Create a proper building name from addressLine1 or fallback to base address
        const buildingName = representative.addressLine1 
          ? `${representative.addressLine1}, ${representative.city}, ${representative.state} ${representative.zipCode || ''}`
          : baseAddress;

        // Insert new building property
        const { error } = await supabase
          .from('properties')
          .insert({
            rentcast_id: representative.id,
            name: buildingName,
            address: baseAddress,
            address_line1: representative.addressLine1 || null,
            address_line2: representative.addressLine2 || null,
            city: representative.city,
            state: representative.state,
            zip_code: representative.zipCode || null,
            county: representative.county || null,
            county_fips: representative.countyFips || null,
            state_fips: representative.stateFips || null,
            property_type: 'Apartment Building',
            beds: avgBeds || null,
            baths: avgBaths || null,
            square_footage: avgSqft || null,
            lot_size: representative.lotSize || null,
            year_built: representative.yearBuilt || null,
            assessor_id: representative.assessorID || null,
            legal_description: representative.legalDescription || null,
            subdivision: representative.subdivision || null,
            zoning: representative.zoning || null,
            last_sale_date: representative.lastSaleDate || null,
            last_sale_price: representative.lastSalePrice || null,
            rent: avgRent || null,
            latitude: representative.latitude || null,
            longitude: representative.longitude || null,
            hoa_fee: representative.hoa?.fee || null,
            management_company: representative.managementCompany || null,
            amenities: representative.amenities || null,
            features: representative.features || null,
            tax_assessments: representative.taxAssessments || null,
            property_taxes: representative.propertyTaxes || null,
            history: representative.history || null,
            owner: representative.owner || null,
            units_count: building.unitCount, // Use the actual unitCount from RentCast features
            status: 'approved',
            is_verified: false,
            verification_required: false,
            rentcast_data: { units: building.units, aggregated: true },
          });

        if (error) {
          console.error('Error inserting building:', error);
          errors.push({ address: baseAddress, error: error.message });
        } else {
          inserted++;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Error processing building:', err);
        errors.push({ address: building.units[0]?.address || 'unknown', error: errorMessage });
      }
    }

    console.log(`Scraping complete: ${inserted} buildings inserted, ${skipped} skipped, ${errors.length} errors`);

    // Update log entry with results
    const duration = Date.now() - startTime;
    if (logId) {
      await supabase
        .from('scrape_logs')
        .update({
          total_properties: properties.length,
          inserted_count: inserted,
          skipped_count: skipped,
          error_count: errors.length,
          errors: errors,
          status: 'success',
          completed_at: new Date().toISOString(),
          duration_ms: duration,
        })
        .eq('id', logId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalUnits: properties.length,
        totalBuildings: buildingMap.size,
        qualifiedBuildings: qualifiedBuildings.length,
        inserted,
        skipped,
        minUnits,
        errors: errors.slice(0, 10), // Only return first 10 errors
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in scrape-properties function:', error);
    
    // Update log entry with error
    const duration = Date.now() - startTime;
    if (logId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase
        .from('scrape_logs')
        .update({
          status: 'failed',
          errors: [{ error: errorMessage }],
          error_count: 1,
          completed_at: new Date().toISOString(),
          duration_ms: duration,
        })
        .eq('id', logId);
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});