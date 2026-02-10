

## Fix Build Errors

All three edge functions have the same TypeScript error: `'error' is of type 'unknown'`. The fix is to cast `error` properly in each catch block.

### Changes

**1. `supabase/functions/setup-telegram-webhook/index.ts` (line 37)**
- Change `error.message` to `(error as Error).message`

**2. `supabase/functions/telegram-notify/index.ts` (line 99)**
- Change `error.message` to `(error as Error).message`

**3. `supabase/functions/telegram-webhook/index.ts` (line 298)**
- Change `error.message` to `(error as Error).message`

These are one-line fixes in each file. Once deployed, the build will pass and you can proceed with end-to-end testing of all the features.

