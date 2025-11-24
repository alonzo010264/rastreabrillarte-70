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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { postId, contenido, userEmail } = await req.json();

    console.log('Processing AI response for post:', postId);

    // Don't respond if it's from BRILLARTE official account
    if (userEmail === 'oficial@brillarte.lat') {
      console.log('Skipping AI response for official BRILLARTE account');
      return new Response(
        JSON.stringify({ success: true, message: 'Official account post, no AI response needed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Wait 30 seconds before responding
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Generate AI response
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "Eres un miembro activo de la comunidad BRILLARTE con experiencia en accesorios y joyería. Responde de forma natural, breve (máximo 2-3 oraciones), amigable y directa. NO uses emojis. Habla como una persona real que ayuda a otros en la comunidad. Si no sabes algo con certeza, sugiere contactar al equipo."
          },
          {
            role: "user",
            content: contenido
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const respuestaIA = aiData.choices[0]?.message?.content || "Lo siento, no pude generar una respuesta en este momento.";

    // Insert AI response
    const { error: insertError } = await supabase
      .from('respuestas_comunidad')
      .insert({
        post_id: postId,
        contenido: respuestaIA,
        es_ia: true,
        user_id: null
      });

    if (insertError) throw insertError;

    // Mark post as responded by AI
    const { error: updateError } = await supabase
      .from('posts_comunidad')
      .update({ respondido_por_ia: true })
      .eq('id', postId);

    if (updateError) throw updateError;

    console.log('AI response created successfully');

    return new Response(
      JSON.stringify({ success: true, respuesta: respuestaIA }),
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