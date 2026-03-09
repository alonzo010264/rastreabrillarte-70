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
    const personalities: Record<string, string> = {
      'Alonzo': 'Eres Alonzo, agente amigable y profesional.',
      'Luis': 'Eres Luis, agente directo y eficiente.',
      'Miguel': 'Eres Miguel, agente alegre.',
      'Laura': 'Eres Laura, agente empatica.',
      'Mr': 'Eres Mr, agente formal.',
      'Sara': 'Eres Sara, agente paciente.'
    };

    const systemPrompt = `${personalities[agentName as keyof typeof personalities] || 'Eres un agente de BRILLARTE.'}

Trabajas en BRILLARTE atendiendo clientes por chat.

INFO:
- Productos: Pulseras, aretes, monederos
- Santiago, RD | WhatsApp: 849-425-2220 | Lun-Vie 9AM-6PM

Cliente: ${email}${orderInfo}

REGLAS ESTRICTAS:
- Maximo 2 oraciones por respuesta
- NUNCA uses emojis, asteriscos ni simbolos decorativos
- Habla natural pero breve
- Si no sabes algo, se honesto`;

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
        max_tokens: 100
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
        response: 'Disculpa, tuve un problema tecnico. Podrias intentar de nuevo?' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
