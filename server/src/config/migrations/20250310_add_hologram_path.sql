-- Add hologram_path column to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS hologram_path VARCHAR(255);

-- Add comment to hologram_path column
COMMENT ON COLUMN products.hologram_path IS 'Path to the UV-sensitive hologram image with embedded NFT token ID';

-- Add comment to hologram_data column
COMMENT ON COLUMN products.hologram_data IS 'Additional metadata for the UV hologram including verification data';

-- Create index on hologram_path for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_hologram_path ON products(hologram_path);