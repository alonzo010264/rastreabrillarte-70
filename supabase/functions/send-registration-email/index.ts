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

  try {
    const { email, nombre, codigo, password }: RegistrationEmailRequest = await req.json();

    console.log(`Sending registration email to: ${email}`);

    // Initialize Supabase client with service role for inserting into registros_acceso
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not found");
    }

    const subject = `¡Bienvenido a BRILLARTE! - Tus Datos de Acceso`;
    
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
              ¡Bienvenido, ${nombre}!
            </h2>
            
            <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 20px 0;">
              Gracias por unirte a la familia BRILLARTE. Tu cuenta ha sido creada exitosamente.
            </p>

            <!-- Beneficios -->
            <div style="background-color: #f8f9fa; border-left: 4px solid #000000; padding: 20px; margin: 30px 0;">
              <h3 style="color: #000000; margin: 0 0 15px 0; font-size: 18px;">
                Beneficios de tu cuenta:
              </h3>
              <ul style="color: #666666; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>🚀 Notificaciones rápidas sobre tus pedidos</li>
                <li>📦 Gestión de todos tus pedidos en un solo lugar</li>
                <li>🎁 Acumulación de saldo para canjes</li>
                <li>⚡ Cambios de dirección más rápidos</li>
                <li>🔔 Alertas sobre noticias y promociones</li>
                <li>💼 Soporte prioritario</li>
              </ul>
            </div>
            
            <!-- Credenciales -->
            <div style="background-color: #000000; color: #ffffff; padding: 30px; border-radius: 10px; margin: 30px 0; text-align: center;">
              <h3 style="margin: 0 0 20px 0; font-size: 20px; font-weight: bold;">
                Tus Datos de Acceso
              </h3>
              
              <div style="background-color: #ffffff; color: #000000; padding: 20px; border-radius: 8px; margin: 15px 0;">
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666; text-transform: uppercase; letter-spacing: 1px;">
                  Código de Membresía
                </p>
                <p style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 2px;">
                  ${codigo}
                </p>
              </div>
              
              <div style="background-color: #ffffff; color: #000000; padding: 20px; border-radius: 8px; margin: 15px 0;">
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666; text-transform: uppercase; letter-spacing: 1px;">
                  Contraseña Temporal
                </p>
                <p style="margin: 0; font-size: 20px; font-weight: bold; font-family: monospace;">
                  ${password}
                </p>
              </div>

              <p style="color: #cccccc; font-size: 13px; margin: 20px 0 0 0; line-height: 1.5;">
                ⚠️ Guarda estos datos en un lugar seguro. Te recomendamos cambiar tu contraseña después del primer inicio de sesión.
              </p>
            </div>

            <!-- Action Button -->
            <div style="text-align: center; margin: 40px 0;">
              <a href="https://gzyfcunlbrfcnbxxaaft.lovable.app/login" 
                 style="display: inline-block; background-color: #000000; color: #ffffff; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; letter-spacing: 1px;">
                INICIAR SESIÓN
              </a>
            </div>
            
            <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
              Estamos emocionados de tenerte con nosotros. ¡Bienvenido a la excelencia!
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
              Santiago de los Caballeros, República Dominicana<br>
              Email: brillarte.oficial.ventas@gmail.com | WhatsApp: 849-425-2220<br>
              © ${new Date().getFullYear()} BRILLARTE. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailData = {
      from: "BRILLARTE <soporte@brillarte.lat>",
      to: [email],
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

    // Record in registros_acceso table
    const { error: regError } = await supabase
      .from('registros_acceso')
      .insert({
        correo: email,
        nombre: nombre,
        codigo_membresia: codigo,
        password_temporal_mascarado: '****',
        email_enviado: true
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