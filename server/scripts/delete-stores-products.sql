-- Soft delete all stores (which will cascade to products due to foreign key relationships)
UPDATE stores 
SET deleted_at = CURRENT_TIMESTAMP 
WHERE deleted_at IS NULL;

-- Soft delete any remaining products (in case they're not caught by the cascade)
UPDATE products 
SET deleted_at = CURRENT_TIMESTAMP 
WHERE deleted_at IS NULL;

-- Show confirmation of deleted stores
SELECT COUNT(*) as deleted_stores_count 
FROM stores 
WHERE deleted_at IS NOT NULL;

-- Show confirmation of deleted products
SELECT COUNT(*) as deleted_products_count 
FROM products 
WHERE deleted_at IS NOT NULL;