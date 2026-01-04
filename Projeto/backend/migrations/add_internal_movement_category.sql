-- Migration: Add internal movement category
-- This allows tracking money movements between pockets of the same parent account

-- Create category for internal movements
INSERT INTO categories (id, user_id, name, type, icon, color, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    id,
    'MOVIMENTAÇÃO INTERNA',
    'ambas',
    'arrow-left-right',
    '#6366f1',
    NOW(),
    NOW()
FROM users
WHERE NOT EXISTS (
    SELECT 1 FROM categories 
    WHERE name = 'MOVIMENTAÇÃO INTERNA' AND user_id = users.id
);

-- Add comment
COMMENT ON TABLE categories IS 'Categories include MOVIMENTAÇÃO INTERNA for pocket-to-pocket transfers';
