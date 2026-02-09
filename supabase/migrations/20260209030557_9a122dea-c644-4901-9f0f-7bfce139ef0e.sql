
-- Add bonus_balance column for new user signup bonus
ALTER TABLE public.profiles ADD COLUMN bonus_balance numeric NOT NULL DEFAULT 0;

-- Create activity_logs table for admin bot commands
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  user_email TEXT,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on activity_logs (only service role can access)
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Update handle_new_user to give ₦2000 signup bonus
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _referrer_id UUID;
  _ref_code TEXT;
BEGIN
  _ref_code := NEW.raw_user_meta_data->>'referral_code';
  
  IF _ref_code IS NOT NULL AND _ref_code != '' THEN
    SELECT id INTO _referrer_id FROM public.profiles WHERE referral_code = _ref_code;
  END IF;

  INSERT INTO public.profiles (id, email, phone, referred_by, bonus_balance)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'phone', _referrer_id, 2000);
  RETURN NEW;
END;
$function$;

-- Enable realtime on app_settings for live bank detail updates from bot
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;
