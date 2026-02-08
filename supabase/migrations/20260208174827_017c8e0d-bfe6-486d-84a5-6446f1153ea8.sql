
-- Add referral columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN referral_code TEXT UNIQUE DEFAULT 'PG' || UPPER(SUBSTRING(md5(random()::text) FROM 1 FOR 6)),
ADD COLUMN referred_by UUID REFERENCES public.profiles(id);

-- Create function to generate referral code on insert
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL OR NEW.referral_code = 'PG' || UPPER(SUBSTRING(md5(random()::text) FROM 1 FOR 6)) THEN
    NEW.referral_code := 'PG' || UPPER(SUBSTRING(md5(random()::text || NEW.id::text) FROM 1 FOR 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_referral_code
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.generate_referral_code();

-- Create function to credit referrer when someone signs up with their code
CREATE OR REPLACE FUNCTION public.credit_referrer()
RETURNS TRIGGER AS $$
DECLARE
  referral_bonus NUMERIC := 500;
BEGIN
  IF NEW.referred_by IS NOT NULL THEN
    UPDATE public.profiles 
    SET balance = balance + referral_bonus 
    WHERE id = NEW.referred_by;
    
    INSERT INTO public.transactions (user_id, type, amount, status, description)
    VALUES (NEW.referred_by, 'deposit', referral_bonus, 'success', 'Referral bonus - ' || NEW.email || ' joined');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER credit_referrer_on_signup
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.credit_referrer();

-- Security definer function to look up referral code (bypasses RLS)
CREATE OR REPLACE FUNCTION public.lookup_referral_code(_code TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE referral_code = _code LIMIT 1;
$$;
