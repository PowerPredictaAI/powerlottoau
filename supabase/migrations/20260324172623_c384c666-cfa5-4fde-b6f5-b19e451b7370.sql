
CREATE TABLE public.lottery_draws (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lottery_name text NOT NULL,
  draw_number integer NOT NULL,
  draw_date date NOT NULL,
  main_numbers integer[] NOT NULL,
  bonus_numbers integer[] DEFAULT '{}',
  total_winners text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_lottery_draws_name ON public.lottery_draws(lottery_name);
CREATE INDEX idx_lottery_draws_date ON public.lottery_draws(draw_date);
CREATE UNIQUE INDEX idx_lottery_draws_unique ON public.lottery_draws(lottery_name, draw_number);

ALTER TABLE public.lottery_draws ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read lottery draws"
ON public.lottery_draws
FOR SELECT
TO anon, authenticated
USING (true);
