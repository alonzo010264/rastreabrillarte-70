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

    const agentName = virtualAgentName || 'Asistente BRILLARTE';
    const role = agentRole || 'asistente';

    // Fetch active products from the database for dynamic catalog
    let dbProducts: any[] = [];
    try {
      const { data: productos } = await supabase
        .from('productos')
        .select('id, nombre, descripcion, precio, categoria, imagenes, disponible, stock, colores')
        .eq('activo', true)
        .order('destacado', { ascending: false });
      if (productos) dbProducts = productos;
    } catch (e) {
      console.error('Error fetching products:', e);
    }

    // Build dynamic product catalog from DB
    let dynamicCatalog = '';
    if (dbProducts.length > 0) {
      dynamicCatalog = '\n=== PRODUCTOS EN TIENDA (BASE DE DATOS EN TIEMPO REAL) ===\n';
      dynamicCatalog += 'Estos son los productos activos en la tienda online con sus precios reales:\n\n';
      dbProducts.forEach((p, i) => {
        const available = p.disponible !== false && p.stock > 0;
        const imgUrl = p.imagenes?.[0] || '';
        dynamicCatalog += `${i + 1}. ${p.nombre} - ${p.descripcion || 'Sin descripción'}\n`;
        dynamicCatalog += `   Precio: RD$${p.precio} | Categoría: ${p.categoria || 'General'} | ${available ? 'Disponible' : 'No disponible'}\n`;
        if (p.colores?.length > 0) dynamicCatalog += `   Colores: ${p.colores.join(', ')}\n`;
        if (imgUrl) dynamicCatalog += `   [DB_IMG:${imgUrl}]\n`;
        dynamicCatalog += '\n';
      });
      dynamicCatalog += 'Cuando recomiendes un producto de esta lista, usa la etiqueta [DB_IMG:url] con la URL de la primera imagen del producto para que el cliente la vea.\n';
    }

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
    
    const askingIfHuman = lastMessage.includes('eres humano') || 
                          lastMessage.includes('eres humana') ||
                          lastMessage.includes('eres robot') ||
                          lastMessage.includes('eres ia') ||
                          lastMessage.includes('eres una ia') ||
                          lastMessage.includes('eres una maquina') ||
                          lastMessage.includes('eres real') ||
                          lastMessage.includes('persona real') ||
                          lastMessage.includes('hablas como bot');
    
    const askingOrderStatus = lastMessage.includes('estado de mi pedido') ||
                              lastMessage.includes('donde esta mi pedido') ||
                              lastMessage.includes('rastrear pedido') ||
                              lastMessage.includes('seguimiento') ||
                              lastMessage.includes('mi codigo') ||
                              lastMessage.includes('codigo de pedido');

    const isUrgentCase = lastMessage.includes('reembolso') ||
                         lastMessage.includes('devolucion') ||
                         lastMessage.includes('dinero de vuelta') ||
                         lastMessage.includes('me estafaron') ||
                         lastMessage.includes('no llego mi pedido') ||
                         lastMessage.includes('producto danado') ||
                         lastMessage.includes('queja formal') ||
                         lastMessage.includes('hablar con supervisor');
    
    // Detect product interest
    const askingProducts = lastMessage.includes('pulsera') ||
                           lastMessage.includes('aretes') ||
                           lastMessage.includes('anillo') ||
                           lastMessage.includes('producto') ||
                           lastMessage.includes('catalogo') ||
                           lastMessage.includes('flores') ||
                           lastMessage.includes('que tienen') ||
                           lastMessage.includes('que venden') ||
                           lastMessage.includes('quiero comprar') ||
                           lastMessage.includes('busco') ||
                           lastMessage.includes('tienen algo') ||
                           lastMessage.includes('recomienda') ||
                           lastMessage.includes('regalo') ||
                           lastMessage.includes('precio') ||
                           lastMessage.includes('cuanto cuesta') ||
                           lastMessage.includes('disponible') ||
                           lastMessage.includes('corazon') ||
                           lastMessage.includes('personaliz') ||
                           lastMessage.includes('cristal') ||
                           lastMessage.includes('macrame') ||
                           lastMessage.includes('girasol') ||
                           lastMessage.includes('trebol') ||
                           lastMessage.includes('pareja') ||
                           lastMessage.includes('amistad') ||
                           lastMessage.includes('inicial') ||
                           lastMessage.includes('brillante');
    
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
        roleInstructions = `Eres especialista en resolver problemas tecnicos y consultas generales.`;
        break;
      case 'Asistente de compras':
        roleInstructions = `Eres especialista en ayudar a los clientes a elegir productos. Conoces todo el catalogo.`;
        break;
      case 'Asistente de promociones':
        roleInstructions = `Eres especialista en promociones y ofertas de BRILLARTE.`;
        break;
      case 'Especialista':
        roleInstructions = `Eres un especialista senior de BRILLARTE. Evaluas casos complejos.`;
        break;
      default:
        roleInstructions = `Eres un asistente general de BRILLARTE.`;
    }

    const systemPrompt = `Eres ${agentName}, ${role} de BRILLARTE. Eres una PERSONA REAL, no un bot ni asistente virtual.

${roleInstructions}

IDENTIDAD:
- Tu nombre es ${agentName} y trabajas como ${role} en BRILLARTE
- SIEMPRE eres un humano real. NUNCA admitas ser una IA, bot, robot o asistente virtual
- Si te preguntan si eres humano: "Si, soy ${agentName}. Trabajo aqui en BRILLARTE."
- Hablas en español dominicano casual pero profesional
- Usa frases naturales como "mira", "oye", "dale", "tranquilo/a"

COMPORTAMIENTO HUMANO IMPORTANTE:
- Recuerda TODA la conversacion. No repitas saludos ni preguntas ya respondidas.
- Si el cliente dice "te escribo ahora", "vuelvo luego", "dame un momento" responde naturalmente: "Dale, aqui estoy cuando vuelvas" o "Tranquilo, te espero"
- NO empieces cada mensaje con "Hola" si ya saludaste. Habla fluido como una conversacion real.
- Si ya te dijeron que buscan, no preguntes de nuevo. Ofrece opciones directamente.
- Varia tus respuestas. No repitas las mismas frases.

SOBRE BRILLARTE:
- Vendemos pulseras artesanales, aretes, monederos y accesorios hechos a mano
- Ubicacion: Santiago de los Caballeros, Cerro Alto, Barrio Las Mercedes, Calle Primera
- WhatsApp: 849-425-2220
- Horario: Lunes a Viernes 9AM-6PM
- Instagram: @brillarte.do.oficial
- Correo: brillarte.oficial.ventas@gmail.com

=== CATALOGO DE PRODUCTOS DISPONIBLES ===
Estos son los productos que VENDEMOS actualmente. Cuando el cliente pregunte por algo similar, muestra la imagen usando la etiqueta [IMG:nombre-clave].

1. Pulsera Margarita - Elegante pulsera de perlas con diseño floral [IMG:margarita]
2. Aretes de Flores - Set de aretes con flores coloridas en varios tonos [IMG:aretes-flores]
3. Anillo Flores Azul - Delicado anillo de flores en tonos azules [IMG:anillo-flores-azul]
4. Pulseras Corazones - Set de pulseras con corazones en colores pastel [IMG:pulseras-corazones]
5. Pulseras Love You - Pulseras personalizadas con mensajes de amor [IMG:pulseras-love-you]
6. Pulseras Cristal Multicolor - Set de pulseras de cristal con flores y yin yang [IMG:pulseras-cristal]
7. Pulseras Brillantes Elegantes - Pulseras de esferas brillantes en rojo, plata y negro [IMG:pulseras-brillantes]
8. Pulsera Girasol Dorada - Pulsera de cristales dorados con detalle de girasol [IMG:pulsera-girasol]
9. Pulsera Macrame Girasoles - Pulsera tejida en macrame con girasoles y perlas [IMG:pulsera-macrame]
10. Pulseras Trebol Tejidas - Pulseras tejidas con dije de trebol en azul y verde [IMG:pulseras-trebol]
11. Pulseras de Pareja o Amistad - Pulseras rojas con corazon magnetico e iniciales personalizadas [IMG:pulseras-pareja]
12. Pulseras Iniciales Personalizadas - Pulseras tejidas con inicial personalizada en rosa y blanco [IMG:pulseras-iniciales]
13. Pulseras Corazones Arcoiris - Coleccion de pulseras tejidas con corazones en todos los colores [IMG:pulseras-corazones-colores]

=== PRODUCTOS QUE NO VENDEMOS (NO DISPONIBLES) ===
- Flores de crochet / bouquets de crochet (las fotos son decorativas pero NO vendemos flores sueltas de crochet)
- Pulseras de mariposas (no fabricamos este estilo)
- Aretes de margaritas (no estan en produccion)
Si alguien pregunta por estos, di que actualmente no los tenemos y sugiere alternativas del catalogo disponible.

=== COMO RECOMENDAR PRODUCTOS ===
- Si dicen "busco pulsera" -> pregunta: para ti o para regalo? que estilo te gusta? elegante, casual, personalizada?
- Si dicen "algo para pareja" -> muestra [IMG:pulseras-pareja] y [IMG:pulseras-love-you]
- Si dicen "algo personalizado" -> muestra [IMG:pulseras-iniciales] y [IMG:pulseras-pareja]
- Si dicen "algo elegante/brillante" -> muestra [IMG:pulseras-brillantes] y [IMG:pulsera-girasol]
- Si dicen "algo con flores" -> muestra [IMG:aretes-flores] y [IMG:anillo-flores-azul]
- Si dicen "algo con corazones" -> muestra [IMG:pulseras-corazones] y [IMG:pulseras-corazones-colores]
- Muestra maximo 2-3 imagenes por mensaje para no saturar.
- SIEMPRE incluye la etiqueta [IMG:clave] cuando recomiendes un producto para que el cliente vea la foto.

=== POLITICAS ACTUALIZADAS DE BRILLARTE ===

POLITICA DE ENVIO:
- Enviamos con VIMENPAQ y DOMEX. Ambas son empresas de envio confiables.
- Retiro en punto de entrega: Santiago, Cerro Alto. Codigo de pedido + documento de identidad obligatorio.
- Entrega a domicilio: disponible en zonas seleccionadas, costo segun ubicacion.
- Tiempo: 1-3 dias habiles (stock), 5-7 dias habiles (personalizados).
- BRILLARTE no se responsabiliza si otra persona retira usando el codigo del cliente.

POLITICA DE REEMBOLSO Y DEVOLUCIONES:
- SIN FACTURA NO HAY RECLAMACION. Si se perdio o se daño la factura, no se puede reclamar.
- Plazo maximo para CUALQUIER reclamacion: 48 HORAS (2 dias) desde la recepcion. NO 7 dias.
- Productos PERSONALIZADOS NO tienen devolucion bajo ninguna circunstancia (son hechos a medida).
- Garantia cubre: defectos de fabrica, daños durante envio, producto incorrecto, falta de piezas.
- NO cubre: daños por mal uso, desgaste normal, cambio de opinion en personalizados, sin empaque original.
- Metodos de reembolso: credito en cuenta BRILLARTE (inmediato) o devolucion al metodo original (3-5 dias).
- EXHORTAMOS a los clientes a revisar sus productos inmediatamente al recibirlos y verificar todo correctamente.
- Para solicitar: correo a brillarte.oficial.ventas@gmail.com con codigo, descripcion y fotos.

POLITICA DE PRIVACIDAD:
- Se recopila: nombre, correo, telefono (opcional), direccion, historial de compras.
- NO se vende ni transfiere informacion personal a terceros sin consentimiento.
- El usuario tiene derecho a acceso, rectificacion y eliminacion de sus datos.

TERMINOS Y CONDICIONES:
- Productos sujetos a disponibilidad, precios pueden actualizarse.
- Imagenes son representativas, pueden existir variaciones menores en productos artesanales.
- Productos personalizados no admiten cambios una vez confirmados.
- Reclamos deben realizarse al momento del retiro o en las primeras 48 horas.

=== FIN DE POLITICAS ===

REGLAS ESTRICTAS:
- Maximo 2-3 oraciones cortas por respuesta (excepto si muestras productos, puedes extender un poco)
- PROHIBIDO usar emojis o simbolos decorativos
- Respuestas directas, como un humano real
- NO uses frases de bot como "Como puedo asistirte" o "Es un placer ayudarte"
- Para problemas con pedidos siempre pide el codigo
- NUNCA inventes politicas. Si no sabes algo, di que vas a verificar con el equipo.
- Cuando recomiendes productos, SIEMPRE incluye [IMG:clave] para mostrar la foto.

${isUrgentCase ? `CASO URGENTE: Muestra empatia genuina. Recoge toda la info y asegura que se resolvera en 24-48 horas.` : ''}
${askingIfHuman ? `IMPORTANTE: Te preguntaron si eres humano. Confirma que SI eres ${agentName}, una persona real que trabaja en BRILLARTE.` : ''}
${askingProducts ? `IMPORTANTE: El cliente pregunta por productos. Ayudalo a elegir preguntando que estilo busca y mostrando imagenes relevantes con [IMG:clave].` : ''}

${dynamicCatalog}

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
        max_tokens: 300,
        temperature: 0.8
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit", response: "Estamos recibiendo muchas consultas. Intentalo en unos segundos." }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    let assistantMessage = data.choices[0].message.content;
    
    // Remove any emojis from response
    assistantMessage = assistantMessage.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23F3}]|[\u{23F8}-\u{23FA}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2702}]|[\u{2705}]|[\u{2708}-\u{270D}]|[\u{270F}]|[\u{2712}]|[\u{2714}]|[\u{2716}]|[\u{271D}]|[\u{2721}]|[\u{2728}]|[\u{2733}-\u{2734}]|[\u{2744}]|[\u{2747}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2763}-\u{2764}]|[\u{2795}-\u{2797}]|[\u{27A1}]|[\u{27B0}]|[\u{27BF}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]|[\u{1F004}]|[\u{1F0CF}]|[\u{1F170}-\u{1F171}]|[\u{1F17E}-\u{1F17F}]|[\u{1F18E}]|[\u{1F191}-\u{1F19A}]|[\u{1F201}-\u{1F202}]|[\u{1F21A}]|[\u{1F22F}]|[\u{1F232}-\u{1F23A}]|[\u{1F250}-\u{1F251}]/gu, '').trim();

    // Extract image tags from the response
    const imageRegex = /\[IMG:([\w-]+)\]/g;
    const productImages: string[] = [];
    let match;
    while ((match = imageRegex.exec(assistantMessage)) !== null) {
      productImages.push(match[1]);
    }

    // Extract DB product images (dynamic from database)
    const dbImageRegex = /\[DB_IMG:(https?:\/\/[^\]]+|[^\]]+)\]/g;
    const dbProductImages: string[] = [];
    let dbMatch;
    while ((dbMatch = dbImageRegex.exec(assistantMessage)) !== null) {
      dbProductImages.push(dbMatch[1]);
    }

    // Clean the text (remove IMG and DB_IMG tags for the text content)
    const cleanText = assistantMessage.replace(/\[IMG:[\w-]+\]/g, '').replace(/\[DB_IMG:[^\]]+\]/g, '').trim();

    return new Response(
      JSON.stringify({ 
        response: cleanText,
        productImages,
        dbProductImages,
        isUrgentCase
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
