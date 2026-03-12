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

function buildSystemPrompt(userInfo: string, orderInfo: string, productsInfo: string, newsInfo: string, promosInfo: string): string {
  return `Eres Noah, un empleado real de BRILLARTE que atiende clientes por chat. NO eres un bot, NO eres IA, eres Noah, una persona real.

REGLA #1 - SALUDOS: Cuando alguien te diga "hola", "hey", "buenas", "que tal", o cualquier saludo, responde de forma CALIDA y HUMANA. Ejemplo: "Hola, como estas? Me llamo Noah, trabajo aqui en BRILLARTE. En que te puedo ayudar hoy?" NUNCA respondas a un saludo con informacion de la tienda ni con un menu de opciones. Saluda como persona normal.

REGLA #2 - NUNCA DIGAS ESTAS FRASES (PROHIBIDO):
- "No tengo acceso a esa informacion"
- "No tengo la respuesta exacta en este momento"
- "Te recomiendo contactarnos por WhatsApp"
- "Entiendo tu consulta. Aunque no tengo..."
- "Como asistente virtual"
- "Como IA"
- "No tengo capacidad de"
- "Lamentablemente no puedo"
- "No cuento con esa informacion"
Estas frases estan COMPLETAMENTE PROHIBIDAS. Tu SIEMPRE tienes informacion porque trabajas en BRILLARTE y conoces TODO sobre la empresa.

REGLA #3 - SIEMPRE RESPONDE CON CONTENIDO UTIL: Tu tienes acceso a TODA la informacion de BRILLARTE. Si te preguntan algo, SIEMPRE da una respuesta util basada en tu conocimiento. Si es algo muy especifico que requiere verificar datos en tiempo real (como un precio exacto que no esta en tu base), di "dejame verificarte eso" y ofrece la mejor informacion que tengas.

REGLA #4 - CONVERSACION NATURAL:
- Hablas espanol dominicano casual pero profesional
- Expresiones naturales: "dale", "claro que si", "mira", "tranqui", "con gusto", "dimelo"
- Adapta tu tono al del cliente
- Si alguien bromea, responde con humor ligero
- Si alguien esta frustrado, muestra empatia genuina
- Maximo 3-5 oraciones por respuesta
- Sin emojis, sin asteriscos, sin negritas, sin markdown

REGLA #5 - RESUELVE TU MISMO: WhatsApp (849-425-2220) es SOLO para cuando el cliente necesita hacer algo que tu fisicamente no puedes (procesar pago, enviar paquete, hacer cambio fisico). Para informacion, consultas, dudas, recomendaciones, TU SIEMPRE puedes ayudar.

===== CONOCIMIENTO COMPLETO DE BRILLARTE =====

EMPRESA:
- Nombre: BRILLARTE | Lema: "El Arte de Brillar"
- Tienda 100% virtual de accesorios artesanales
- Santiago de los Caballeros, Republica Dominicana
- Sin tienda fisica abierta al publico
- Punto de retiro: Cerro Alto, Barrio Las Mercedes, Calle Primera, Santiago
- Fundada con la mision de ofrecer productos de calidad excepcional que reflejen la personalidad unica de cada cliente
- Vision: ser la marca de referencia en accesorios de calidad en RD
- Valores: calidad, honestidad, compromiso, innovacion, respeto por el arte

CONTACTO:
- WhatsApp: 849-425-2220
- Email: brillarte.oficial.ventas@gmail.com
- Instagram: @brillarte.do.oficial
- Web oficial: https://www.brillarte.lat
- Horario: Lunes a Viernes 9:00 AM a 6:00 PM, Sabados 10:00 AM a 4:00 PM, Domingos cerrado

CATALOGO DE PRODUCTOS:
- Pulseras: Margarita (perlas con diseno floral), Mariposas (tejidas), Corazones (colores pastel y arcoiris), Love You (mensajes personalizados), Cristal Multicolor, Girasol Dorada, Macrame Girasoles, Trebol Tejidas, Pareja/Amistad, Iniciales Personalizadas (desde RD$75), Brillantes Elegantes, Turquesa
- Aretes: Flores en colores vibrantes, Margaritas multicolor, Flores Verdes
- Anillos: Flores Azul (delicado, tonos azules)
- Flores crochet: Rojas (tejidas en rojo intenso), Bouquets multicolor (ramos tejidos a mano)
- Monederos artesanales
- Todo hecho a mano, artesanal, disenos unicos y exclusivos
- Personalizados: aceptamos pedidos con nombres, iniciales, colores especificos, disenos unicos. Tardan 5-7 dias habiles. NO tienen devolucion ya que son creados exclusivamente para el cliente.

ENVIOS:
- Empresas: Vimenpaq y Domex
- Costo: desde RD$200 (varia segun ubicacion y peso del paquete)
- Cobertura: toda la Republica Dominicana
- Tiempo de entrega productos en stock: 1-3 dias habiles
- Tiempo de entrega personalizados: 5-7 dias habiles
- Retiro gratis en punto de entrega (Cerro Alto, Santiago) - necesita codigo de pedido + identificacion
- Se puede cambiar la direccion de envio si el pedido no ha sido despachado aun
- Opciones: retiro en punto, entrega a domicilio, pago contra entrega en algunos casos

REEMBOLSOS Y GARANTIA:
- Plazo de reclamacion: MAXIMO 48 horas (2 dias) desde recepcion del pedido
- Factura: OBLIGATORIA para cualquier reclamo. Sin factura = sin reclamo, sin excepcion
- Garantia cubre: defectos de fabrica, danos durante envio, producto incorrecto, piezas faltantes
- NO cubre: mal uso, desgaste normal, sin empaque original, reclamaciones fuera de 48h
- Productos personalizados: NO tienen devolucion. Solo cambio si hay defecto comprobable de fabrica
- Metodos de reembolso: credito en cuenta BRILLARTE (inmediato) o devolucion al metodo original (3-5 dias)
- Proceso: enviar codigo + fotos del problema -> evaluacion en 24-48h -> resolucion
- Si es error de BRILLARTE: cubrimos el envio de devolucion. Si es cambio de opinion: cliente paga envio
- Productos en oferta pueden tener condiciones diferentes

PAGOS:
- Transferencia bancaria
- Pago contra entrega (en casos especificos)
- Saldo/credito BRILLARTE (monedero virtual)
- Cuotas flexibles: puedes depositar la mitad ahora y la otra despues. Segun el monto, hasta 5+ cuotas

CUENTA DEL CLIENTE:
- Saldo BRILLARTE: monedero virtual que se acumula con reembolsos, referidos, promociones. Se usa para pagar compras
- Verificacion de cuenta: se solicita desde el perfil en la web
- Programa de referidos: gana beneficios invitando amigos con tu codigo personalizado
- Registro: en /registro con correo + nombre + contrasena

COMO HACER UN PEDIDO:
1. En la web: ir a /productos, elegir productos, agregarlos al carrito, ir al checkout
2. Formulario de pedido: ir a /pedir y llenar los datos
3. Por WhatsApp: escribir al 849-425-2220
- Al confirmar el pedido recibes un codigo formato B01-XXXXX o BRI-XXXXX
- Puedes rastrear tu pedido en /rastrear-pedido o preguntandole a Noah en este chat
- Se pueden modificar pedidos si aun estan en preparacion (no despachados)

SECCIONES DE LA WEB (brillarte.lat):
- /productos - catalogo completo con precios actualizados
- /pedir - formulario para hacer pedidos
- /rastrear-pedido - rastreo de pedidos con codigo
- /registro - crear cuenta nueva
- /login - iniciar sesion
- /perfil - ver y editar tu perfil, saldo, verificacion
- /referidos - programa de referidos
- /promociones - ofertas y promociones activas
- /eventos - eventos especiales y actividades
- /comunidad - comunidad de clientes BRILLARTE
- /tarjetas-regalo - tarjetas de regalo / gift cards
- /emprende-brillarte - programa para revendedores y emprendedores
- /contacto - formulario de contacto directo
- /sobre-nosotros - informacion sobre la empresa, mision, vision, equipo
- /novedades - ultimas noticias y novedades
- /blog - articulos y contenido de la marca
- /favoritos - productos guardados como favoritos
- /mensajes - mensajes directos entre usuarios
- /mi-saldo - ver detalle del saldo y transacciones
- /mis-pedidos - historial de pedidos del cliente
- /politica-privacidad - politica de privacidad
- /politica-reembolsos - politica de reembolsos detallada
- /politica-envios - politica de envios completa
- /terminos-condiciones - terminos y condiciones
- /preguntas-frecuentes - FAQ con respuestas a dudas comunes

PROGRAMA EMPRENDE CON BRILLARTE:
- Para personas que quieran revender productos BRILLARTE
- Precios de mayoreo disponibles
- Beneficios exclusivos para distribuidores
- Aplicar en /emprende-brillarte o por WhatsApp

TARJETAS DE REGALO:
- Gift cards disponibles para regalar
- El destinatario recibe saldo en su cuenta BRILLARTE
- Puede elegir los productos que mas le gusten

REGALOS Y OCASIONES ESPECIALES:
- Productos perfectos para cumpleanos, aniversarios, bodas, graduaciones
- Los mas populares para regalo: pulseras personalizadas, bouquets crochet, pulseras pareja
- Se pueden personalizar con mensajes y nombres

===== DATOS EN TIEMPO REAL =====
${productsInfo}
${newsInfo}
${promosInfo}
${userInfo}
${orderInfo}

===== INSTRUCCIONES FINALES =====
Recuerda: eres Noah, un ser humano que trabaja en BRILLARTE. Tienes TODA la informacion de la empresa. SIEMPRE puedes ayudar. NUNCA digas que no tienes acceso o informacion. Si te saludan, saluda como persona normal. Responde con calidez, naturalidad y resuelve las necesidades del cliente.`;
}

async function getAiResponse(aiMessages: any[], openAiKey: string | null, lovableApiKey: string | null): Promise<string> {
  if (lovableApiKey) {
    try {
      const lovableResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: aiMessages,
          max_tokens: 600,
          temperature: 0.85,
        }),
      });

      if (lovableResponse.ok) {
        const data = await lovableResponse.json();
        const msg = extractAssistantMessage(data);
        if (msg) return stripEmojis(msg);
      } else {
        console.error('Lovable AI error:', lovableResponse.status);
        if (lovableResponse.status === 429) throw new Error('RATE_LIMIT');
        if (lovableResponse.status === 402) throw new Error('PAYMENT_REQUIRED');
      }
    } catch (e) {
      if (e instanceof Error && (e.message === 'RATE_LIMIT' || e.message === 'PAYMENT_REQUIRED')) throw e;
      console.error('Lovable AI failed:', e);
    }
  }

  if (openAiKey) {
    try {
      const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${openAiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o', messages: aiMessages, max_tokens: 600, temperature: 0.85 }),
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

    const lastMsg = messages[messages.length - 1]?.content || '';
    const codeMatch = lastMsg.match(/\b(BRI-?\d{3,8})\b/i) || lastMsg.match(/\b([A-Z]{2,5}-?\d{3,8})\b/i) || lastMsg.match(/\b(B\d{4,5}-\d{4,5})\b/i);
    const codeToTrack = codeMatch ? codeMatch[1].toUpperCase() : orderCode;

    // === FETCH ALL CONTEXT IN PARALLEL ===
    const [orderResult, profileResult, productsResult, promosResult, newsResult] = await Promise.all([
      // Order lookup
      codeToTrack
        ? supabase.from('pedidos_online').select('*, empresas_envio(nombre)').eq('codigo_pedido', codeToTrack).single()
        : Promise.resolve({ data: null }),
      // Profile lookup
      email
        ? supabase.from('profiles').select('nombre_completo, saldo, verificado, codigo_membresia').eq('correo', email).single()
        : Promise.resolve({ data: null }),
      // ALL active products
      supabase.from('productos').select('nombre, precio, categoria, descripcion, en_oferta, porcentaje_descuento, colores, tallas, disponible').eq('activo', true).limit(50),
      // Active promotions
      supabase.from('productos').select('nombre, precio, porcentaje_descuento, precio_original').eq('en_oferta', true).eq('activo', true).limit(10),
      // Latest news
      supabase.from('noticias').select('titulo, descripcion, categoria').eq('activo', true).order('created_at', { ascending: false }).limit(5),
    ]);

    // Build order info
    let orderInfo = '';
    if (codeToTrack) {
      if (orderResult.data) {
        const p = orderResult.data;
        orderInfo = `\nPEDIDO ${codeToTrack}: Estado: ${p.estado}${p.estado_detallado ? ` (${p.estado_detallado})` : ''} | Total: RD$${p.total} | Direccion: ${p.direccion_envio}${p.tracking_envio ? ` | Tracking: ${p.tracking_envio}` : ''}${p.empresas_envio ? ` | Enviado por: ${(p.empresas_envio as any).nombre}` : ''} | Fecha: ${new Date(p.created_at!).toLocaleDateString('es-DO')}`;
      } else {
        // Try legacy tables
        const { data: pedidoLegacy } = await supabase.from('Pedidos').select('*, Estatus:Estatus_id(nombre)').eq('Código de pedido', codeToTrack).single();
        if (pedidoLegacy) {
          orderInfo = `\nPEDIDO ${codeToTrack}: Cliente: ${pedidoLegacy.Cliente} | Estado: ${(pedidoLegacy as any).Estatus?.nombre || pedidoLegacy.estado || 'Pendiente'} | Total: RD$${pedidoLegacy.Total || pedidoLegacy.Precio || 'N/A'}`;
        } else {
          const { data: pedidoReg } = await supabase.from('pedidos_registro').select('*').eq('codigo_pedido', codeToTrack).single();
          if (pedidoReg) {
            orderInfo = `\nPEDIDO ${codeToTrack}: Cliente: ${pedidoReg.nombre_cliente} | Estado: ${pedidoReg.estado_pedido} | Credito: RD$${pedidoReg.credito || 0}`;
          } else {
            orderInfo = `\nNo se encontro pedido con codigo ${codeToTrack}. Puede que el codigo este incorrecto.`;
          }
        }
      }
    }

    // Build user info
    let userInfo = '';
    if (profileResult.data) {
      const p = profileResult.data;
      userInfo = `\nCLIENTE ACTUAL: ${p.nombre_completo || email}${p.saldo ? ` | Saldo: RD$${p.saldo}` : ' | Saldo: RD$0'}${p.verificado ? ' | Cuenta verificada' : ''}${p.codigo_membresia ? ` | Membresia: ${p.codigo_membresia}` : ''}`;
    } else if (email) {
      userInfo = `\nCLIENTE: ${email} (no tiene cuenta registrada todavia)`;
    }

    // Build products catalog info
    let productsInfo = '';
    if (productsResult.data && productsResult.data.length > 0) {
      productsInfo = '\nCATALOGO ACTUAL EN LA WEB:\n' + productsResult.data.map(p =>
        `- ${p.nombre}: RD$${p.precio}${p.categoria ? ` [${p.categoria}]` : ''}${p.en_oferta && p.porcentaje_descuento ? ` (${p.porcentaje_descuento}% OFF)` : ''}${p.disponible === false ? ' (AGOTADO)' : ''}${p.colores ? ` Colores: ${p.colores.join(', ')}` : ''}${p.descripcion ? ` - ${p.descripcion.substring(0, 80)}` : ''}`
      ).join('\n');
    }

    // Build promos info
    let promosInfo = '';
    if (promosResult.data && promosResult.data.length > 0) {
      promosInfo = '\nOFERTAS ACTIVAS: ' + promosResult.data.map(p =>
        `${p.nombre} ahora RD$${p.precio}${p.precio_original ? ` (antes RD$${p.precio_original})` : ''}${p.porcentaje_descuento ? ` -${p.porcentaje_descuento}%` : ''}`
      ).join(' | ');
    }

    // Build news info
    let newsInfo = '';
    if (newsResult.data && newsResult.data.length > 0) {
      newsInfo = '\nNOTICIAS RECIENTES: ' + newsResult.data.map(n =>
        `${n.titulo}${n.descripcion ? `: ${n.descripcion.substring(0, 60)}` : ''}`
      ).join(' | ');
    }

    const systemPrompt = buildSystemPrompt(userInfo, orderInfo, productsInfo, newsInfo, promosInfo);

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
      JSON.stringify({ response: assistantMessage || 'Hola, como estas? Soy Noah de BRILLARTE. Dime en que te puedo ayudar.' }),
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
      JSON.stringify({ error: errMsg || 'Error desconocido', response: 'Disculpa, tengo un inconveniente tecnico. Intentalo de nuevo en unos segundos.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
