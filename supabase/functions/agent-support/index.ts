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
    const { action, email, codigo_pedido } = await req.json();
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === 'request_agent') {
      // Buscar agente disponible
      const { data: availableAgents } = await supabase
        .from('support_agents')
        .select('*')
        .eq('activo', true)
        .eq('ocupado', false)
        .limit(1);

      if (availableAgents && availableAgents.length > 0) {
        // Asignar agente aleatorio de los disponibles
        const agent = availableAgents[Math.floor(Math.random() * availableAgents.length)];
        
        // Marcar agente como ocupado
        await supabase
          .from('support_agents')
          .update({ ocupado: true })
          .eq('id', agent.id);

        // Agregar a cola con agente asignado
        await supabase
          .from('support_queue')
          .insert({
            email,
            codigo_pedido,
            estado: 'atendiendo',
            agente_asignado: agent.id
          });

        return new Response(
          JSON.stringify({ 
            success: true, 
            agent: agent.nombre,
            message: `${agent.nombre} se ha unido al chat. ¿En qué puedo ayudarte?`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // Todos los agentes ocupados, agregar a cola
        await supabase
          .from('support_queue')
          .insert({
            email,
            codigo_pedido,
            estado: 'esperando'
          });

        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Todos nuestros agentes están ocupados. Te hemos agregado a la cola de espera. Te atenderemos pronto.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (action === 'save_contact') {
      const { mensaje } = await req.json();
      
      await supabase
        .from('contact_requests')
        .insert({
          email,
          mensaje,
          origen: 'chat_agente'
        });

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Gracias por tu mensaje. Nos contactaremos contigo pronto a tu correo.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Acción no válida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in agent-support:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
