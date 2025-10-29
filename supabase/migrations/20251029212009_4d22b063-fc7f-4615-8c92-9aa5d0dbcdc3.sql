-- Add units_count to track number of units in a building
ALTER TABLE properties ADD COLUMN IF NOT EXISTS units_count integer DEFAULT 1;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_properties_address_city_state ON properties(address, city, state);

COMMENT ON COLUMN properties.units_count IS 'Number of units in the building/property';