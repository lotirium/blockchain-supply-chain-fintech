-- Remove hologram_label column from stores table
ALTER TABLE stores DROP COLUMN IF EXISTS hologram_label;

-- Add comment explaining the change
COMMENT ON TABLE stores IS 'Store table - hologram_label removed as holograms are now product-specific';