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

    const { postId, userName, contenido } = await req.json();

    console.log('Notifying Brillarte about new post:', postId);

    // Get Brillarte admin user
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('correo', 'oficial@brillarte.lat')
      .single();

    if (adminProfile) {
      // Create notification for Brillarte account
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: adminProfile.user_id,
          tipo: 'comunidad',
          titulo: 'Nueva publicación en la comunidad',
          mensaje: `${userName} ha publicado: "${contenido.substring(0, 100)}${contenido.length > 100 ? '...' : ''}"`,
          accion_url: '/comunidad',
          leido: false
        });

      if (notifError) throw notifError;
    }

    console.log('Notification sent successfully');

    return new Response(
      JSON.stringify({ success: true }),
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