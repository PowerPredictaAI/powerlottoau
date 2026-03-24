
-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text,
  stripe_customer_id text,
  stripe_payment_method text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read profiles by email"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  type text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active products"
  ON public.products FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create entitlements table
CREATE TABLE IF NOT EXISTS public.entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  starts_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  source text,
  meta jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read entitlements"
  ON public.entitlements FOR SELECT
  TO anon, authenticated
  USING (true);

-- Seed products
INSERT INTO public.products (slug, name, description, type, is_active)
VALUES 
  ('oracle-ai', 'Oracle AI', 'Your personal AI copilot inside the platform', 'tool', true),
  ('smart-player-manual', 'Smart Player Manual', 'Premium ebook to help users avoid common mistakes', 'ebook', true)
ON CONFLICT (slug) DO NOTHING;

-- Seed the test profile and entitlement for powerai.help@gmail.com
INSERT INTO public.profiles (email, name)
VALUES ('powerai.help@gmail.com', 'Mateus')
ON CONFLICT (email) DO NOTHING;

-- Create entitlement for oracle-ai
INSERT INTO public.entitlements (user_id, product_id, status, expires_at)
SELECT p.id, pr.id, 'active', NULL
FROM public.profiles p, public.products pr
WHERE p.email = 'powerai.help@gmail.com' AND pr.slug = 'oracle-ai'
AND NOT EXISTS (
  SELECT 1 FROM public.entitlements e WHERE e.user_id = p.id AND e.product_id = pr.id
);
