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
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY no configurada');
    }

    const { to, agenteName = 'Luis' } = await req.json();

    const agenteEmail = `${agenteName.toLowerCase()}@oficial.brillarte.lat`;
    const agenteImagen = agenteName === 'Luis' ? 'https://www.brillarte.lat/assets/agente-luis.png' : '';

    const previewHtml = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:#000000;padding:20px;text-align:center;">
        <img src="https://www.brillarte.lat/assets/brillarte-logo-modern-br.jpg" alt="BRILLARTE" style="height:50px;border-radius:8px;" />
      </div>
      <div style="padding:28px 24px;">
        <div style="background:#f9fafb;border-radius:8px;padding:14px;margin:0 0 20px;border-left:3px solid #000;">
          <p style="color:#666;font-size:11px;margin:0 0 4px;">Tu consulta:</p>
          <p style="color:#555;font-size:13px;margin:0;font-style:italic;">"Hola, quiero saber sobre los tiempos de entrega y si hacen envios a todo el pais."</p>
        </div>
        <p style="color:#333;font-size:14px;line-height:1.8;margin:0 0 24px;white-space:pre-line;">Hola, gracias por contactarnos.

Claro que si, hacemos envios a todo el pais. Los tiempos de entrega son de 1-3 dias habiles para productos en stock y de 5-7 dias para pedidos personalizados.

Si tienes alguna otra pregunta, estoy aqui para ayudarte.

Saludos,
${agenteName}</p>
        
        ${agenteImagen ? `
        <!-- Firma del Agente con Imagen -->
        <div style="margin-top:24px;border-top:1px solid #e5e7eb;padding-top:24px;">
          <img src="${agenteImagen}" alt="${agenteName} - Agente BRILLARTE" style="max-width:100%;height:auto;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.08);" />
        </div>
        ` : `
        <!-- Firma del Agente sin Imagen -->
        <div style="margin-top:24px;border-top:1px solid #e5e7eb;padding-top:20px;">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="vertical-align:middle;padding-right:12px;">
                <div style="width:48px;height:48px;border-radius:50%;background:#1a365d;color:#fff;text-align:center;line-height:48px;font-weight:bold;font-size:18px;">${agenteName.charAt(0)}</div>
              </td>
              <td style="vertical-align:middle;">
                <p style="margin:0;font-weight:600;font-size:15px;color:#1a365d;font-style:italic;">${agenteName}</p>
                <p style="margin:2px 0 0;font-size:12px;color:#666;">Agente de Atencion al Cliente</p>
                <p style="margin:2px 0 0;font-size:11px;color:#888;">Equipo de Soporte - BRILLARTE</p>
              </td>
            </tr>
          </table>
        </div>
        `}
      </div>
      <div style="background:#f3f4f6;padding:14px;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="color:#9ca3af;font-size:11px;margin:0;">BRILLARTE | Santiago de los Caballeros</p>
        <p style="color:#9ca3af;font-size:11px;margin:4px 0 0;">Instagram: @brillarte.do | www.brillarte.lat</p>
      </div>
    </div>`;

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${agenteName} - BRILLARTE <${agenteEmail}>`,
        to: [to],
        subject: `[Vista Previa] Re: Tu consulta - ${agenteName} de BRILLARTE`,
        html: previewHtml,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error('Error enviando preview:', errText);
      throw new Error('Error enviando correo de vista previa');
    }

    return new Response(
      JSON.stringify({ success: true, message: `Vista previa enviada a ${to}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error en send-agent-preview:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
