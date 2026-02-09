import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

async function sendTelegram(chatId: string | number, text: string, replyMarkup?: object) {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
  };
  if (replyMarkup) body.reply_markup = JSON.stringify(replyMarkup);

  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function editTelegram(chatId: string | number, messageId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, text, parse_mode: 'HTML' }),
  });
}

async function answerCallback(callbackId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackId, text }),
  });
}

function ok() {
  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const supabase = getSupabase();

    // --- Handle callback queries (approve/decline) ---
    if (body.callback_query) {
      const data = body.callback_query.data;
      const msgId = body.callback_query.message.message_id;
      const chatId = body.callback_query.message.chat.id;
      const cbId = body.callback_query.id;

      const parts = data.split('_');
      const action = parts[0];
      const idOrUser = parts[1];

      let tx;

      // Try fetching by transaction ID first (new format)
      const { data: txById } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', idOrUser)
        .maybeSingle();

      if (txById) {
        tx = txById;
      } else {
        // Fallback: Try legacy format (userId_amount)
        const amount = parseFloat(parts[2]);
        if (amount && !isNaN(amount)) {
          const { data: txLegacy } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', idOrUser)
            .eq('type', 'deposit')
            .eq('status', 'pending')
            .eq('amount', amount)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          tx = txLegacy;
        }
      }

      if (!tx) {
        await answerCallback(cbId, '❌ Transaction not found or already processed');
        return ok();
      }

      if (action === 'approve') {
        await supabase.from('transactions').update({ status: 'success' }).eq('id', tx.id);

        const { data: profile } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', tx.user_id)
          .maybeSingle();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ balance: Number(profile.balance) + Number(tx.amount) })
            .eq('id', tx.user_id);
        }

        await editTelegram(chatId, msgId, `✅ <b>Transaction Approved</b>\n\n💵 Amount: ₦${Number(tx.amount).toLocaleString()}\n🆔 User: ${tx.user_id}`);
        await answerCallback(cbId, '✅ Transaction approved!');

      } else if (action === 'decline') {
        await supabase.from('transactions').update({ status: 'failed' }).eq('id', tx.id);

        await editTelegram(chatId, msgId, `❌ <b>Transaction Declined</b>\n\n💵 Amount: ₦${Number(tx.amount).toLocaleString()}\n🆔 User: ${tx.user_id}`);
        await answerCallback(cbId, '❌ Transaction declined');
      }

      return ok();
    }

    // --- Handle text commands ---
    if (body.message?.text) {
      const chatId = body.message.chat.id;
      const text = body.message.text.trim();

      // /start or /help
      if (text === '/start' || text === '/help') {
        await sendTelegram(chatId,
          `🤖 <b>PayGig Admin Bot</b>\n\n` +
          `📋 <b>Commands:</b>\n\n` +
          `/transactions - All recent transactions\n` +
          `/transactions pending - Pending only\n` +
          `/transactions success - Successful only\n` +
          `/transactions failed - Failed only\n\n` +
          `/logins - Recent user logins\n` +
          `/registers - Recent registrations\n\n` +
          `/setbank Bank|AccNo|AccName - Update bank details\n` +
          `/stats - Overview statistics`
        );
        return ok();
      }

      // /transactions [filter]
      if (text.startsWith('/transactions')) {
        const filter = text.split(' ')[1]?.toLowerCase();
        let query = supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(10);

        if (filter && ['pending', 'success', 'failed'].includes(filter)) {
          query = query.eq('status', filter);
        }

        const { data: txs } = await query;

        if (!txs || txs.length === 0) {
          await sendTelegram(chatId, `📭 No ${filter || ''} transactions found.`);
          return ok();
        }

        let msg = `📊 <b>Recent Transactions${filter ? ` (${filter})` : ''}</b>\n\n`;
        for (const tx of txs) {
          const icon = tx.type === 'deposit' ? '💰' : '🛒';
          const statusIcon = tx.status === 'success' ? '✅' : tx.status === 'pending' ? '⏳' : '❌';
          const date = new Date(tx.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          msg += `${icon} ${statusIcon} ₦${Number(tx.amount).toLocaleString()} - ${tx.description || tx.type}\n📅 ${date}\n\n`;
        }

        await sendTelegram(chatId, msg);
        return ok();
      }

      // /logins
      if (text === '/logins') {
        const { data: logs } = await supabase
          .from('activity_logs')
          .select('*')
          .eq('type', 'login')
          .order('created_at', { ascending: false })
          .limit(10);

        if (!logs || logs.length === 0) {
          await sendTelegram(chatId, '📭 No recent logins found.');
          return ok();
        }

        let msg = '🔐 <b>Recent Logins</b>\n\n';
        for (const log of logs) {
          const date = new Date(log.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          msg += `📧 ${log.user_email}\n📅 ${date}\n\n`;
        }

        await sendTelegram(chatId, msg);
        return ok();
      }

      // /registers
      if (text === '/registers') {
        const { data: logs } = await supabase
          .from('activity_logs')
          .select('*')
          .eq('type', 'signup')
          .order('created_at', { ascending: false })
          .limit(10);

        if (!logs || logs.length === 0) {
          await sendTelegram(chatId, '📭 No recent registrations found.');
          return ok();
        }

        let msg = '📝 <b>Recent Registrations</b>\n\n';
        for (const log of logs) {
          const date = new Date(log.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          msg += `📧 ${log.user_email}\n${log.details || ''}\n📅 ${date}\n\n`;
        }

        await sendTelegram(chatId, msg);
        return ok();
      }

      // /setbank Bank|AccNo|AccName
      if (text.startsWith('/setbank')) {
        const bankStr = text.replace('/setbank', '').trim();
        const parts = bankStr.split('|').map((p: string) => p.trim());

        if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
          await sendTelegram(chatId,
            '⚠️ <b>Invalid format</b>\n\n' +
            'Use: <code>/setbank Bank Name|Account Number|Account Name</code>\n\n' +
            'Example:\n<code>/setbank GTBank|0123456789|John Doe</code>'
          );
          return ok();
        }

        const bankDetails = { bank: parts[0], acc: parts[1], name: parts[2] };

        await supabase
          .from('app_settings')
          .upsert({ key: 'bank_details', value: JSON.stringify(bankDetails) });

        await sendTelegram(chatId,
          `✅ <b>Bank Details Updated!</b>\n\n` +
          `🏦 Bank: ${bankDetails.bank}\n` +
          `🔢 Account: ${bankDetails.acc}\n` +
          `👤 Name: ${bankDetails.name}\n\n` +
          `💡 Changes are live immediately on the app.`
        );
        return ok();
      }

      // /stats
      if (text === '/stats') {
        const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: pendingTxs } = await supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        const { count: totalTxs } = await supabase.from('transactions').select('*', { count: 'exact', head: true });
        const { data: successDeposits } = await supabase.from('transactions').select('amount').eq('type', 'deposit').eq('status', 'success');
        const totalDeposits = successDeposits?.reduce((sum: number, d: { amount: number }) => sum + Number(d.amount), 0) || 0;
        const { data: purchases } = await supabase.from('transactions').select('amount').eq('type', 'purchase').eq('status', 'success');
        const totalPurchases = purchases?.reduce((sum: number, d: { amount: number }) => sum + Number(d.amount), 0) || 0;

        await sendTelegram(chatId,
          `📊 <b>PayGig Statistics</b>\n\n` +
          `👥 Total Users: ${totalUsers || 0}\n` +
          `📦 Total Transactions: ${totalTxs || 0}\n` +
          `⏳ Pending Deposits: ${pendingTxs || 0}\n` +
          `💰 Total Deposits: ₦${totalDeposits.toLocaleString()}\n` +
          `🛒 Total Purchases: ₦${totalPurchases.toLocaleString()}`
        );
        return ok();
      }

      // Unknown command
      if (text.startsWith('/')) {
        await sendTelegram(chatId, '❓ Unknown command. Type /help to see available commands.');
      }

      return ok();
    }

    return ok();
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
