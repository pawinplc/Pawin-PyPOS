-- ============================================
-- PyPOS: Create sale_items table if missing
-- Run this in your Supabase SQL Editor
-- ============================================

-- Check if sale_items table exists, if not create it
CREATE TABLE IF NOT EXISTS public.sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(12, 2) NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints
ALTER TABLE public.sale_items 
ADD CONSTRAINT fk_sale_items_sale 
FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;

ALTER TABLE public.sale_items 
ADD CONSTRAINT fk_sale_items_item 
FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE RESTRICT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_item_id ON public.sale_items(item_id);

-- Verify tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
