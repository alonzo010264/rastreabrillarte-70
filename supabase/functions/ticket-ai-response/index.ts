import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { ticketId, userId } = await req.json();

    console.log('Processing AI response for ticket:', ticketId);

    // Obtener el ticket para saber el asunto y descripción
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets_ayuda')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (ticketError) throw ticketError;

    // Obtener el perfil del usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('nombre_completo')
      .eq('user_id', userId)
      .single();

    const userName = profile?.nombre_completo || 'Usuario';

    // Asignar automáticamente un agente disponible
    const { data: availableAgents } = await supabase
      .from('ticket_agents')
      .select('id, identificador, nombre')
      .eq('activo', true);

    let assignedAgent = null;
    if (availableAgents && availableAgents.length > 0) {
      // Seleccionar un agente aleatorio
      const randomIndex = Math.floor(Math.random() * availableAgents.length);
      assignedAgent = availableAgents[randomIndex];
      
      // Actualizar el ticket con el agente asignado (guardamos el identificador)
      await supabase
        .from('tickets_ayuda')
        .update({ 
          agente_asignado_id: assignedAgent.id,
          estado: 'en_progreso'
        })
        .eq('id', ticketId);
    }

    // Crear respuesta automática de IA
    const agentName = assignedAgent?.nombre || 'uno de nuestros especialistas';
    const aiMessage = `¡Hola ${userName}! 

Gracias por contactarnos. Hemos recibido tu solicitud de ayuda sobre: "${ticket.asunto}".

${assignedAgent ? `Tu caso ha sido asignado a ${agentName}, quien` : 'Pronto uno de nuestros especialistas'} te atenderá. El tiempo de respuesta podría tardar entre 2 a 24 horas dependiendo de la complejidad de tu caso.

Estamos aquí para ayudarte.

Equipo BRILLARTE`;

    // Insertar respuesta de IA
    const { error: insertError } = await supabase
      .from('respuestas_tickets')
      .insert({
        ticket_id: ticketId,
        user_id: null,
        mensaje: aiMessage,
        es_admin: true
      });

    if (insertError) throw insertError;

    console.log('AI response created successfully for ticket:', ticketId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'AI response created',
        assignedAgent: assignedAgent?.nombre 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
