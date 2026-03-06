import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, messageContent, senderUserId } = await req.json();

    console.log('AI Chat Responder invoked:', { conversationId, messageContent, senderUserId });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obtener el user_id de la cuenta oficial BRILLARTE
    const { data: officialProfile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('correo', 'oficial@brillarte.lat')
      .single();

    if (profileError || !officialProfile) {
      console.log('Cuenta oficial no encontrada');
      return new Response(JSON.stringify({ error: 'Cuenta oficial no encontrada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const officialUserId = officialProfile.user_id;

    // Verificar que la conversación incluye a la cuenta oficial
    const { data: participants } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId);

    const participantIds = participants?.map(p => p.user_id) || [];
    
    if (!participantIds.includes(officialUserId)) {
      console.log('Esta conversación no incluye a la cuenta oficial');
      return new Response(JSON.stringify({ message: 'No es conversación con cuenta oficial' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // No responder si el mensaje es de la cuenta oficial
    if (senderUserId === officialUserId) {
      console.log('Mensaje enviado por cuenta oficial, ignorando');
      return new Response(JSON.stringify({ message: 'Mensaje de cuenta oficial ignorado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Obtener información del usuario que envió el mensaje
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('nombre_completo')
      .eq('user_id', senderUserId)
      .single();

    const senderName = senderProfile?.nombre_completo || 'Cliente';

    // Detectar si es una solicitud de reembolso
    const refundKeywords = ['reembolso', 'devolucion', 'devolución', 'devolver dinero', 'refund', 'mi dinero', 'quiero mi dinero'];
    const isRefundRequest = refundKeywords.some(keyword => 
      messageContent.toLowerCase().includes(keyword)
    );

    let aiResponse: string;

    if (isRefundRequest) {
      aiResponse = `Hola ${senderName},\n\nEntiendo que necesitas ayuda con un reembolso. Para poder atenderte de la mejor manera con este tipo de solicitudes, te pedimos que nos contactes directamente a traves de nuestro Instagram oficial: @brillarte.do.oficial\n\nAlli nuestro equipo podra revisar tu caso de manera personalizada y brindarte una solucion.\n\nGracias por tu comprension.`;
    } else if (lovableApiKey) {
      // Usar IA para generar respuesta
      const systemPrompt = `Eres el asistente virtual de BRILLARTE, una tienda de accesorios hechos a mano (aretes, pulseras, flores de crochet). 

Directrices:
- Se amable, calida y profesional
- NO uses emojis bajo ninguna circunstancia
- Si preguntan sobre productos, menciona que pueden ver el catálogo en la sección de Productos
- Si preguntan sobre pedidos, pueden rastrearlos en la sección "Rastrear Pedidos"
- Si preguntan sobre precios o disponibilidad, invítalos a revisar la tienda online
- Si es una consulta de reembolso o devolución, SIEMPRE direcciona a Instagram @brillarte.do.oficial
- Mantén respuestas concisas (máximo 3 párrafos)
- El nombre del cliente es: ${senderName}

Información útil:
- Los productos son hechos a mano con mucho amor
- Ofrecemos envíos a toda República Dominicana
- Las promociones se publican en la sección de Promociones
- Para soporte técnico pueden crear un ticket de ayuda`;

      try {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: messageContent }
            ],
            max_tokens: 500,
          }),
        });

        if (!response.ok) {
          throw new Error(`AI API error: ${response.status}`);
        }

        const data = await response.json();
        aiResponse = data.choices?.[0]?.message?.content || `Hola ${senderName}, gracias por escribirnos. En que podemos ayudarte?`;
      } catch (aiError) {
        console.error('Error calling AI:', aiError);
        aiResponse = `Hola ${senderName}, gracias por escribirnos a BRILLARTE. En que podemos ayudarte hoy? Puedes preguntarnos sobre nuestros productos, pedidos o cualquier duda que tengas.`;
      }
    } else {
      // Respuesta predeterminada si no hay API key
      aiResponse = `Hola ${senderName}, gracias por escribirnos a BRILLARTE. En que podemos ayudarte hoy? Si tienes preguntas sobre productos, pedidos o cualquier otra cosa, estamos aqui para ti.`;
    }

    // Agregar pequeño delay para simular escritura humana
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Enviar respuesta como la cuenta oficial
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: officialUserId,
        content: aiResponse,
        tipo: 'text'
      });

    if (messageError) {
      console.error('Error sending AI response:', messageError);
      throw messageError;
    }

    // Actualizar timestamp de la conversación
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    console.log('AI response sent successfully');

    return new Response(JSON.stringify({ success: true, response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-ai-responder:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});