-- Allow service role to update transactions (for Telegram approval webhook)
-- The service_role key already bypasses RLS, but we need UPDATE policy for regular authenticated use too

-- We also need to enable realtime on transactions for live status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;