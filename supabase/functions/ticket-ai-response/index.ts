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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { ticketId, userId } = await req.json();

    console.log('Processing AI response for ticket:', ticketId);

    // Obtener el ticket para saber el asunto y descripcion
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

    // Asignar automaticamente un agente disponible
    const { data: availableAgents } = await supabase
      .from('ticket_agents')
      .select('id, identificador, nombre')
      .eq('activo', true);

    let assignedAgent = null;
    if (availableAgents && availableAgents.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableAgents.length);
      assignedAgent = availableAgents[randomIndex];
      
      await supabase
        .from('tickets_ayuda')
        .update({ 
          agente_asignado_id: assignedAgent.id,
          estado: 'en_progreso'
        })
        .eq('id', ticketId);
    }

    // Determinar si el problema es complejo usando IA
    let isComplexIssue = false;
    let aiResponse = '';

    // Palabras clave que indican problemas complejos
    const complexKeywords = [
      'reembolso', 'devolucion', 'fraude', 'estafa', 'robo', 'legal',
      'demanda', 'abogado', 'urgente', 'emergencia', 'pago', 'cargo',
      'cobro indebido', 'error grave', 'perdida', 'danado', 'roto',
      'no funciona', 'no llego', 'extraviado', 'perdido'
    ];

    const ticketContent = `${ticket.asunto} ${ticket.descripcion}`.toLowerCase();
    isComplexIssue = complexKeywords.some(keyword => ticketContent.includes(keyword));

    // Si tenemos API key de Lovable, usar IA para generar respuesta
    if (lovableApiKey && !isComplexIssue) {
      try {
        console.log('Generating AI response...');
        
        const aiApiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `Eres un agente de soporte tecnico profesional de BRILLARTE, una tienda de accesorios y joyeria artesanal. 
                
REGLAS IMPORTANTES:
- NO uses emojis bajo ninguna circunstancia
- Mantente profesional y cortes
- Si el problema es complejo o requiere acceso a sistemas internos, indica que transferiras a un agente humano
- Responde en espanol
- Se conciso pero util
- Si puedes resolver el problema con informacion general, hazlo
- Si el problema requiere revision de pedidos, cambios de direccion, reembolsos u operaciones especiales, indica que un agente humano dara seguimiento
- Firma como "Equipo de Soporte BRILLARTE"

Informacion sobre BRILLARTE:
- Horario de atencion: Lunes a Viernes 9am-6pm
- Tiempo de envio: 3-5 dias habiles
- Politica de devolucion: 30 dias para cambios
- Contacto: soporte@brillarte.lat`
              },
              {
                role: 'user',
                content: `El cliente ${userName} ha creado un ticket con:
Asunto: ${ticket.asunto}
Descripcion: ${ticket.descripcion}
Prioridad: ${ticket.prioridad}

Genera una respuesta util para este ticket.`
              }
            ],
            temperature: 0.7,
            max_tokens: 500
          }),
        });

        if (aiApiResponse.ok) {
          const aiData = await aiApiResponse.json();
          aiResponse = aiData.choices?.[0]?.message?.content || '';
          
          // Verificar si la IA sugiere transferir a humano
          if (aiResponse.toLowerCase().includes('agente humano') || 
              aiResponse.toLowerCase().includes('transferir') ||
              aiResponse.toLowerCase().includes('especialista')) {
            isComplexIssue = true;
          }
        }
      } catch (aiError) {
        console.error('Error calling AI:', aiError);
      }
    }

    // Construir mensaje final
    let finalMessage = '';
    const agentName = assignedAgent?.nombre || 'nuestro equipo de soporte';

    if (isComplexIssue) {
      finalMessage = `Hola ${userName},

Gracias por contactar al equipo de soporte de BRILLARTE. Hemos recibido tu solicitud sobre: "${ticket.asunto}".

Debido a la naturaleza de tu consulta, tu caso ha sido asignado a ${agentName} para revision personal. Un agente humano se pondra en contacto contigo en las proximas 24-48 horas habiles para darte una solucion adecuada.

Numero de ticket: ${ticketId.slice(0, 8).toUpperCase()}
Prioridad: ${ticket.prioridad}

Mientras tanto, si tienes informacion adicional que pueda ayudarnos a resolver tu caso mas rapidamente, puedes agregarla aqui.

Equipo de Soporte BRILLARTE`;
    } else if (aiResponse) {
      finalMessage = aiResponse;
    } else {
      finalMessage = `Hola ${userName},

Gracias por contactar al equipo de soporte de BRILLARTE. Hemos recibido tu solicitud sobre: "${ticket.asunto}".

${assignedAgent ? `Tu caso ha sido asignado a ${agentName}, quien` : 'Pronto uno de nuestros especialistas'} te atendera. El tiempo de respuesta estimado es de 2 a 24 horas dependiendo de la complejidad de tu caso.

Numero de ticket: ${ticketId.slice(0, 8).toUpperCase()}

Equipo de Soporte BRILLARTE`;
    }

    // Insertar respuesta
    const { error: insertError } = await supabase
      .from('respuestas_tickets')
      .insert({
        ticket_id: ticketId,
        user_id: null,
        mensaje: finalMessage,
        es_admin: true
      });

    if (insertError) throw insertError;

    console.log('AI response created successfully for ticket:', ticketId, 'Complex issue:', isComplexIssue);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'AI response created',
        assignedAgent: assignedAgent?.nombre,
        isComplexIssue
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