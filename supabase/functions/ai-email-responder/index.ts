import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { emailContent, senderEmail, subject, action } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY no configurada');
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY no configurada');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch products for context
    let productContext = '';
    try {
      const { data: productos } = await supabase
        .from('productos')
        .select('nombre, descripcion, categoria, disponible, stock, colores')
        .eq('activo', true)
        .order('destacado', { ascending: false })
        .limit(20);
      if (productos && productos.length > 0) {
        productContext = '\nPRODUCTOS DISPONIBLES:\n' + productos.map((p, i) => 
          `${i+1}. ${p.nombre} - ${p.descripcion || 'Sin descripcion'} (${p.disponible ? 'Disponible' : 'No disponible'})`
        ).join('\n');
      }
    } catch (e) {
      console.error('Error fetching products:', e);
    }

    // Check if sender has orders
    let orderContext = '';
    if (senderEmail) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, nombre_completo, saldo')
        .eq('correo', senderEmail)
        .maybeSingle();
      
      if (profile) {
        orderContext += `\nCLIENTE: ${profile.nombre_completo || senderEmail}`;
        if (profile.saldo) orderContext += ` | Saldo: RD$${profile.saldo}`;
        
        const { data: pedidos } = await supabase
          .from('pedidos_online')
          .select('codigo_pedido, estado, total, created_at')
          .eq('user_id', profile.user_id)
          .order('created_at', { ascending: false })
          .limit(3);
        
        if (pedidos && pedidos.length > 0) {
          orderContext += '\nPEDIDOS RECIENTES:\n' + pedidos.map(p => 
            `- ${p.codigo_pedido}: ${p.estado} (RD$${p.total})`
          ).join('\n');
        }
      }
    }

    const systemPrompt = `Eres el equipo de BRILLARTE respondiendo correos electronicos profesionales. Tu respuesta sera enviada como correo electronico oficial.

IDENTIDAD:
- Representas a BRILLARTE, tienda VIRTUAL de accesorios artesanales
- Tono profesional pero calido, en español dominicano
- Firma siempre como "Equipo BRILLARTE"

SOBRE BRILLARTE:
- Vendemos pulseras artesanales, aretes, monederos y accesorios hechos a mano
- Somos una tienda 100% VIRTUAL, NO tenemos tienda fisica
- Ubicacion general: Santiago de los Caballeros (NO dar direccion exacta ni completa)
- WhatsApp: 849-425-2220
- Horario: Lunes a Viernes 9AM-6PM
- Instagram: @brillarte.do
- Correo: brillarte.oficial.ventas@gmail.com
- Web OFICIAL: https://www.brillarte.lat (UNICA URL que debes compartir)

REGLAS ESTRICTAS:
- NUNCA compartas direcciones fisicas completas (NO mencionar calles, barrios, numeros de casa)
- NUNCA compartas URLs que no sean https://www.brillarte.lat (NO brillarte.lovable.app ni otras)
- Solo di "Santiago de los Caballeros" como ubicacion general si preguntan
- Somos tienda VIRTUAL, todo se maneja online y por envio

POLITICAS CLAVE:
- Enviamos con VIMENPAQ y DOMEX
- Tiempo de envio: 1-3 dias habiles (stock), 5-7 dias (personalizados)
- Reclamaciones: dentro de 48 HORAS con factura obligatoria
- Productos personalizados NO tienen devolucion
- Reembolso: credito BRILLARTE (inmediato) o devolucion al metodo original (3-5 dias)

${productContext}
${orderContext}

REGLAS PARA EL CORREO:
- Responde de forma profesional y completa
- No uses emojis
- Incluye informacion relevante segun la consulta
- Si preguntan precio, indica que visiten https://www.brillarte.lat o WhatsApp
- Si es una queja, muestra empatia y ofrece solucion
- Si preguntan por pedidos, usa la info disponible
- Termina siempre invitando a contactar por WhatsApp si necesitan mas ayuda
- NO inventes informacion que no tengas
- Formatea el texto con parrafos claros (usa saltos de linea)`;

    // Generate AI response
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `CORREO RECIBIDO de ${senderEmail || 'cliente'}:\nAsunto: ${subject || 'Sin asunto'}\n\n${emailContent}\n\nGenera una respuesta profesional para este correo.` }
        ],
        max_tokens: 800,
        temperature: 0.7
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de solicitudes alcanzado. Intenta en unos segundos." }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const generatedResponse = aiData.choices[0].message.content;

    // If action is 'generate', just return the response without sending
    if (action === 'generate') {
      return new Response(
        JSON.stringify({ response: generatedResponse }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If action is 'send', send the email via Resend
    if (action === 'send' && senderEmail) {
      const logoUrl = 'https://www.brillarte.lat/assets/brillarte-logo-modern-br.jpg';
      
      const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr><td style="background-color:#000000;padding:24px;text-align:center;">
          <img src="${logoUrl}" alt="BRILLARTE" width="120" height="120" style="border-radius:50%;display:block;margin:0 auto;" />
          <h1 style="color:#ffffff;font-size:22px;margin:16px 0 0;font-weight:700;letter-spacing:1px;">BRILLARTE</h1>
          <p style="color:#cccccc;font-size:12px;margin:4px 0 0;">Accesorios Artesanales</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px 28px;">
          ${generatedResponse.split('\n').map((line: string) => {
            if (!line.trim()) return '<br/>';
            return `<p style="color:#333333;font-size:15px;line-height:1.7;margin:0 0 12px;">${line}</p>`;
          }).join('')}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background-color:#f3f4f6;padding:20px 28px;border-top:1px solid #e5e7eb;">
          <p style="color:#6b7280;font-size:12px;margin:0 0 6px;text-align:center;">BRILLARTE - Accesorios Artesanales</p>
          <p style="color:#9ca3af;font-size:11px;margin:0;text-align:center;">Santiago de los Caballeros | WhatsApp: 849-425-2220</p>
          <p style="color:#9ca3af;font-size:11px;margin:4px 0 0;text-align:center;">Instagram: @brillarte.do | www.brillarte.lat</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

      const replySubject = subject?.startsWith('Re:') ? subject : `Re: ${subject || 'BRILLARTE - Respuesta'}`;
      
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'BRILLARTE <brillarte@oficial.brillarte.lat>',
          to: [senderEmail],
          subject: replySubject,
          html: htmlContent,
        }),
      });

      if (!emailRes.ok) {
        const emailError = await emailRes.text();
        console.error('Resend error:', emailError);
        throw new Error(`Error enviando correo: ${emailRes.status}`);
      }

      // Log the email
      await supabase.from('email_logs').insert({
        destinatario: senderEmail,
        asunto: replySubject,
        contenido: generatedResponse,
        tipo: 'respuesta_ia',
        estado: 'enviado'
      });

      return new Response(
        JSON.stringify({ response: generatedResponse, sent: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ response: generatedResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-email-responder:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
