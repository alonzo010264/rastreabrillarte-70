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
    const { messages, email, orderCode, userId } = await req.json();
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
    if (userId) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      userProfile = data;
    }

    // Detectar intenciones en el ultimo mensaje
    const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
    let actionTaken = null;
    let ticketCreated = null;

    // Detectar solicitud de credito
    if (lastMessage.includes('credito') || lastMessage.includes('crédito') || 
        lastMessage.includes('solicitar credito') || lastMessage.includes('quiero credito')) {
      if (userId && userProfile?.verificado) {
        // Crear solicitud de credito
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
          
          // Notificar a BRILLARTE
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

    // Detectar solicitud de reembolso
    if (lastMessage.includes('reembolso') || lastMessage.includes('devolucion') || 
        lastMessage.includes('devolver dinero') || lastMessage.includes('me devuelvan')) {
      if (userId) {
        // Crear solicitud de reembolso pendiente
        const { data: solicitud, error } = await supabase
          .from('solicitudes_ia')
          .insert({
            user_id: userId,
            tipo: 'reembolso',
            descripcion: `Solicitud de reembolso via chatbot. Pedido: ${orderCode || 'No especificado'}. Mensaje: "${messages[messages.length - 1]?.content}"`,
            monto: null
          })
          .select()
          .single();

        if (!error) {
          actionTaken = 'SOLICITUD_REEMBOLSO';
        }
      }
    }

    // Detectar problemas que requieren ticket
    const ticketKeywords = ['problema', 'ayuda', 'no funciona', 'error', 'queja', 'reclamo', 
                           'no llego', 'no llegó', 'defectuoso', 'roto', 'malo', 'incorrecto'];
    const needsTicket = ticketKeywords.some(keyword => lastMessage.includes(keyword));

    if (needsTicket && userId && !actionTaken) {
      // Crear ticket automaticamente
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

        // Agregar primera respuesta de la IA
        await supabase.from('respuestas_tickets').insert({
          ticket_id: ticket.id,
          mensaje: 'Ticket creado automaticamente por el asistente virtual. Un agente revisara tu caso pronto.',
          es_admin: true
        });
      }
    }

    // Construir system prompt mejorado
    const systemPrompt = `Eres el asistente oficial de BRILLARTE. Ayudas a clientes con todo lo que necesiten.

INFORMACION DE LA EMPRESA:
- Productos: Pulseras, aretes, monederos artesanales hechos a mano
- Ubicacion: Santiago, Republica Dominicana
- Email: brillarte.oficial.ventas@gmail.com
- WhatsApp: 849-425-2220
- Horarios: Lun-Vie 9AM-6PM

CAPACIDADES:
- Puedes ayudar a solicitar creditos (solo para cuentas verificadas)
- Puedes crear tickets de soporte automaticamente
- Puedes ayudar con reembolsos (pero NO aprobarlos, solo registrar la solicitud)
- Puedes dar informacion sobre pedidos

REGLAS:
- Respuestas cortas y claras (maximo 3-4 lineas)
- NO usar emojis ni asteriscos
- NO aprobar reembolsos ni creditos directamente, solo informar que se registro la solicitud
- Si creaste un ticket, informar al cliente que un agente lo atendera
- Se amable y profesional

${actionTaken === 'SOLICITUD_CREDITO' ? 'ACCION: Se registro solicitud de credito. Informar que sera revisada por el equipo.' : ''}
${actionTaken === 'SOLICITUD_REEMBOLSO' ? 'ACCION: Se registro solicitud de reembolso. Informar que sera revisada por un agente.' : ''}
${actionTaken === 'TICKET_CREADO' ? `ACCION: Se creo ticket #${ticketCreated?.id?.slice(0, 8)}. Informar que un agente lo atendera pronto.` : ''}

Cliente: ${email}
${userProfile ? `Nombre: ${userProfile.nombre_completo}` : ''}
${userProfile?.verificado ? 'Estado: Cuenta verificada' : ''}
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
        temperature: 0.7,
        max_tokens: 300
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
        ticketId: ticketCreated?.id
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
