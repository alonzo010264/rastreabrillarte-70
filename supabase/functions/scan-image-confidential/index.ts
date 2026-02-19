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
    const { imageUrl, senderUserId, conversationId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY no configurada');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Use AI to analyze the image
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Eres un sistema de seguridad que analiza imagenes para detectar informacion confidencial.
Debes verificar si la imagen contiene:
- Direcciones fisicas o de envio
- Numeros de telefono
- Correos electronicos
- Numeros de cedula o documentos de identidad
- Informacion bancaria (numeros de cuenta, tarjetas)
- Datos personales sensibles escritos en la imagen
- Capturas de pantalla con datos privados de clientes
- Cualquier otro dato que pueda comprometer la privacidad

Responde SOLO con un JSON valido:
{"safe": true/false, "reason": "explicacion breve si no es segura", "details": "detalles de lo detectado"}

Si la imagen es segura (no contiene datos confidenciales), responde: {"safe": true, "reason": "", "details": ""}
Si contiene datos confidenciales: {"safe": false, "reason": "motivo", "details": "que datos se detectaron"}`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analiza esta imagen y determina si contiene informacion confidencial:' },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 300
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      // If AI fails, allow the image (fail open) but log
      return new Response(
        JSON.stringify({ safe: true, reason: 'AI analysis unavailable', analyzed: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse AI response
    let result;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { safe: true, reason: '' };
    } catch {
      result = { safe: true, reason: 'Could not parse AI response' };
    }

    // If unsafe, create a report
    if (!result.safe) {
      // Get sender info
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('nombre_completo, correo')
        .eq('user_id', senderUserId)
        .single();

      // Insert report into verificaciones_envio as a security report
      await supabase
        .from('verificaciones_envio')
        .insert({
          agente_id: senderUserId,
          agente_nombre: senderProfile?.nombre_completo || senderProfile?.correo || 'Unknown',
          target_user_id: senderUserId,
          conversation_id: conversationId,
          tipo: 'reporte_seguridad',
          datos: {
            tipo_reporte: 'imagen_confidencial',
            imagen_url: imageUrl,
            razon: result.reason,
            detalles: result.details || '',
            fecha: new Date().toISOString()
          },
          estado: 'pendiente'
        });

      // Notify admins
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (adminRoles) {
        const notifications = adminRoles.map(admin => ({
          user_id: admin.user_id,
          tipo: 'seguridad',
          titulo: 'Intento de envio de informacion confidencial',
          mensaje: `${senderProfile?.nombre_completo || 'Un usuario'} intento enviar una imagen con informacion confidencial: ${result.reason}`,
          accion_url: '/verificacion'
        }));
        await supabase.from('notifications').insert(notifications);
      }
    }

    return new Response(
      JSON.stringify({ safe: result.safe, reason: result.reason || '', analyzed: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in scan-image-confidential:', error);
    return new Response(
      JSON.stringify({ safe: true, reason: 'Error in analysis', analyzed: false }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
