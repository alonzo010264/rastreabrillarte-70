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
    const { messages, email, orderCode, agentName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY no configurada');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar información del pedido
    let orderInfo = "";
    if (orderCode) {
      const { data: order } = await supabase
        .from('pedidos_registro')
        .select('*')
        .eq('codigo_pedido', orderCode)
        .single();

      if (order) {
        orderInfo = `\n\nInfo del pedido ${orderCode}:
- Cliente: ${order.nombre_cliente}
- Estado: ${order.estado_pedido}
- Fecha: ${order.fecha_registro}
- Crédito: RD$${order.credito || 0}`;
      }
    }

    // Personalidad según el agente
    const personalities = {
      'Alonzo': 'Eres Alonzo, un agente amigable y profesional. Hablas de forma cálida y cercana.',
      'Luis': 'Eres Luis, un agente directo y eficiente. Vas al grano pero siempre amable.',
      'Miguel': 'Eres Miguel, un agente alegre y entusiasta. Te gusta hacer sentir bien a los clientes.',
      'Laura': 'Eres Laura, una agente empática y comprensiva. Escuchas con atención.',
      'Mr': 'Eres Mr, un agente formal pero amigable. Profesional con toque humano.',
      'Sara': 'Eres Sara, una agente dulce y paciente. Siempre dispuesta a ayudar.'
    };

    const systemPrompt = `${personalities[agentName] || personalities['Alonzo']}

Trabajas en BRILLARTE atendiendo clientes por chat.

INFO RÁPIDA:
- Productos: Pulseras, aretes, monederos y accesorios
- Ubicación: Santiago, RD
- Email: brillarte.oficial.ventas@gmail.com
- WhatsApp: 849-425-2220
- Horario: Lun-Vie 9AM-6PM, Sáb 10AM-4PM

BRILLARTE PEDIDOS:
- Compras desde TEMU
- Sin costo adicional en 1ra compra
- Gestión aduanal incluida
- Entrega 24-48h
- Almacenamiento Miami

Cliente: ${email}${orderInfo}

IMPORTANTE:
- Habla como persona real, natural y conversacional
- Usa expresiones casuales: "claro!", "perfecto", "déjame ver"
- Emojis ocasionales está bien 😊
- Respuestas cortas (2-3 líneas máximo)
- Si no sabes algo, sé honesto
- Ofrece ayuda adicional al final`;

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
        temperature: 0.8,
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
    console.error('Error in agent-chat:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Error desconocido',
        response: 'Disculpa, tuve un problema técnico. ¿Podrías intentar de nuevo? 😅' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
