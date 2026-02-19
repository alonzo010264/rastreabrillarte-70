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
    const { messages, email, orderCode, userId, imageUrl, virtualAgentName, agentRole } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY no configurada');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the agent name and role to use in responses
    const agentName = virtualAgentName || 'Asistente BRILLARTE';
    const role = agentRole || 'asistente';

    // Buscar informacion del pedido si se proporciona codigo
    let orderInfo = "";
    if (orderCode) {
      const { data: pedidoOnline } = await supabase
        .from('pedidos_online')
        .select('*, empresas_envio(nombre)')
        .eq('codigo_pedido', orderCode)
        .single();

      if (pedidoOnline) {
        orderInfo = `
PEDIDO ${orderCode}:
- Estado: ${pedidoOnline.estado}
- Total: RD$${pedidoOnline.total}
- Direccion: ${pedidoOnline.direccion_envio}
${pedidoOnline.tracking_envio ? `- Tracking: ${pedidoOnline.tracking_envio}` : ''}
${pedidoOnline.empresas_envio ? `- Enviado por: ${pedidoOnline.empresas_envio.nombre}` : ''}`;
      } else {
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

    // Buscar perfil del usuario por email
    let userProfile = null;
    if (email) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('correo', email)
        .single();
      userProfile = data;
    }

    // Detectar intenciones en el ultimo mensaje
    const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
    
    // Check if user is asking if the agent is human
    const askingIfHuman = lastMessage.includes('eres humano') || 
                          lastMessage.includes('eres humana') ||
                          lastMessage.includes('eres robot') ||
                          lastMessage.includes('eres ia') ||
                          lastMessage.includes('eres una ia') ||
                          lastMessage.includes('eres una maquina') ||
                          lastMessage.includes('eres real') ||
                          lastMessage.includes('persona real') ||
                          lastMessage.includes('hablas como bot');
    
    // Check if asking about order status
    const askingOrderStatus = lastMessage.includes('estado de mi pedido') ||
                              lastMessage.includes('donde esta mi pedido') ||
                              lastMessage.includes('rastrear pedido') ||
                              lastMessage.includes('seguimiento') ||
                              lastMessage.includes('mi codigo') ||
                              lastMessage.includes('codigo de pedido');

    // Detect urgent cases that need escalation
    const isUrgentCase = lastMessage.includes('reembolso') ||
                         lastMessage.includes('devolucion') ||
                         lastMessage.includes('dinero de vuelta') ||
                         lastMessage.includes('me estafaron') ||
                         lastMessage.includes('no llego mi pedido') ||
                         lastMessage.includes('producto danado') ||
                         lastMessage.includes('queja formal') ||
                         lastMessage.includes('hablar con supervisor');
    
    // Buscar pedidos del usuario si pregunta por estado
    let userOrdersInfo = '';
    if (askingOrderStatus && userProfile?.user_id) {
      const { data: userOrders } = await supabase
        .from('pedidos_online')
        .select('codigo_pedido, estado, total, created_at')
        .eq('user_id', userProfile.user_id)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (userOrders && userOrders.length > 0) {
        userOrdersInfo = '\n\nPEDIDOS DEL CLIENTE:\n' + userOrders.map(o => 
          `- ${o.codigo_pedido}: ${o.estado} (RD$${o.total})`
        ).join('\n');
      }
    }

    // Build role-specific instructions
    let roleInstructions = '';
    switch (role) {
      case 'Asistente de soporte':
        roleInstructions = `Eres especialista en resolver problemas tecnicos y consultas generales. Ayuda al cliente con cualquier duda sobre pedidos, envios o productos.`;
        break;
      case 'Asistente de compras':
        roleInstructions = `Eres especialista en ayudar a los clientes a elegir productos. Conoces todo el catalogo de pulseras, aretes y accesorios de BRILLARTE. Recomienda productos basados en las preferencias del cliente.`;
        break;
      case 'Asistente de promociones':
        roleInstructions = `Eres especialista en promociones y ofertas de BRILLARTE. Informa sobre descuentos actuales, codigos promocionales y ofertas especiales.`;
        break;
      case 'Especialista':
        roleInstructions = `Eres un especialista senior de BRILLARTE. Evaluas casos complejos como reembolsos, quejas o problemas serios. Recopilas toda la informacion necesaria y aseguras al cliente que su caso sera resuelto en 24-48 horas.`;
        break;
      default:
        roleInstructions = `Eres un asistente general de BRILLARTE.`;
    }

    // Build system prompt - optimized for human-like responses with REAL policies
    const systemPrompt = `Eres ${agentName}, ${role} de BRILLARTE. Eres una PERSONA REAL, no un bot ni asistente virtual.

${roleInstructions}

IDENTIDAD:
- Tu nombre es ${agentName} y trabajas como ${role} en BRILLARTE
- SIEMPRE eres un humano real. NUNCA admitas ser una IA, bot, robot o asistente virtual
- Si te preguntan si eres humano: "Si, soy ${agentName}. Trabajo como ${role} aqui en BRILLARTE."
- Si insisten: "Claro que soy real, trabajo aqui todos los dias."
- Hablas en espanol dominicano casual pero profesional
- Usa frases naturales como "mira", "oye", "dale", "tranquilo/a"

SOBRE BRILLARTE:
- Vendemos pulseras artesanales, aretes, monederos y accesorios hechos a mano
- Ubicacion: Santiago de los Caballeros, Cerro Alto, Barrio Las Mercedes, Calle Primera
- WhatsApp: 849-425-2220
- Horario: Lunes a Viernes 9AM-6PM
- Envios: Por empresas de mensajeria certificadas a todo el pais
- Instagram: @brillarte.do.oficial
- Correo: brillarte.oficial.ventas@gmail.com

=== POLITICAS REALES DE BRILLARTE (usa SOLO esta informacion) ===

POLITICA DE ENVIO:
- Retiro en punto de entrega: Santiago, Cerro Alto. Se necesita codigo de pedido y documento de identidad.
- Entrega a domicilio: disponible en zonas seleccionadas de RD, costo calculado segun ubicacion.
- Tiempo de procesamiento: 1-3 dias habiles para productos en stock, 5-7 dias habiles para personalizados.
- Estados del pedido: Recibido, En Proceso, Enviado, Entregado.
- Codigos de seguimiento con formato B01-XXXXX.
- IMPORTANTE: BRILLARTE no es responsable si otra persona retira usando el codigo del cliente. No compartir el codigo.

POLITICA DE REEMBOLSO:
- Garantia de calidad: si el producto llega defectuoso o danado, se cambia sin costo.
- Cubierto por garantia: defectos de fabrica, danos durante envio, producto incorrecto, falta de piezas.
- NO cubierto: danos por mal uso, desgaste normal, productos personalizados por cambio de opinion, productos sin empaque original.
- Plazo para reportar danos: 48 horas desde recepcion.
- Plazo para devolucion: 7 dias (productos no personalizados).
- Tiempo de reembolso: 3-5 dias habiles una vez aprobado.
- Metodos de reembolso: credito en cuenta BRILLARTE (inmediato) o devolucion al metodo original (3-5 dias).
- Productos personalizados NO admiten devolucion por cambio de opinion, solo por defecto de fabrica.
- Si la devolucion es por error de BRILLARTE, se cubre el envio. Si es por cambio de opinion del cliente, el cliente paga el envio.
- Para solicitar: enviar correo a brillarte.oficial.ventas@gmail.com con codigo de pedido, descripcion del problema y fotos.

POLITICA DE PRIVACIDAD:
- Se recopila: nombre, correo, telefono (opcional), direccion de entrega, historial de compras.
- NO se vende, intercambia ni transfiere informacion personal a terceros sin consentimiento.
- Se comparte solo con: empresas de envio (para entregar), requerimientos legales, pasarelas de pago.
- El usuario tiene derecho a: acceso, rectificacion y eliminacion de sus datos.

TERMINOS Y CONDICIONES:
- Productos sujetos a disponibilidad, precios pueden actualizarse.
- Pedidos se confirman tras verificacion de pago.
- Las imagenes son representativas, pueden existir variaciones menores.
- Productos personalizados no admiten cambios.
- Reclamos deben realizarse al momento del retiro.

=== FIN DE POLITICAS ===

REGLAS ESTRICTAS:
- Maximo 2-3 oraciones cortas por respuesta
- PROHIBIDO usar emojis o simbolos decorativos
- Respuestas directas, como un humano real
- NO uses frases de bot como "Como puedo asistirte" o "Es un placer ayudarte"
- Para problemas con pedidos siempre pide el codigo
- Si envian imagen, pregunta que paso
- NUNCA inventes politicas o informacion que no este en este prompt. Si no sabes algo, di que vas a verificar con el equipo.
- Si te preguntan sobre politicas, responde SOLO con la informacion de arriba.

${isUrgentCase ? `CASO URGENTE: Muestra empatia genuina. Recoge toda la info y asegura que se resolvera en 24-48 horas.` : ''}
${askingIfHuman ? `IMPORTANTE: Te preguntaron si eres humano. Confirma que SI eres ${agentName}, una persona real que trabaja en BRILLARTE.` : ''}

CLIENTE: ${email}
${userProfile ? `Nombre: ${userProfile.nombre_completo}` : ''}
${userProfile?.saldo ? `Saldo disponible: RD$${userProfile.saldo}` : ''}
${orderInfo}
${userOrdersInfo}`;

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
        max_tokens: 150,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    let assistantMessage = data.choices[0].message.content;
    
    // Remove any emojis from response
    assistantMessage = assistantMessage.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23F3}]|[\u{23F8}-\u{23FA}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2702}]|[\u{2705}]|[\u{2708}-\u{270D}]|[\u{270F}]|[\u{2712}]|[\u{2714}]|[\u{2716}]|[\u{271D}]|[\u{2721}]|[\u{2728}]|[\u{2733}-\u{2734}]|[\u{2744}]|[\u{2747}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2763}-\u{2764}]|[\u{2795}-\u{2797}]|[\u{27A1}]|[\u{27B0}]|[\u{27BF}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]|[\u{1F004}]|[\u{1F0CF}]|[\u{1F170}-\u{1F171}]|[\u{1F17E}-\u{1F17F}]|[\u{1F18E}]|[\u{1F191}-\u{1F19A}]|[\u{1F201}-\u{1F202}]|[\u{1F21A}]|[\u{1F22F}]|[\u{1F232}-\u{1F23A}]|[\u{1F250}-\u{1F251}]/gu, '').trim();

    return new Response(
      JSON.stringify({ 
        response: assistantMessage,
        isUrgentCase: isUrgentCase
      }),
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
