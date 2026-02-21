import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOGO_URL = "https://ahjibuqgthghrykzrrfj.supabase.co/storage/v1/object/public/email-assets/brillarte-logo.jpg";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { targetUserId } = await req.json();

    if (!targetUserId) {
      return new Response(JSON.stringify({ error: "targetUserId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("correo, nombre_completo")
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (!profile?.correo) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const nombre = profile.nombre_completo || "Cliente";

    const emailResponse = await resend.emails.send({
      from: "BRILLARTE <no-reply@oficial.brillarte.lat>",
      to: [profile.correo],
      subject: "💬 BRILLARTE quiere hablar contigo",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fff;">
          <div style="text-align: center; padding: 30px 20px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);">
            <img src="${LOGO_URL}" alt="BRILLARTE" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;" />
            <h1 style="color: #fff; margin: 15px 0 5px; font-size: 24px;">BRILLARTE</h1>
          </div>
          
          <div style="padding: 30px 20px;">
            <h2 style="color: #1a1a2e; margin-bottom: 15px;">¡Hola ${nombre}! 👋</h2>
            <p style="color: #444; font-size: 16px; line-height: 1.6;">
              La cuenta oficial de <strong>BRILLARTE</strong> ha iniciado una conversación contigo. 
              Puede ser sobre promociones, premios, tu pedido u otra información importante.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://brillarte.lovable.app/mensajes" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 35px; border-radius: 25px; font-weight: bold; font-size: 16px;">
                Ver mi mensaje
              </a>
            </div>
            <p style="color: #888; font-size: 13px; text-align: center;">
              Inicia sesión en tu cuenta para leer y responder el mensaje.
            </p>
          </div>
          
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} BRILLARTE. Todos los derechos reservados.
            </p>
          </div>
        </div>
      `,
    });

    console.log("Email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
