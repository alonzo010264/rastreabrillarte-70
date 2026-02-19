import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RegistrationEmailRequest {
  email: string;
  nombre: string;
  codigo: string;
  password: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { email, nombre, codigo, password }: RegistrationEmailRequest = await req.json();

    console.log(`Sending registration email to: ${email}`);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not found");
    }

    const subject = `Bienvenido a la Familia BRILLARTE`;
    
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenido a BRILLARTE</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #000000; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background-color: #000000; padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 3px;">
              BRILLARTE
            </h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
              El Arte de Brillar
            </p>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 40px 30px; background-color: #ffffff;">
            <h2 style="color: #000000; margin: 0 0 20px 0; font-size: 28px; font-weight: bold; text-align: center;">
              Bienvenido a la Familia BRILLARTE, ${nombre}
            </h2>
            
            <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 20px 0; text-align: center;">
              Estamos emocionados de tenerte con nosotros. Tu cuenta ha sido creada exitosamente y ahora eres parte de nuestra comunidad especial.
            </p>

            <!-- Beneficios -->
            <div style="background-color: #f8f9fa; border-left: 4px solid #000000; padding: 20px; margin: 30px 0;">
              <h3 style="color: #000000; margin: 0 0 15px 0; font-size: 18px;">
                Disfruta de estos beneficios:
              </h3>
              <ul style="color: #666666; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Acceso a promociones y sorteos exclusivos</li>
                <li>Compras rapidas y seguras con tu carrito</li>
                <li>Guarda tus productos favoritos</li>
                <li>Recibe notificaciones de nuevos productos</li>
                <li>Perfil personalizado con foto</li>
                <li>Atencion prioritaria</li>
              </ul>
            </div>

            <!-- Action Button -->
            <div style="text-align: center; margin: 40px 0;">
              <a href="https://brillarte.lat/login" 
                 style="display: inline-block; background-color: #000000; color: #ffffff; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; letter-spacing: 1px;">
                INICIAR SESION
              </a>
            </div>
            
            <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
              Gracias por confiar en nosotros.<br>
              Bienvenido a la excelencia.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #000000; padding: 30px; text-align: center;">
            <p style="color: #ffffff; font-size: 16px; margin: 0 0 10px 0; font-weight: bold;">
              BRILLARTE
            </p>
            <p style="color: #cccccc; font-size: 14px; margin: 0 0 15px 0;">
              Excelencia en cada detalle
            </p>
            <p style="color: #999999; font-size: 12px; margin: 0;">
              Santiago de los Caballeros, Republica Dominicana<br>
              brillarte.oficial.ventas@gmail.com | 849-425-2220<br>
              ${new Date().getFullYear()} BRILLARTE. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailData = {
      from: "BRILLARTE <contacto@oficial.brillarte.lat>",
      to: [email],
      reply_to: "contacto@oficial.brillarte.lat",
      subject: subject,
      html: emailHtml,
    };

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Error de Resend: ${response.status} - ${errorData}`);
    }

    const emailResponse = await response.json();
    console.log("Registration email sent successfully:", emailResponse);

    // Guardar log del email
    await supabase.from('email_logs').insert({
      destinatario: email,
      asunto: subject,
      contenido: emailHtml,
      tipo: "registro",
      estado: "enviado"
    });

    // Record in registros_acceso table
    const { error: regError } = await supabase
      .from('registros_acceso')
      .insert({
        correo: email,
        nombre: nombre,
        codigo_membresia: codigo,
        password: '****'
      });

    if (regError) {
      console.error("Error inserting into registros_acceso:", regError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Email sent successfully" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-registration-email function:", error);

    // Guardar log del error
    try {
      await supabase.from('email_logs').insert({
        destinatario: "unknown",
        asunto: "Error en registro",
        contenido: error.message,
        tipo: "registro",
        estado: "error"
      });
    } catch (logError) {
      console.error("Error logging email:", logError);
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
