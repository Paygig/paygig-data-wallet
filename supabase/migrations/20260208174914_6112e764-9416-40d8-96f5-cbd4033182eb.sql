
-- Update handle_new_user to support referral code from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _referrer_id UUID;
  _ref_code TEXT;
BEGIN
  _ref_code := NEW.raw_user_meta_data->>'referral_code';
  
  IF _ref_code IS NOT NULL AND _ref_code != '' THEN
    SELECT id INTO _referrer_id FROM public.profiles WHERE referral_code = _ref_code;
  END IF;

  INSERT INTO public.profiles (id, email, phone, referred_by)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'phone', _referrer_id);
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
