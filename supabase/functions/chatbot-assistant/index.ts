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
    const { messages, email, orderCode, userId, imageUrl } = await req.json();
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

    // Buscar perfil del usuario
    let userProfile = null;
    let isAgent = false;
    if (userId) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      userProfile = data;
      
      // Check if user is verified (official agent)
      isAgent = data?.verificado === true;
    }

    // Detectar intenciones en el ultimo mensaje
    const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
    let actionTaken = null;
    let ticketCreated = null;
    let agentData = null;

    // Si es un agente verificado, permitir consultas especiales
    if (isAgent) {
      // Consultar códigos de pago usados
      if (lastMessage.includes('codigos usados') || lastMessage.includes('códigos usados') || 
          lastMessage.includes('codigos de pago') || lastMessage.includes('códigos de pago')) {
        const { data: codigosUsados } = await supabase
          .from('codigos_pago')
          .select('codigo, usado_at, usado_por')
          .eq('usado', true)
          .order('usado_at', { ascending: false })
          .limit(10);

        if (codigosUsados && codigosUsados.length > 0) {
          const codigosList = codigosUsados.map(c => 
            `- ${c.codigo} (usado el ${new Date(c.usado_at).toLocaleDateString()})`
          ).join('\n');
          agentData = `CODIGOS DE PAGO USADOS (ultimos 10):\n${codigosList}`;
        } else {
          agentData = 'No hay codigos de pago usados recientemente.';
        }
        actionTaken = 'CONSULTA_AGENTE';
      }

      // Consultar códigos disponibles
      if (lastMessage.includes('codigos disponibles') || lastMessage.includes('códigos disponibles')) {
        const { data: codigosDisponibles } = await supabase
          .from('codigos_pago')
          .select('codigo')
          .eq('usado', false);

        if (codigosDisponibles && codigosDisponibles.length > 0) {
          const codigosList = codigosDisponibles.map(c => `- ${c.codigo}`).join('\n');
          agentData = `CODIGOS DE PAGO DISPONIBLES:\n${codigosList}`;
        } else {
          agentData = 'No hay codigos de pago disponibles. Se generaran automaticamente.';
        }
        actionTaken = 'CONSULTA_AGENTE';
      }

      // Consultar solicitudes pendientes
      if (lastMessage.includes('solicitudes pendientes') || lastMessage.includes('pendientes')) {
        const { data: solicitudesPendientes } = await supabase
          .from('solicitudes_ia')
          .select('tipo, descripcion, created_at')
          .eq('estado', 'pendiente')
          .order('created_at', { ascending: false })
          .limit(5);

        if (solicitudesPendientes && solicitudesPendientes.length > 0) {
          const solList = solicitudesPendientes.map(s => 
            `- ${s.tipo.toUpperCase()}: ${s.descripcion.slice(0, 50)}...`
          ).join('\n');
          agentData = `SOLICITUDES PENDIENTES:\n${solList}`;
        } else {
          agentData = 'No hay solicitudes pendientes.';
        }
        actionTaken = 'CONSULTA_AGENTE';
      }
    }

    // Detectar solicitud de credito (solo para usuarios verificados)
    if (lastMessage.includes('credito') || lastMessage.includes('crédito') || 
        lastMessage.includes('solicitar credito') || lastMessage.includes('quiero credito')) {
      if (userId && userProfile?.verificado) {
        const { data: solicitud, error } = await supabase
          .from('solicitudes_ia')
          .insert({
            user_id: userId,
            tipo: 'credito',
            descripcion: `Solicitud de credito via chatbot. Mensaje: "${messages[messages.length - 1]?.content}"`,
            monto: null
          })
          .select()
          .single();

        if (!error) {
          actionTaken = 'SOLICITUD_CREDITO';
          
          const { data: brillarteProfile } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('correo', 'oficial@brillarte.lat')
            .single();

          if (brillarteProfile) {
            await supabase.from('notifications').insert({
              user_id: brillarteProfile.user_id,
              tipo: 'solicitud_credito',
              titulo: 'Nueva solicitud de credito',
              mensaje: `${userProfile?.nombre_completo || email} ha solicitado credito`,
              accion_url: '/admin/solicitudes-ia'
            });
          }
        }
      }
    }

    // Detectar solicitud de reembolso - mejorado para recopilar más información
    if (lastMessage.includes('reembolso') || lastMessage.includes('devolucion') || 
        lastMessage.includes('devolver dinero') || lastMessage.includes('me devuelvan') ||
        lastMessage.includes('devolver') || lastMessage.includes('reembolsar')) {
      if (userId) {
        // Crear solicitud de reembolso con información adicional
        const { data: solicitud, error } = await supabase
          .from('solicitudes_ia')
          .insert({
            user_id: userId,
            tipo: 'reembolso',
            descripcion: `Solicitud de reembolso via chatbot. Pedido: ${orderCode || 'No especificado'}. Mensaje: "${messages[messages.length - 1]?.content}"${imageUrl ? `. Imagen adjunta: ${imageUrl}` : ''}`,
            monto: null
          })
          .select()
          .single();

        if (!error) {
          actionTaken = 'SOLICITUD_REEMBOLSO';
          
          // Notificar a admin
          const { data: brillarteProfile } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('correo', 'oficial@brillarte.lat')
            .single();

          if (brillarteProfile) {
            await supabase.from('notifications').insert({
              user_id: brillarteProfile.user_id,
              tipo: 'solicitud_reembolso',
              titulo: 'Nueva solicitud de reembolso',
              mensaje: `${userProfile?.nombre_completo || email} solicita reembolso${orderCode ? ` para pedido ${orderCode}` : ''}`,
              accion_url: '/admin/solicitudes-ia'
            });
          }
        }
      }
    }

    // Detectar problemas que requieren ticket
    const ticketKeywords = ['problema', 'ayuda', 'no funciona', 'error', 'queja', 'reclamo', 
                           'no llego', 'no llegó', 'defectuoso', 'roto', 'malo', 'incorrecto'];
    const needsTicket = ticketKeywords.some(keyword => lastMessage.includes(keyword));

    if (needsTicket && userId && !actionTaken) {
      const { data: ticket, error } = await supabase
        .from('tickets_ayuda')
        .insert({
          user_id: userId,
          asunto: `Ticket automatico - ${orderCode ? `Pedido ${orderCode}` : 'Consulta general'}`,
          descripcion: messages[messages.length - 1]?.content || 'Sin descripcion',
          estado: 'Abierto',
          prioridad: 'Media',
          categoria: 'chatbot',
          codigo_membresia: userProfile?.codigo_membresia
        })
        .select()
        .single();

      if (!error && ticket) {
        ticketCreated = ticket;
        actionTaken = 'TICKET_CREADO';

        await supabase.from('respuestas_tickets').insert({
          ticket_id: ticket.id,
          mensaje: 'Ticket creado automaticamente por el asistente virtual. Un agente revisara tu caso pronto.',
          es_admin: true
        });
      }
    }

    // Construir system prompt mejorado
    let systemPrompt = '';
    
    if (isAgent) {
      systemPrompt = `Eres el asistente de BRILLARTE para AGENTES.

${agentData ? `DATOS:\n${agentData}` : ''}

REGLAS ESTRICTAS:
- Maximo 2 oraciones por respuesta
- NUNCA uses emojis, asteriscos ni simbolos decorativos
- Respuestas directas y profesionales
- Datos exactos sin adornos`;
    } else {
      systemPrompt = `Eres el asistente de BRILLARTE.

INFO EMPRESA:
- Productos: Pulseras, aretes, monederos artesanales
- Santiago, RD | WhatsApp: 849-425-2220 | Lun-Vie 9AM-6PM
- Pagos: Codigos prepago, contra entrega, retiro en tienda
- Envios: Vimenpaq

REGLAS ESTRICTAS:
- Maximo 2 oraciones por respuesta
- NUNCA uses emojis, asteriscos, ni simbolos decorativos
- Respuestas directas y naturales
- Entiende lenguaje informal, errores de escritura, jerga dominicana
- Si no entiendes algo, pide aclaracion brevemente
- Para reembolsos: pregunta problema y codigo de pedido`;
    }

    systemPrompt += `

${actionTaken === 'SOLICITUD_CREDITO' ? 'ACCION: Se registro solicitud de credito. Informar que sera revisada por el equipo.' : ''}
${actionTaken === 'SOLICITUD_REEMBOLSO' ? 'ACCION: Se registro solicitud de reembolso. Informar que sera revisada por un agente. Pregunta si desea agregar mas informacion o imagenes.' : ''}
${actionTaken === 'TICKET_CREADO' ? `ACCION: Se creo ticket #${ticketCreated?.id?.slice(0, 8)}. Informar que un agente lo atendera pronto.` : ''}
${actionTaken === 'CONSULTA_AGENTE' ? 'ACCION: Consulta de agente procesada. Muestra los datos solicitados.' : ''}

Cliente: ${email}
${userProfile ? `Nombre: ${userProfile.nombre_completo}` : ''}
${userProfile?.verificado ? 'Estado: Cuenta verificada (AGENTE BRILLARTE)' : ''}
${userProfile?.saldo ? `Saldo: RD$${userProfile.saldo}` : ''}
${orderInfo}`;

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
    const assistantMessage = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ 
        response: assistantMessage,
        action: actionTaken,
        ticketId: ticketCreated?.id,
        isAgent
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