import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const stripEmojis = (text: string) =>
  text
    .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]/gu, '')
    .trim();

const extractAssistantMessage = (payload: any): string => {
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) return '';
  return typeof content === 'string' ? content : JSON.stringify(content);
};

const websiteKnowledge = [
  {
    keywords: ['envio', 'entrega', 'delivery', 'vimenpaq', 'domex'],
    answer:
      'Hacemos envios a toda Republica Dominicana via Vimenpaq y Domex, desde RD$200 sujeto a variaciones. Los pedidos en stock llegan en 1 a 3 dias habiles y los personalizados en 5 a 7 dias habiles.',
  },
  {
    keywords: ['reembolso', 'devolucion', 'garantia', 'cambio'],
    answer:
      'El plazo de reclamacion es de 48 horas desde que recibes el pedido y debes conservar la factura original. Los personalizados no tienen devolucion y la garantia cubre defectos de fabrica, dano de envio o producto incorrecto.',
  },
  {
    keywords: ['ubicacion', 'direccion', 'tienda fisica', 'donde estan'],
    answer:
      'Somos una tienda 100% virtual de Santiago de los Caballeros, no tenemos tienda fisica abierta al publico. Te atendemos por esta web y por WhatsApp al 849-425-2220.',
  },
  {
    keywords: ['horario', 'atencion', 'abren', 'cierran'],
    answer: 'Nuestro horario de atencion es de lunes a viernes de 9:00 AM a 6:00 PM.',
  },
  {
    keywords: ['precio', 'catalogo', 'productos', 'comprar'],
    answer:
      'Para ver catalogo y precios actualizados, revisa la seccion /productos o escribenos por WhatsApp al 849-425-2220 y te guiamos de inmediato.',
  },
  {
    keywords: ['instagram', 'correo', 'contacto', 'whatsapp', 'telefono'],
    answer:
      'Puedes contactarnos por WhatsApp al 849-425-2220, por Instagram @brillarte.do.oficial o por correo brillarte.oficial.ventas@gmail.com.',
  },
];

const normalizeText = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const buildHumanFallbackResponse = (lastUserMessage: string, orderInfo: string): string => {
  const normalized = normalizeText(lastUserMessage || '');

  if (orderInfo && /(pedido|codigo|rastreo|tracking|estado|donde va)/.test(normalized)) {
    return stripEmojis(`Soy Noah y te ayudo con tu pedido. ${orderInfo.replace(/^\n/, '')}. Si deseas, te sigo asistiendo por WhatsApp al 849-425-2220.`);
  }

  const matched = websiteKnowledge.find((item) =>
    item.keywords.some((keyword) => normalized.includes(keyword))
  );

  if (matched) {
    return stripEmojis(`Soy Noah, tu asistente virtual de BRILLARTE. ${matched.answer}`);
  }

  return stripEmojis(
    'Claro, te ayudo con gusto. Puedo orientarte sobre pedidos, envios, reembolsos, productos y seguimiento desde la web de BRILLARTE; si prefieres atencion inmediata, escribenos al WhatsApp 849-425-2220.'
  );
};

async function getAiResponse(aiMessages: any[], openAiKey: string | null, lovableApiKey: string | null): Promise<string> {
  if (openAiKey) {
    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: aiMessages,
        max_tokens: 250,
        temperature: 0.6,
      }),
    });

    if (openAiResponse.ok) {
      const openAiData = await openAiResponse.json();
      const openAiMessage = extractAssistantMessage(openAiData);
      if (openAiMessage) return stripEmojis(openAiMessage);
    } else {
      const errorText = await openAiResponse.text();
      let errorCode = '';
      try {
        const parsed = JSON.parse(errorText);
        errorCode = parsed?.error?.code || '';
      } catch {
        // no-op
      }

      console.error('OpenAI error:', openAiResponse.status, errorText);

      const canFallback = Boolean(lovableApiKey) && (
        openAiResponse.status === 429 ||
        openAiResponse.status === 402 ||
        errorCode === 'insufficient_quota'
      );

      if (!canFallback) {
        throw new Error(`OpenAI error: ${openAiResponse.status}`);
      }
    }
  }

  if (!lovableApiKey) {
    throw new Error('No hay proveedor de IA disponible');
  }

  const lovableResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: aiMessages,
      max_tokens: 250,
      temperature: 0.6,
    }),
  });

  if (!lovableResponse.ok) {
    const errorText = await lovableResponse.text();
    console.error('Lovable AI error:', lovableResponse.status, errorText);
    throw new Error(`Lovable AI error: ${lovableResponse.status}`);
  }

  const lovableData = await lovableResponse.json();
  const lovableMessage = extractAssistantMessage(lovableData);

  if (!lovableMessage) {
    throw new Error('La IA no devolvio contenido');
  }

  return stripEmojis(lovableMessage);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, email, orderCode } = await req.json();
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!OPENAI_API_KEY && !LOVABLE_API_KEY) {
      throw new Error('No hay proveedor de IA configurado');
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

    const systemPrompt = `Eres Noah, asistente virtual oficial de BRILLARTE, una tienda de accesorios artesanales en Republica Dominicana.

IDENTIDAD Y TONO:
- Te llamas Noah.
- Hablas en espanol dominicano natural, cercano y profesional.
- Responde como humano (no robotico), con frases claras y utiles.
- Maximo 3 oraciones por respuesta.
- Sin emojis ni simbolos decorativos.

CONTEXTO WEB BRILLARTE:
- Negocio 100% virtual en Santiago de los Caballeros, sin tienda fisica.
- WhatsApp: 849-425-2220.
- Horario: Lunes a Viernes, 9:00 AM a 6:00 PM.
- Instagram: @brillarte.do.oficial.
- Correo: brillarte.oficial.ventas@gmail.com.
- Envio por Vimenpaq y Domex, desde RD$200 (sujeto a variaciones).
- Tiempos: 1-3 dias habiles en stock, 5-7 dias personalizados.
- Reclamaciones: maximo 48 horas y con factura.
- Personalizados no tienen devolucion.

REGLAS:
- Si preguntan por precios/catalogo, orienta a /productos o al WhatsApp.
- Si hay codigo de pedido, usa el estado real disponible y no inventes datos.
- No compartas datos de otros clientes.
- Si no hay suficiente info, pide el dato faltante de forma breve.

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

    let assistantMessage = '';

    try {
      assistantMessage = await getAiResponse(aiMessages, OPENAI_API_KEY, LOVABLE_API_KEY);
    } catch (aiError) {
      console.error('AI providers unavailable:', aiError);
      assistantMessage = buildHumanFallbackResponse(lastMsg, orderInfo);
    }

    if (!assistantMessage) {
      assistantMessage = buildHumanFallbackResponse(lastMsg, orderInfo);
    }

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
