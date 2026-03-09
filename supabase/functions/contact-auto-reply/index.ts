import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AGENTES = [
  { nombre: 'Luis', email: 'luis@oficial.brillarte.lat' },
  { nombre: 'Katta', email: 'katta@oficial.brillarte.lat' },
  { nombre: 'Amanda', email: 'amanda@oficial.brillarte.lat' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nombre, correo, mensaje } = await req.json();

    if (!correo || !mensaje) {
      throw new Error('Correo y mensaje son requeridos');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY no configurada');
    }

    // Asignar agente aleatorio
    const agente = AGENTES[Math.floor(Math.random() * AGENTES.length)];

    // Guardar en BD con estado pendiente_agente
    const { error: dbError } = await supabase
      .from('Contactos')
      .insert([{
        nombre_cliente: nombre || 'Cliente',
        correo: correo,
        descripcion_problema: mensaje,
        estado: 'pendiente_agente',
        agente_asignado: agente.nombre,
        agente_email: agente.email,
      }]);

    if (dbError) {
      console.error('Error guardando contacto:', dbError);
      throw new Error('Error guardando contacto');
    }

    // Enviar correo inmediato de "gracias por contactar"
    const thankYouHtml = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:#000000;padding:20px;text-align:center;">
        <img src="https://www.brillarte.lat/assets/brillarte-logo-modern-br.jpg" alt="BRILLARTE" style="height:50px;border-radius:8px;" />
      </div>
      <div style="padding:28px 24px;">
        <h2 style="color:#111;font-size:18px;margin:0 0 12px;">Hola ${nombre || 'Cliente'} 👋</h2>
        <p style="color:#444;font-size:14px;line-height:1.6;margin:0 0 16px;">
          Gracias por contactar a <strong>BRILLARTE</strong>. Hemos recibido tu consulta y en breve te pondremos con uno de nuestros agentes.
        </p>
        <div style="background:#f9fafb;border-radius:8px;padding:14px;margin:16px 0;border-left:3px solid #000;">
          <p style="color:#666;font-size:12px;margin:0 0 4px;">Tu consulta:</p>
          <p style="color:#333;font-size:13px;margin:0;font-style:italic;">"${mensaje.substring(0, 200)}${mensaje.length > 200 ? '...' : ''}"</p>
        </div>
        <p style="color:#888;font-size:12px;margin:16px 0 0;">
          Un agente de nuestro equipo te responderá pronto a este mismo correo.
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
      console.error('Error enviando thank you email:', errText);
    }

    // Notificar al CEO de la nueva consulta
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
          subject: `Nueva consulta de ${nombre || correo} - Agente: ${agente.nombre}`,
          html: `
          <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;">
            <h3 style="color:#000;">Nueva consulta recibida</h3>
            <p><strong>Cliente:</strong> ${nombre || 'Sin nombre'}</p>
            <p><strong>Correo:</strong> ${correo}</p>
            <p><strong>Agente asignado:</strong> ${agente.nombre} (${agente.email})</p>
            <p><strong>Consulta:</strong></p>
            <blockquote style="border-left:3px solid #000;padding-left:12px;color:#555;">${mensaje}</blockquote>
            <p style="color:#888;font-size:12px;">El agente IA responderá automáticamente en ~5 minutos.</p>
          </div>`,
        }),
      });
    } catch (ceoErr) {
      console.error('Error notificando CEO:', ceoErr);
    }

    return new Response(
      JSON.stringify({ success: true, agente: agente.nombre }),
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
