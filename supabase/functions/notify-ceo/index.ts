// Sends a notification email to anotasy@gmail.com (CEO) for any agent/AI action.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CEO_EMAIL = "anotasy@gmail.com";
const FROM = "BRILLARTE Sistema <sistema@oficial.brillarte.lat>";

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { evento, detalle, agente, cliente_email, codigo_pedido, extra } = await req.json();
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY missing');

    const subject = `[BRILLARTE] ${evento}${codigo_pedido ? ` · ${codigo_pedido}` : ''}`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#fff;color:#000">
        <h2 style="margin:0 0 16px;font-family:Georgia,serif;border-bottom:1px solid #000;padding-bottom:8px">BRILLARTE · ${evento}</h2>
        ${agente ? `<p><strong>Agente:</strong> ${agente}</p>` : ''}
        ${cliente_email ? `<p><strong>Cliente:</strong> ${cliente_email}</p>` : ''}
        ${codigo_pedido ? `<p><strong>Pedido:</strong> ${codigo_pedido}</p>` : ''}
        <div style="background:#f5f5f5;padding:12px;border-left:3px solid #000;margin:16px 0;white-space:pre-wrap">${detalle || ''}</div>
        ${extra ? `<pre style="background:#fafafa;padding:8px;font-size:11px;overflow:auto">${JSON.stringify(extra, null, 2)}</pre>` : ''}
        <p style="margin-top:24px;font-size:11px;color:#666">${new Date().toLocaleString('es-DO')} · Notificación automática</p>
      </div>`;

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [CEO_EMAIL], subject, html }),
    });
    const data = await r.json();
    if (!r.ok) console.error('Resend error', data);

    return new Response(JSON.stringify({ ok: r.ok }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
