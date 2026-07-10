import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { corsHeaders, requireAdmin, authErrorResponse } from "../_shared/auth.ts";

interface FieldMapping {
  [csvHeader: string]: string; // maps CSV header to database column
}

interface RequestBody {
  csvContent: string;
  fieldMapping: FieldMapping;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let adminUserId: string;
  try {
    adminUserId = await requireAdmin(req);
  } catch (err) {
    return authErrorResponse(err);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const user = { id: adminUserId };

    const { csvContent, fieldMapping }: RequestBody = await req.json();

    if (!csvContent || !fieldMapping) {
      throw new Error('Missing required fields: csvContent and fieldMapping');
    }

    console.log('Processing CSV import for user:', user.id);

    // Parse CSV
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    // Remove BOM if present and parse headers
    const headerLine = lines[0].replace(/^\uFEFF/, '');
    const headers = parseCSVLine(headerLine);

    const properties: any[] = [];
    const errors: string[] = [];
    let skipped = 0;

    // Process each data row
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i]);
        
        if (values.length === 0 || values.every(v => !v)) {
          skipped++;
          continue;
        }

        const property: any = {
          imported_by_user_id: user.id,
        };

        // Map CSV values to database columns
        headers.forEach((header, index) => {
          const dbColumn = fieldMapping[header];
          if (dbColumn && values[index]) {
            let value = values[index].trim();

            // Clean and convert values based on column type
            if (['units', 'stories', 'year_built', 'min_lease_term', 'total_rentable_sqft', 'avg_sqft'].includes(dbColumn)) {
              // Integer fields
              const parsed = parseInt(value.replace(/,/g, ''));
              if (!isNaN(parsed)) {
                property[dbColumn] = parsed;
              }
            } else if (['occupancy_percent', 'avg_rent', 'avg_eff_rent', 'avg_price_per_sqft', 'avg_eff_price_per_sqft'].includes(dbColumn)) {
              // Numeric fields - remove currency symbols and commas
              const cleaned = value.replace(/[$,\s]/g, '');
              const parsed = parseFloat(cleaned);
              if (!isNaN(parsed)) {
                property[dbColumn] = parsed;
              }
            } else {
              // Text fields
              property[dbColumn] = value;
            }
          }
        });

        // Validate required fields
        if (!property.name) {
          errors.push(`Row ${i + 1}: Missing required field 'name'`);
          skipped++;
          continue;
        }

        properties.push(property);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Row ${i + 1}: ${errorMessage}`);
        skipped++;
      }
    }

    console.log(`Parsed ${properties.length} properties, ${skipped} skipped, ${errors.length} errors`);

    // Insert properties in batches. Keep the raw import rows for audit/review,
    // but also mirror each building into `properties`, because property-video
    // linking uses `property_videos.property_id -> properties.id`.
    let inserted = 0;
    let linkableInserted = 0;
    let linkableSkipped = 0;
    const BATCH_SIZE = 100;

    for (let i = 0; i < properties.length; i += BATCH_SIZE) {
      const batch = properties.slice(i, i + BATCH_SIZE);
      
      const { data, error } = await supabase
        .from('imported_properties')
        .insert(batch)
        .select();

      if (error) {
        console.error('Insert error:', error);
        errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
      } else {
        inserted += data?.length || 0;
      }

      const linkableRows = batch.map(toLinkableProperty).filter(Boolean);
      for (const row of linkableRows) {
        const { data: existing, error: lookupError } = await supabase
          .from('properties')
          .select('id')
          .eq('address', row.address)
          .eq('city', row.city)
          .eq('state', row.state)
          .maybeSingle();

        if (lookupError) {
          console.error('Properties lookup error:', lookupError);
          errors.push(`Linkable property lookup failed for ${row.name}: ${lookupError.message}`);
          continue;
        }
        if (existing) {
          linkableSkipped++;
          continue;
        }

        const { error: propertyError } = await supabase.from('properties').insert(row);
        if (propertyError) {
          console.error('Properties mirror insert error:', propertyError);
          errors.push(`Linkable property insert failed for ${row.name}: ${propertyError.message}`);
        } else {
          linkableInserted++;
        }
      }
    }

    console.log(`Successfully inserted ${inserted} imported rows and ${linkableInserted} linkable properties`);

    return new Response(
      JSON.stringify({
        inserted,
        linkableInserted,
        linkableSkipped,
        skipped,
        errors,
        total: lines.length - 1,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error processing CSV:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Helper function to parse CSV line handling quoted fields with commas
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add the last field
  result.push(current);

  return result;
}

function toLinkableProperty(property: any): any | null {
  const name = cleanText(property.name);
  const address = cleanText(property.address);
  const city = cleanText(property.city);
  const state = cleanText(property.state)?.toUpperCase();

  if (!name || !address || !city || !state) return null;

  return {
    name,
    address,
    address_line1: address,
    city,
    state,
    zip_code: cleanText(property.zip_code),
    zip: cleanText(property.zip_code),
    management_company: cleanText(property.management_company),
    phone: cleanText(property.phone),
    units_count: typeof property.units === 'number' ? property.units : null,
    beds: parseNumber(property.beds),
    baths: parseNumber(property.baths),
    rent: typeof property.avg_rent === 'number' ? property.avg_rent : null,
    year_built: typeof property.year_built === 'number' ? property.year_built : null,
    website: cleanText(property.url),
    county: cleanText(property.county),
    property_type: cleanText(property.housing_type) ?? 'multifamily',
    status: 'approved',
    is_verified: false,
    verification_required: true,
    created_by_user_id: property.imported_by_user_id ?? null,
  };
}

function cleanText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const parsed = Number.parseFloat(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}
