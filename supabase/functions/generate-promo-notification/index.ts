import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PromoRequest {
  titulo: string;
  descripcion: string;
  imagen_url?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { titulo, descripcion, imagen_url }: PromoRequest = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY no configurada");
    }

    // Generar texto atractivo con IA para la notificación
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: `Genera un mensaje corto y atractivo (máximo 100 caracteres) para invitar a participar en esta promoción de Brillarte (marca de bisutería). 

Título: ${titulo}
Descripción: ${descripcion}

El mensaje debe ser emocionante, usar emojis relevantes y motivar a participar. Debe ser directo y llamativo como notificación push.`
          }
        ],
        max_tokens: 100,
        temperature: 0.8
      })
    });

    if (!aiResponse.ok) {
      throw new Error(`Error en IA: ${aiResponse.statusText}`);
    }

    const aiData = await aiResponse.json();
    const mensajeGenerado = aiData.choices[0]?.message?.content || 
      `🎉 ¡Nueva promoción de Brillarte! ${titulo} - ¡Participa ahora!`;

    return new Response(
      JSON.stringify({ 
        mensaje: mensajeGenerado.trim(),
        success: true 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error generando notificación:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
