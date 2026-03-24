-- Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  stripe_customer_id text,
  stripe_payment_method text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read profiles by email"
  ON public.profiles
  FOR SELECT
  TO anon
  USING (true);

-- Products table
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  type text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read active products"
  ON public.products
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Entitlements table
CREATE TABLE public.entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'active',
  starts_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  source text,
  meta jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read entitlements"
  ON public.entitlements
  FOR SELECT
  TO anon
  USING (true);

-- Seed the oracle-ai product
INSERT INTO public.products (slug, name, description, type, is_active)
VALUES ('oracle-ai', 'Oracle AI', 'Premium AI copilot for the platform', 'subscription', true);
