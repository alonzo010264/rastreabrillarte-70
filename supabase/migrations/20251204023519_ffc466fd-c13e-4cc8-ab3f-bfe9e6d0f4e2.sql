-- Add unique constraint to prevent duplicate cart items
ALTER TABLE carrito 
ADD CONSTRAINT carrito_unique_item 
UNIQUE (user_id, producto_id, color, talla);