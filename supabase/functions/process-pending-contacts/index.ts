import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AGENT_PERSONALITIES: Record<string, string> = {
  'Luis': 'Eres Luis, agente de soporte de BRILLARTE. Hablas de forma directa, amigable y profesional. Eres paciente y te gusta resolver problemas rapido.',
  'Katta': 'Eres Katta, agente de soporte de BRILLARTE. Eres calida, empatica y detallista. Te encanta ayudar a los clientes y haces que se sientan escuchados.',
  'Amanda': 'Eres Amanda, agente de soporte de BRILLARTE. Eres alegre, eficiente y muy organizada. Respondes con claridad y siempre ofreces soluciones concretas.',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!RESEND_API_KEY || !LOVABLE_API_KEY) {
      throw new Error('Faltan claves de API');
    }

    // Buscar contactos pendientes creados hace más de 5 minutos
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data: pendientes, error: fetchError } = await supabase
      .from('Contactos')
      .select('*')
      .eq('estado', 'pendiente_agente')
      .is('procesado_at', null)
      .lt('fecha_creacion', fiveMinAgo)
      .limit(10);

    if (fetchError) {
      console.error('Error buscando pendientes:', fetchError);
      throw fetchError;
    }

    if (!pendientes || pendientes.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No hay contactos pendientes', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processed = 0;

    for (const contacto of pendientes) {
      try {
        const agenteName = contacto.agente_asignado || 'Luis';
        const agenteEmail = contacto.agente_email || 'luis@oficial.brillarte.lat';
        const personality = AGENT_PERSONALITIES[agenteName] || AGENT_PERSONALITIES['Luis'];

        const systemPrompt = `${personality}

INFORMACION DE BRILLARTE (usa SOLO esta info para responder):
- Somos una tienda 100% VIRTUAL de accesorios artesanales (pulseras, aretes, monederos, flores de crochet, bouquets)
- Ubicacion general: Santiago de los Caballeros, Republica Dominicana
- NUNCA des direcciones fisicas exactas, NO tenemos tienda fisica
- Web OFICIAL y UNICA: https://www.brillarte.lat
- Instagram: @brillarte.do
- WhatsApp: 849-425-2220
- Horario: Lunes a Viernes 9AM-6PM, Sabados 10AM-4PM
- Envios a nivel nacional desde RD$200 (precio puede variar)
- Tiempo de entrega: 1-3 dias en stock, 5-7 dias personalizados
- Aceptamos pagos por transferencia
- Politica de devolucion: reportar en 48h, 7 dias para devolver
- Programa de referidos disponible en la web
- Blog con novedades en la web

REGLAS ESTRICTAS:
- Responde como humano, NUNCA reveles que eres IA
- NO uses emojis excesivos, maximo 1-2 por mensaje
- Escribe natural, como un dominicano profesional
- Si no sabes algo, di que consultaras con el equipo
- NUNCA compartas URLs que no sean https://www.brillarte.lat
- Maximo 3-4 oraciones
- Firma como "${agenteName}" al final`;

        // Generar respuesta con IA
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `El cliente ${contacto.nombre_cliente} pregunta: "${contacto.descripcion_problema}". Responde de forma util y humana.` }
            ],
            temperature: 0.8,
            max_tokens: 300,
          }),
        });

        if (!aiResponse.ok) {
          console.error('Error AI para contacto', contacto.id, await aiResponse.text());
          continue;
        }

        const aiData = await aiResponse.json();
        const respuesta = aiData.choices[0].message.content;

        // Enviar correo del agente
        const agentHtml = `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
          <div style="background:#000000;padding:20px;text-align:center;">
            <img src="https://www.brillarte.lat/assets/brillarte-logo-modern-br.jpg" alt="BRILLARTE" style="height:50px;border-radius:8px;" />
          </div>
          <div style="padding:28px 24px;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
              <div style="width:36px;height:36px;border-radius:50%;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;">${agenteName.charAt(0)}</div>
              <div>
                <p style="margin:0;font-weight:600;font-size:14px;color:#111;">${agenteName}</p>
                <p style="margin:0;font-size:11px;color:#888;">Agente de Soporte - BRILLARTE</p>
              </div>
            </div>
            <div style="background:#f9fafb;border-radius:8px;padding:14px;margin:0 0 16px;border-left:3px solid #000;">
              <p style="color:#666;font-size:11px;margin:0 0 4px;">Tu consulta:</p>
              <p style="color:#555;font-size:13px;margin:0;font-style:italic;">"${contacto.descripcion_problema.substring(0, 150)}${contacto.descripcion_problema.length > 150 ? '...' : ''}"</p>
            </div>
            <p style="color:#333;font-size:14px;line-height:1.7;margin:0;white-space:pre-line;">${respuesta}</p>
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
            to: [contacto.correo],
            subject: `Re: Tu consulta - ${agenteName} de BRILLARTE`,
            html: agentHtml,
          }),
        });

        if (!emailRes.ok) {
          console.error('Error enviando email agente:', await emailRes.text());
          continue;
        }

        // Actualizar contacto como procesado
        await supabase
          .from('Contactos')
          .update({
            estado: 'respondido',
            respuesta_agente: respuesta,
            procesado_at: new Date().toISOString(),
          })
          .eq('id', contacto.id);

        // Notificar al CEO con la respuesta del agente
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'BRILLARTE Monitor <brillarte@oficial.brillarte.lat>',
              to: ['anotasy@gmail.com'],
              subject: `Agente ${agenteName} respondió a ${contacto.nombre_cliente}`,
              html: `
              <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;">
                <h3>Respuesta enviada por agente IA</h3>
                <p><strong>Cliente:</strong> ${contacto.nombre_cliente} (${contacto.correo})</p>
                <p><strong>Agente:</strong> ${agenteName} (${agenteEmail})</p>
                <p><strong>Pregunta:</strong></p>
                <blockquote style="border-left:3px solid #ccc;padding-left:12px;color:#555;">${contacto.descripcion_problema}</blockquote>
                <p><strong>Respuesta del agente:</strong></p>
                <blockquote style="border-left:3px solid #000;padding-left:12px;color:#333;">${respuesta}</blockquote>
                <p style="color:#c00;font-size:12px;margin-top:16px;">Si la respuesta tiene errores, responde a este correo para corregir.</p>
              </div>`,
            }),
          });
        } catch (ceoErr) {
          console.error('Error notificando CEO respuesta:', ceoErr);
        }

        processed++;
      } catch (contactErr) {
        console.error('Error procesando contacto', contacto.id, contactErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error en process-pending-contacts:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
