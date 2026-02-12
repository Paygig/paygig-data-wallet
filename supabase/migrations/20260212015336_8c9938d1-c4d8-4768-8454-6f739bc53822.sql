
-- 1. Create data_plans table with authoritative prices
CREATE TABLE public.data_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  data TEXT NOT NULL,
  price NUMERIC NOT NULL,
  badge TEXT,
  validity TEXT NOT NULL,
  bonus_eligible BOOLEAN DEFAULT false
);

ALTER TABLE public.data_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read data plans" ON public.data_plans
FOR SELECT USING (true);

-- Seed the plans
INSERT INTO public.data_plans (id, name, data, price, badge, validity, bonus_eligible) VALUES
  ('sme-starter', 'SME Starter', '50GB', 7500, 'Try Me', '30 Days', false),
  ('streamer', 'Streamer', '100GB', 14900, NULL, '30 Days', false),
  ('professional', 'Professional', '200GB', 24900, NULL, '6 Months', true),
  ('office-hub', 'Office Hub', '400GB', 34500, '🔥 Most Popular', '6 Months', true),
  ('mega-tera', 'Mega Tera', '1TB', 64500, 'Best Value', '6 Months', true);

-- 2. Create secure purchase function (SECURITY DEFINER so it can update balances)
CREATE OR REPLACE FUNCTION public.purchase_plan(
  _plan_id TEXT,
  _user_id UUID
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _plan RECORD;
  _profile RECORD;
  _bonus_to_use NUMERIC;
  _balance_to_deduct NUMERIC;
  _coupon TEXT;
  _tx_id UUID;
BEGIN
  -- Validate plan exists and get authoritative price
  SELECT * INTO _plan FROM public.data_plans WHERE id = _plan_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid plan');
  END IF;

  -- Validate user and get current balances
  SELECT * INTO _profile FROM public.profiles WHERE id = _user_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Ensure authenticated user matches
  IF auth.uid() IS NULL OR auth.uid() != _user_id THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Calculate amounts server-side
  IF _plan.bonus_eligible THEN
    _bonus_to_use := LEAST(_profile.bonus_balance, _plan.price);
  ELSE
    _bonus_to_use := 0;
  END IF;
  _balance_to_deduct := _plan.price - _bonus_to_use;

  -- Check sufficient balance
  IF _profile.balance < _balance_to_deduct THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Generate coupon code
  _coupon := LPAD(FLOOR(random() * 1000000000)::TEXT, 9, '0') || 'S';

  -- Deduct balance atomically
  UPDATE public.profiles
  SET balance = balance - _balance_to_deduct,
      bonus_balance = bonus_balance - _bonus_to_use
  WHERE id = _user_id;

  -- Create transaction record
  INSERT INTO public.transactions (user_id, type, amount, status, coupon_code, description)
  VALUES (_user_id, 'purchase', _plan.price, 'success', _coupon, _plan.name || ' (' || _plan.data || ') - ' || _plan.validity)
  RETURNING id INTO _tx_id;

  RETURN json_build_object(
    'success', true,
    'coupon_code', _coupon,
    'transaction_id', _tx_id,
    'amount', _plan.price,
    'bonus_used', _bonus_to_use
  );
END;
$$;

-- 3. Restrict profiles UPDATE policy - users can only update phone
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  balance = (SELECT balance FROM public.profiles WHERE id = auth.uid()) AND
  bonus_balance = (SELECT bonus_balance FROM public.profiles WHERE id = auth.uid()) AND
  referred_by = (SELECT referred_by FROM public.profiles WHERE id = auth.uid()) AND
  referral_code = (SELECT referral_code FROM public.profiles WHERE id = auth.uid())
);
