import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const stripEmojis = (text: string) =>
  text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]/gu, '').trim();

const extractAssistantMessage = (payload: any): string => {
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) return '';
  return typeof content === 'string' ? content : JSON.stringify(content);
};

// ==========================================
// SISTEMA PROMPT AVANZADO PARA IA
// ==========================================

function buildSystemPrompt(userInfo: string, orderInfo: string): string {
  return `Eres Noah, un empleado real de BRILLARTE que atiende clientes por chat. NO eres un bot, NO eres IA, eres Noah.

INSTRUCCIONES CRITICAS DE COMPORTAMIENTO:

1. LEE Y ENTIENDE cada mensaje del cliente. No respondas con frases genericas. Analiza que necesita EXACTAMENTE.

2. RESUELVE el problema tu mismo siempre que puedas. NUNCA respondas "no puedo ayudarte" ni "escribe a WhatsApp" como primera opcion. Esa es tu ULTIMA alternativa, solo cuando genuinamente no puedas resolver algo (como procesar un pago o hacer un envio fisico).

3. ADAPTA tu respuesta al contexto de la conversacion. Si el cliente ya te dio informacion antes, usala. No pidas datos que ya tienes.

4. HABLA NATURAL en espanol dominicano casual pero profesional:
   - "Dale, dejame revisarte eso"
   - "Mira, lo que pasa es que..."
   - "Claro que si, te explico"
   - "Tranqui, eso tiene solucion"
   - Pero si el cliente es formal, adapta tu tono.

5. NO uses emojis. NO uses asteriscos. NO uses negritas ni formato markdown.

6. Respuestas de 2-5 oraciones. Suficiente para resolver, sin ser excesivo.

7. Si el cliente tiene un problema especifico:
   - PRIMERO muestra empatia genuina (no frases roboticas)
   - SEGUNDO da la solucion concreta con pasos claros
   - TERCERO solo si es necesario, ofrece alternativa adicional

8. Si el cliente hace una pregunta casual o social, responde como humano. Si dice "como estas", no le des un menu de opciones.

9. JAMAS digas: "como asistente virtual", "como IA", "no tengo capacidad de", "te recomiendo contactar a", "lamentablemente no puedo". Eres Noah, un empleado.

10. Si no sabes algo especifico, di honestamente "dejame verificar eso" o "no tengo ese dato exacto ahora mismo, pero..." y ofrece lo que SI sabes.

CONOCIMIENTO COMPLETO DE BRILLARTE:

EMPRESA: Tienda 100% virtual de accesorios artesanales. Santiago de los Caballeros, RD. Lema: "El Arte de Brillar". Sin tienda fisica. Punto de retiro: Cerro Alto, Barrio Las Mercedes, Calle Primera.

PRODUCTOS Y CATALOGO:
- Pulseras: Margarita (perlas, diseno floral), Mariposas (tejidas), Corazones (colores pastel), Love You (mensajes personalizados), Cristal Multicolor, Girasol Dorada, Macrame Girasoles, Trebol Tejidas, Pareja/Amistad, Iniciales Personalizadas (desde RD$75), Brillantes Elegantes
- Aretes: Flores colores vibrantes, Margaritas multicolor, Flores Verdes
- Anillos: Flores Azul (delicado, tonos azules)
- Flores crochet: Rojas (tejidas rojo intenso), Bouquets multicolor (ramos tejidos a mano)
- Monederos artesanales
- Todo es hecho a mano, artesanal, disenos unicos
- Personalizados: nombres, colores, disenos unicos. Tardan 5-7 dias habiles. NO tienen devolucion.
- Para precios exactos del catalogo completo: dirigir a /productos en la web

CONTACTO:
- WhatsApp: 849-425-2220
- Email: brillarte.oficial.ventas@gmail.com
- Instagram: @brillarte.do.oficial
- Web: https://www.brillarte.lat
- Horario: L-V 9AM-6PM, Sabados 10AM-4PM, Domingos cerrado

ENVIOS:
- Empresas: Vimenpaq y Domex
- Costo: desde RD$200 (varia segun ubicacion y peso)
- Tiempo stock: 1-3 dias habiles
- Tiempo personalizados: 5-7 dias habiles
- Retiro gratis: Cerro Alto, Santiago (necesita codigo pedido + identificacion)
- Cobertura: toda Republica Dominicana
- Se puede cambiar direccion si el pedido no ha sido despachado

REEMBOLSOS Y GARANTIA:
- Plazo: MAXIMO 48 horas (2 dias) desde recepcion
- Factura: OBLIGATORIA. Sin factura = sin reclamo, sin excepcion.
- Cubre: defectos fabrica, danos envio, producto incorrecto, piezas faltantes
- NO cubre: mal uso, desgaste normal, sin empaque original, fuera de 48h
- Personalizados: NO devolucion. Solo cambio si defecto comprobable de fabrica.
- Metodos: credito en cuenta (inmediato) o devolucion metodo original (3-5 dias)
- Proceso: contactar con codigo + fotos -> evaluacion 24-48h -> resolucion
- Si error de BRILLARTE: cubrimos envio devolucion. Si cambio de opinion: cliente paga envio.

PAGOS:
- Transferencia bancaria
- Pago contra entrega (casos especificos)
- Saldo BRILLARTE (credito en cuenta)
- Cuotas flexibles: mitad ahora, mitad despues. Segun monto, hasta 5+ cuotas.

CUENTA DEL CLIENTE:
- Saldo: monedero virtual para compras, se acumula con reembolsos/referidos/promos
- Verificacion: se solicita desde el perfil
- Referidos: programa para ganar beneficios invitando amigos
- Registro: en /registro con correo + nombre + contrasena

COMO HACER PEDIDO:
1. Web: /productos -> elegir -> carrito -> checkout
2. Formulario: /pedir
3. WhatsApp: 849-425-2220
- Al confirmar reciben codigo formato B01-XXXXX o BRI-XXXXX
- Rastreo en /rastrear-pedido o preguntandole a Noah

SECCIONES DE LA WEB:
- /productos - catalogo completo con precios
- /pedir - formulario de pedido
- /rastrear-pedido - rastreo con codigo
- /registro - crear cuenta
- /referidos - programa de referidos
- /promociones - ofertas activas
- /eventos - eventos y actividades
- /comunidad - comunidad BRILLARTE
- /tarjetas-regalo - gift cards
- /emprende-brillarte - programa para revendedores
- /contacto - formulario de contacto
- /sobre-nosotros - info de la empresa

REGLAS ABSOLUTAS:
- NUNCA inventes precios de productos especificos (solo menciona "desde RD$75" para personalizadas)
- Si hay codigo de pedido, usa SOLO los datos reales del sistema
- No compartas info de otros clientes
- Solo comparte la URL oficial: https://www.brillarte.lat

${userInfo}${orderInfo}`;
}

// ==========================================
// AI PROVIDER
// ==========================================

async function getAiResponse(aiMessages: any[], openAiKey: string | null, lovableApiKey: string | null): Promise<string> {
  // Try Lovable AI with advanced model
  if (lovableApiKey) {
    try {
      const lovableResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: aiMessages,
          max_tokens: 600,
          temperature: 0.8,
        }),
      });

      if (lovableResponse.ok) {
        const data = await lovableResponse.json();
        const msg = extractAssistantMessage(data);
        if (msg) return stripEmojis(msg);
      } else {
        const errorText = await lovableResponse.text();
        console.error('Lovable AI error:', lovableResponse.status, errorText);
        
        if (lovableResponse.status === 429) {
          throw new Error('RATE_LIMIT');
        }
        if (lovableResponse.status === 402) {
          throw new Error('PAYMENT_REQUIRED');
        }
      }
    } catch (e) {
      if (e instanceof Error && (e.message === 'RATE_LIMIT' || e.message === 'PAYMENT_REQUIRED')) throw e;
      console.error('Lovable AI failed:', e);
    }
  }

  // Fallback to OpenAI
  if (openAiKey) {
    try {
      const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${openAiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o', messages: aiMessages, max_tokens: 600, temperature: 0.8 }),
      });

      if (openAiResponse.ok) {
        const data = await openAiResponse.json();
        const msg = extractAssistantMessage(data);
        if (msg) return stripEmojis(msg);
      }
    } catch (e) {
      console.error('OpenAI failed:', e);
    }
  }

  throw new Error('NO_AI_AVAILABLE');
}

// ==========================================
// MAIN HANDLER
// ==========================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, email, orderCode } = await req.json();
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Detect order code in last message
    const lastMsg = messages[messages.length - 1]?.content || '';
    const codeMatch = lastMsg.match(/\b(BRI-?\d{3,8})\b/i) || lastMsg.match(/\b([A-Z]{2,5}-?\d{3,8})\b/i) || lastMsg.match(/\b(B\d{4,5}-\d{4,5})\b/i);
    const codeToTrack = codeMatch ? codeMatch[1].toUpperCase() : orderCode;

    // Lookup order info
    let orderInfo = '';
    if (codeToTrack) {
      const { data: pedidoOnline } = await supabase
        .from('pedidos_online')
        .select('*, empresas_envio(nombre)')
        .eq('codigo_pedido', codeToTrack)
        .single();

      if (pedidoOnline) {
        orderInfo = `\nPEDIDO ${codeToTrack}: Estado: ${pedidoOnline.estado}${pedidoOnline.estado_detallado ? ` (${pedidoOnline.estado_detallado})` : ''} | Total: RD$${pedidoOnline.total} | Direccion: ${pedidoOnline.direccion_envio}${pedidoOnline.tracking_envio ? ` | Tracking: ${pedidoOnline.tracking_envio}` : ''}${pedidoOnline.empresas_envio ? ` | Enviado por: ${(pedidoOnline.empresas_envio as any).nombre}` : ''} | Fecha: ${new Date(pedidoOnline.created_at!).toLocaleDateString('es-DO')}`;
      } else {
        const { data: pedidoLegacy } = await supabase
          .from('Pedidos')
          .select('*, Estatus:Estatus_id(nombre)')
          .eq('Código de pedido', codeToTrack)
          .single();

        if (pedidoLegacy) {
          orderInfo = `\nPEDIDO ${codeToTrack}: Cliente: ${pedidoLegacy.Cliente} | Estado: ${(pedidoLegacy as any).Estatus?.nombre || pedidoLegacy.estado || 'Pendiente'} | Total: RD$${pedidoLegacy.Total || pedidoLegacy.Precio || 'N/A'}`;
        } else {
          const { data: pedidoReg } = await supabase
            .from('pedidos_registro')
            .select('*')
            .eq('codigo_pedido', codeToTrack)
            .single();

          if (pedidoReg) {
            orderInfo = `\nPEDIDO ${codeToTrack}: Cliente: ${pedidoReg.nombre_cliente} | Estado: ${pedidoReg.estado_pedido} | Credito: RD$${pedidoReg.credito || 0}`;
          } else {
            orderInfo = `\nNo se encontro ningun pedido con el codigo ${codeToTrack}. Verifica que el codigo sea correcto.`;
          }
        }
      }
    }

    // Lookup user profile
    let userInfo = '';
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

    // Also fetch active promotions for context
    let promoInfo = '';
    const { data: promos } = await supabase
      .from('productos')
      .select('nombre, precio, porcentaje_descuento, en_oferta')
      .eq('en_oferta', true)
      .eq('activo', true)
      .limit(5);
    
    if (promos && promos.length > 0) {
      promoInfo = '\nPRODUCTOS EN OFERTA AHORA: ' + promos.map(p => 
        `${p.nombre} RD$${p.precio}${p.porcentaje_descuento ? ` (-${p.porcentaje_descuento}%)` : ''}`
      ).join(' | ');
    }

    const systemPrompt = buildSystemPrompt(userInfo, orderInfo + promoInfo);

    // Build messages for AI - support multimodal
    const aiMessages: any[] = [{ role: 'system', content: systemPrompt }];

    for (const msg of messages) {
      if (msg.imageUrl) {
        aiMessages.push({
          role: msg.role,
          content: [
            ...(msg.content ? [{ type: 'text', text: msg.content }] : []),
            { type: 'image_url', image_url: { url: msg.imageUrl } },
          ],
        });
      } else {
        aiMessages.push({ role: msg.role, content: msg.content });
      }
    }

    const assistantMessage = await getAiResponse(aiMessages, OPENAI_API_KEY, LOVABLE_API_KEY);

    return new Response(
      JSON.stringify({ response: assistantMessage || 'Dale, cuentame con mas detalle que necesitas y te ayudo.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error in chatbot-assistant:', error);

    const errMsg = error instanceof Error ? error.message : '';
    
    if (errMsg === 'RATE_LIMIT') {
      return new Response(
        JSON.stringify({ error: 'Rate limit', response: 'Tengo muchas consultas en este momento, dame unos segundos y vuelve a escribirme.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    
    if (errMsg === 'PAYMENT_REQUIRED') {
      return new Response(
        JSON.stringify({ error: 'Payment required', response: 'Estoy teniendo un problema tecnico temporal. Mientras tanto, puedes escribirnos al WhatsApp 849-425-2220.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ error: errMsg || 'Error desconocido', response: 'Disculpa, tengo un inconveniente tecnico. Escribenos al WhatsApp 849-425-2220 y te atendemos de inmediato.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
