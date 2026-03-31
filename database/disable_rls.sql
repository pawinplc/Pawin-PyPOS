-- ============================================
-- PyPOS: Disable Row Level Security
-- Run this in your Supabase SQL Editor
-- ============================================

-- Disable RLS for all tables
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_items DISABLE ROW LEVEL SECURITY;

-- Grant permissions to all roles
GRANT ALL ON public.users TO authenticated, anon, service_role;
GRANT ALL ON public.categories TO authenticated, anon, service_role;
GRANT ALL ON public.items TO authenticated, anon, service_role;
GRANT ALL ON public.stock_movements TO authenticated, anon, service_role;
GRANT ALL ON public.sales TO authenticated, anon, service_role;
GRANT ALL ON public.sales_items TO authenticated, anon, service_role;

-- Verify RLS is disabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
