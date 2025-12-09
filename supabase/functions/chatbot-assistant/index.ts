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
    const { messages, email, orderCode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY no configurada');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar informacion del pedido
    let orderInfo = "";
    if (orderCode) {
      // Buscar en pedidos_online
      const { data: pedidoOnline } = await supabase
        .from('pedidos_online')
        .select('*, empresas_envio(nombre)')
        .eq('codigo_pedido', orderCode)
        .single();

      if (pedidoOnline) {
        orderInfo = `
PEDIDO ${orderCode}:
- Estado: ${pedidoOnline.estado}
- Total: $${pedidoOnline.total}
- Direccion: ${pedidoOnline.direccion_envio}
${pedidoOnline.tracking_envio ? `- Tracking: ${pedidoOnline.tracking_envio}` : ''}
${pedidoOnline.empresas_envio ? `- Enviado por: ${pedidoOnline.empresas_envio.nombre}` : ''}`;
      } else {
        // Buscar en pedidos_registro
        const { data: pedidoReg } = await supabase
          .from('pedidos_registro')
          .select('*')
          .eq('codigo_pedido', orderCode)
          .single();

        if (pedidoReg) {
          orderInfo = `
PEDIDO ${orderCode}:
- Cliente: ${pedidoReg.nombre_cliente}
- Estado: ${pedidoReg.estado_pedido}
- Credito: RD$${pedidoReg.credito || 0}`;
        }
      }
    }

    const systemPrompt = `Eres el asistente de BRILLARTE. Responde de forma corta y directa.

INFORMACION:
- Productos: Pulseras, aretes, monederos artesanales
- Ubicacion: Santiago, Republica Dominicana
- Email: brillarte.oficial.ventas@gmail.com
- WhatsApp: 849-425-2220
- Horarios: Lun-Vie 9AM-6PM

REGLAS:
- Respuestas cortas (maximo 2-3 lineas)
- NO usar emojis ni asteriscos
- Si no sabes algo, diles que contacten al equipo
- Se amable pero conciso
- NO des reembolsos, solo informa que un agente revisara

Cliente: ${email}${orderInfo}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 200
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ response: assistantMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in chatbot-assistant:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Error desconocido',
        response: 'Disculpa, tengo problemas tecnicos. Contactanos por WhatsApp al 849-425-2220.' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});