import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientEmail, clientName, messages, agentName, conversationId } = await req.json();

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');

    // Format messages into readable report
    const formattedMessages = messages.map((msg: any) => {
      const time = new Date(msg.created_at).toLocaleString('es-MX');
      const sender = msg.sender_name || 'Usuario';
      const content = msg.tipo === 'image' ? '[Imagen]' : msg.tipo === 'file' ? `[Archivo: ${msg.metadata?.file_name || 'adjunto'}]` : msg.content;
      return `<tr><td style="padding:4px 8px;border-bottom:1px solid #eee;color:#666;font-size:12px;white-space:nowrap">${time}</td><td style="padding:4px 8px;border-bottom:1px solid #eee;font-weight:600;font-size:13px">${sender}</td><td style="padding:4px 8px;border-bottom:1px solid #eee;font-size:13px">${content}</td></tr>`;
    }).join('');

    const emailHtml = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="background:#000;padding:20px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:20px">BRILLARTE</h1>
        <p style="color:#ccc;margin:4px 0 0;font-size:12px">Reporte de Conversacion</p>
      </div>
      <div style="padding:20px">
        <p>Hola <strong>${clientName || 'Cliente'}</strong>,</p>
        <p>Aqui tienes el reporte de tu conversacion con nuestro equipo:</p>
        <p style="font-size:13px;color:#666">Atendido por: <strong>${agentName}</strong></p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <thead><tr style="background:#f9fafb"><th style="padding:6px 8px;text-align:left;font-size:12px">Hora</th><th style="padding:6px 8px;text-align:left;font-size:12px">De</th><th style="padding:6px 8px;text-align:left;font-size:12px">Mensaje</th></tr></thead>
          <tbody>${formattedMessages}</tbody>
        </table>
        <p style="font-size:13px;color:#666">Si necesitas ayuda adicional, no dudes en contactarnos nuevamente.</p>
        <p style="margin-top:20px;font-size:12px;color:#999">Equipo BRILLARTE</p>
      </div>
    </div>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'BRILLARTE Soporte <soporte@oficial.brillarte.lat>',
        to: [clientEmail],
        subject: `Reporte de conversacion - BRILLARTE`,
        html: emailHtml
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Resend error: ${errText}`);
    }

    // Also send copy to CEO
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'BRILLARTE Sistema <sistema@oficial.brillarte.lat>',
        to: ['anotasy@gmail.com'],
        subject: `[Reporte] Conversacion finalizada con ${clientName || clientEmail}`,
        html: emailHtml
      })
    });

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
