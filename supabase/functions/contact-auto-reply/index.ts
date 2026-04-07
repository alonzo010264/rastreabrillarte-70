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
    const { nombre, correo, mensaje } = await req.json();

    if (!correo || !mensaje) {
      throw new Error('Correo y mensaje son requeridos');
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY no configurada');
    }

    // Enviar correo de confirmación automático al cliente
    const thankYouHtml = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:#000000;padding:20px;text-align:center;">
        <img src="https://www.brillarte.lat/assets/brillarte-logo-modern-br.jpg" alt="BRILLARTE" style="height:50px;border-radius:8px;" />
      </div>
      <div style="padding:28px 24px;">
        <h2 style="color:#111;font-size:18px;margin:0 0 12px;">Hola ${nombre || 'Cliente'},</h2>
        <p style="color:#444;font-size:14px;line-height:1.6;margin:0 0 16px;">
          Gracias por contactar a <strong>BRILLARTE</strong>. Hemos recibido tu consulta y nos pondremos en contacto contigo pronto.
        </p>
        <div style="background:#f9fafb;border-radius:8px;padding:14px;margin:16px 0;border-left:3px solid #000;">
          <p style="color:#666;font-size:12px;margin:0 0 4px;">Tu consulta:</p>
          <p style="color:#333;font-size:13px;margin:0;font-style:italic;">"${mensaje.substring(0, 200)}${mensaje.length > 200 ? '...' : ''}"</p>
        </div>
        <p style="color:#444;font-size:14px;line-height:1.6;margin:16px 0 0;">
          Nuestro equipo revisará tu mensaje y te responderá lo antes posible a este mismo correo.
        </p>
        <p style="color:#888;font-size:12px;margin:16px 0 0;">
          Gracias por tu confianza.
        </p>
      </div>
      <div style="background:#f3f4f6;padding:14px;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="color:#9ca3af;font-size:11px;margin:0;">BRILLARTE | Santiago de los Caballeros</p>
        <p style="color:#9ca3af;font-size:11px;margin:4px 0 0;">Instagram: @brillarte.do | www.brillarte.lat</p>
      </div>
    </div>`;

    const thankYouRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'BRILLARTE <brillarte@oficial.brillarte.lat>',
        to: [correo],
        subject: 'Recibimos tu consulta - BRILLARTE',
        html: thankYouHtml,
      }),
    });

    if (!thankYouRes.ok) {
      const errText = await thankYouRes.text();
      console.error('Error enviando correo:', errText);
    }

    // Notificar al CEO
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'BRILLARTE Sistema <brillarte@oficial.brillarte.lat>',
          to: ['anotasy@gmail.com'],
          subject: `Nueva consulta de ${nombre || correo}`,
          html: `
          <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;">
            <h3 style="color:#000;">Nueva consulta recibida</h3>
            <p><strong>Cliente:</strong> ${nombre || 'Sin nombre'}</p>
            <p><strong>Correo:</strong> ${correo}</p>
            <p><strong>Consulta:</strong></p>
            <blockquote style="border-left:3px solid #000;padding-left:12px;color:#555;">${mensaje}</blockquote>
            <p style="color:#888;font-size:12px;">Notificación automática del sistema BRILLARTE</p>
          </div>`,
        }),
      });
    } catch (ceoErr) {
      console.error('Error notificando CEO:', ceoErr);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error en contact-auto-reply:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
