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
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY no configurada');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Detect order code in last message
    const lastMsg = messages[messages.length - 1]?.content || '';
    const codeMatch = lastMsg.match(/\b(BRI-?\d{3,8})\b/i) || lastMsg.match(/\b([A-Z]{2,5}-?\d{3,8})\b/i) || lastMsg.match(/\b(B\d{4,5}-\d{4,5})\b/i);
    const codeToTrack = codeMatch ? codeMatch[1].toUpperCase() : orderCode;

    // Lookup order info
    let orderInfo = "";
    if (codeToTrack) {
      const { data: pedidoOnline } = await supabase
        .from('pedidos_online')
        .select('*, empresas_envio(nombre)')
        .eq('codigo_pedido', codeToTrack)
        .single();

      if (pedidoOnline) {
        orderInfo = `\nPEDIDO ${codeToTrack}: Estado: ${pedidoOnline.estado}${pedidoOnline.estado_detallado ? ` (${pedidoOnline.estado_detallado})` : ''} | Total: RD$${pedidoOnline.total} | Direccion: ${pedidoOnline.direccion_envio}${pedidoOnline.tracking_envio ? ` | Tracking: ${pedidoOnline.tracking_envio}` : ''}${pedidoOnline.empresas_envio ? ` | Enviado por: ${pedidoOnline.empresas_envio.nombre}` : ''} | Fecha: ${new Date(pedidoOnline.created_at).toLocaleDateString('es-DO')}`;
      } else {
        const { data: pedidoLegacy } = await supabase
          .from('Pedidos')
          .select('*, Estatus:Estatus_id(nombre)')
          .eq('Código de pedido', codeToTrack)
          .single();

        if (pedidoLegacy) {
          orderInfo = `\nPEDIDO ${codeToTrack}: Cliente: ${pedidoLegacy.Cliente} | Estado: ${pedidoLegacy.Estatus?.nombre || pedidoLegacy.estado || 'Pendiente'} | Total: RD$${pedidoLegacy.Total || pedidoLegacy.Precio || 'N/A'}`;
        } else {
          const { data: pedidoReg } = await supabase
            .from('pedidos_registro')
            .select('*')
            .eq('codigo_pedido', codeToTrack)
            .single();

          if (pedidoReg) {
            orderInfo = `\nPEDIDO ${codeToTrack}: Cliente: ${pedidoReg.nombre_cliente} | Estado: ${pedidoReg.estado_pedido} | Credito: RD$${pedidoReg.credito || 0}`;
          } else {
            orderInfo = `\nNo se encontro ningun pedido con el codigo ${codeToTrack}.`;
          }
        }
      }
    }

    // Lookup user profile
    let userInfo = "";
    if (email) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('nombre_completo, saldo')
        .eq('correo', email)
        .single();
      if (profile) {
        userInfo = `\nCliente: ${profile.nombre_completo || email}${profile.saldo ? ` | Saldo: RD$${profile.saldo}` : ''}`;
      }
    }

    const systemPrompt = `Eres el asistente oficial de BRILLARTE, una tienda de accesorios artesanales (pulseras, aretes, anillos, monederos) en Republica Dominicana.

IDENTIDAD:
- Trabajas en BRILLARTE como agente de atencion al cliente
- Hablas en espanol dominicano casual pero profesional
- NUNCA admitas ser IA, bot o robot. Eres una persona real del equipo BRILLARTE
- Si preguntan si eres humano: "Si, soy del equipo de BRILLARTE"

INFORMACION DE BRILLARTE:
- Ubicacion: Santiago de los Caballeros, Cerro Alto, Barrio Las Mercedes, Calle Primera
- WhatsApp: 849-425-2220
- Horario: Lunes a Viernes 9AM-6PM
- Instagram: @brillarte.do.oficial
- Correo: brillarte.oficial.ventas@gmail.com
- Web: brillarte.lovable.app
- Somos 100% virtual, sin tienda fisica abierta al publico

POLITICAS:
- Envio: Via VIMENPAQ y DOMEX. Desde RD$200 (sujeto a variaciones). 1-3 dias habiles en stock, 5-7 dias personalizados.
- Reembolso: Plazo maximo 48 HORAS desde recepcion. SIN FACTURA NO HAY RECLAMACION. Productos personalizados NO tienen devolucion.
- Garantia cubre: defectos de fabrica, danos durante envio, producto incorrecto, falta de piezas.
- NO cubre: mal uso, desgaste normal, cambio de opinion en personalizados, sin empaque original.
- Privacidad: No vendemos datos a terceros. El usuario puede solicitar eliminacion de sus datos.

RASTREO DE PEDIDOS:
- Si el cliente da un codigo de pedido, busca la info y comunica el estado.
- Si pregunta sin dar codigo, pidelo.
- NUNCA inventes estados ni reveles datos de otros clientes.

PRODUCTOS:
- Vendemos pulseras artesanales, aretes, anillos, monederos y accesorios hechos a mano.
- Para ver catalogo y precios, dirige al cliente a la pagina /productos o al WhatsApp 849-425-2220.

IMAGENES Y DOCUMENTOS:
- Si el cliente envia una imagen o documento, analiza su contenido y responde en consecuencia.
- Si es una foto de un producto danado, pide el codigo de pedido para abrir un caso.
- Si es una captura de pantalla de un error, ayuda a resolver el problema.

REGLAS:
- Maximo 3 oraciones por respuesta
- PROHIBIDO emojis y simbolos decorativos
- Respuestas directas y naturales, como un humano
- NO repitas saludos si ya saludaste
- Si no sabes algo, di que verificaras con el equipo
- NUNCA inventes politicas ni informacion

${userInfo}${orderInfo}`;

    // Build messages for AI - support multimodal (images)
    const aiMessages: any[] = [{ role: 'system', content: systemPrompt }];
    
    for (const msg of messages) {
      if (msg.imageUrl) {
        // Multimodal message with image
        aiMessages.push({
          role: msg.role,
          content: [
            ...(msg.content ? [{ type: 'text', text: msg.content }] : []),
            { type: 'image_url', image_url: { url: msg.imageUrl } }
          ]
        });
      } else {
        aiMessages.push({ role: msg.role, content: msg.content });
      }
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: aiMessages,
        max_tokens: 200,
        temperature: 0.6
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ response: "Estamos recibiendo muchas consultas. Intentalo en unos segundos." }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ response: "Servicio temporalmente no disponible. Contactanos por WhatsApp al 849-425-2220." }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    let assistantMessage = data.choices[0].message.content;
    
    // Remove emojis
    assistantMessage = assistantMessage.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]/gu, '').trim();

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
