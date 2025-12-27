import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      contenido, 
      autorId, 
      autorNombre,
      postId,
      tipo = 'post' // 'post' o 'respuesta'
    } = await req.json();

    console.log('Procesando menciones en:', { contenido, autorId, tipo });

    // Extraer menciones del contenido (@identificador)
    const mentionRegex = /@([a-z0-9.]+)/gi;
    const matches = contenido.match(mentionRegex);
    
    if (!matches || matches.length === 0) {
      console.log('No se encontraron menciones');
      return new Response(
        JSON.stringify({ success: true, mentions: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limpiar identificadores y eliminar duplicados
    const identificadores = [...new Set(
      matches.map((m: string) => m.substring(1).toLowerCase())
    )];

    console.log('Identificadores encontrados:', identificadores);

    // Buscar usuarios por identificador
    const { data: usuarios, error: usersError } = await supabaseClient
      .from('profiles')
      .select('user_id, identificador, nombre_completo')
      .in('identificador', identificadores);

    if (usersError) {
      console.error('Error buscando usuarios:', usersError);
      throw usersError;
    }

    console.log('Usuarios encontrados:', usuarios);

    // Filtrar para no notificar al autor
    const usuariosANotificar = (usuarios || []).filter(
      u => u.user_id !== autorId
    );

    // Crear notificaciones para cada usuario mencionado
    const notificaciones = usuariosANotificar.map(usuario => ({
      user_id: usuario.user_id,
      tipo: 'mencion_comunidad',
      titulo: 'Te mencionaron en la comunidad',
      mensaje: `${autorNombre} te mencionó en ${tipo === 'post' ? 'una publicación' : 'una respuesta'}`,
      accion_url: `/comunidad#post-${postId}`,
      imagen_url: null
    }));

    if (notificaciones.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('notifications')
        .insert(notificaciones);

      if (insertError) {
        console.error('Error creando notificaciones:', insertError);
        throw insertError;
      }

      console.log(`Se crearon ${notificaciones.length} notificaciones de mención`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        mentions: notificaciones.length,
        usuarios: usuariosANotificar.map(u => u.identificador)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en notify-mention:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
