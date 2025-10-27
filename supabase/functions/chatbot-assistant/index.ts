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

    // Crear cliente de Supabase para consultar pedidos
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar información del pedido si se proporcionó código
    let orderInfo = "";
    if (orderCode) {
      const { data: order } = await supabase
        .from('pedidos_registro')
        .select('*')
        .eq('codigo_pedido', orderCode)
        .single();

      if (order) {
        orderInfo = `\n\nInformación del pedido ${orderCode}:
- Cliente: ${order.nombre_cliente}
- Estado actual: ${order.estado_pedido}
- Fecha de registro: ${order.fecha_registro}
- Crédito disponible: RD$${order.credito || 0}`;
      }
    }

    // Obtener información general de la web
    const systemPrompt = `Eres Brillarte, el asistente virtual amigable de BRILLARTE, un emprendimiento dominicano de productos únicos de calidad.

INFORMACIÓN DE BRILLARTE:
- Productos: Pulseras, aretes, monederos y accesorios exclusivos
- Ubicación: Santiago de los Caballeros, República Dominicana
- Email: brillarte.oficial.ventas@gmail.com
- Teléfono/WhatsApp: 849-425-2220
- Horarios: Lunes a Viernes 9:00 AM - 6:00 PM, Sábados 10:00 AM - 4:00 PM

BRILLARTE PEDIDOS (Extensión de servicios):
- Servicio de compras online con entrega a República Dominicana
- SIN COSTO ADICIONAL en la primera compra
- Actualmente solo trabajamos con TEMU
- Servicios incluidos:
  * Gestión aduanal completa
  * Almacenamiento seguro en Miami
  * Entrega rápida: 24-48 horas al país
  * Envíos adicionales disponibles (con costo)
  * Servicio "Te compramos por ti"

POLÍTICAS:
- Envíos a nivel nacional
- Sistema de crédito para clientes frecuentes
- Seguimiento de pedidos en tiempo real
- Cambios de dirección permitidos antes de envío

Cliente actual: ${email}${orderInfo}

IMPORTANTE:
- Si preguntan por estado de pedido y NO tienes el código, pide que lo proporcionen
- Si preguntan sobre promociones/cupones que no conoces, recolecta su interés y diles que el equipo los contactará
- Sé amable, profesional y ayuda en todo lo que puedas
- Si no sabes algo, sé honesto y ofrece que el equipo se comunicará con ellos`;

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
        max_tokens: 500
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
        response: 'Disculpa, tengo problemas técnicos. ¿Podrías contactarnos directamente por WhatsApp al 849-425-2220?' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
