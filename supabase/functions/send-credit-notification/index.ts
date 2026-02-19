import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreditNotificationRequest {
  email: string;
  nombre: string;
  monto: number;
  descripcion: string;
  saldoNuevo: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { email, nombre, monto, descripcion, saldoNuevo }: CreditNotificationRequest = await req.json();

    console.log(`Sending credit notification to ${email}`);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not found");
    }

    const subject = "Credito Aplicado a tu Cuenta - BRILLARTE";

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Credito Aplicado - BRILLARTE</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #000000; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background-color: #000000; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 2px;">
              BRILLARTE
            </h1>
            <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">
              <img src="https://cdn-icons-png.flaticon.com/16/189/189001.png" alt="" style="vertical-align: middle; margin-right: 5px; filter: invert(1);">
              Excelencia en cada detalle
            </p>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 40px 30px; background-color: #ffffff;">
            <h2 style="color: #000000; margin: 0 0 20px 0; font-size: 24px; font-weight: bold;">
              <img src="https://cdn-icons-png.flaticon.com/24/639/639365.png" alt="" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px;">
              Credito Aplicado a tu Cuenta
            </h2>
            
            <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 20px 0;">
              <img src="https://cdn-icons-png.flaticon.com/20/1077/1077114.png" alt="" style="vertical-align: middle; margin-right: 8px;">
              Hola ${nombre},
            </p>
            
            <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 20px 0;">
              Nos complace informarte que se ha aplicado un credito a tu cuenta de BRILLARTE.
            </p>
            
            <div style="background-color: #f8f9fa; border-left: 4px solid #000000; padding: 20px; margin: 20px 0;">
              <div style="text-align: center; margin-bottom: 15px;">
                <p style="color: #666666; margin: 0 0 5px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                  <img src="https://cdn-icons-png.flaticon.com/16/2769/2769339.png" alt="" style="vertical-align: middle; margin-right: 5px;">
                  Monto Aplicado
                </p>
                <h3 style="color: #000000; margin: 0; font-size: 36px; font-weight: bold;">
                  RD$${monto.toFixed(2)}
                </h3>
              </div>
              
              <div style="border-top: 1px solid #e0e0e0; padding-top: 15px; margin-top: 15px;">
                <p style="color: #000000; margin: 0 0 10px 0; font-size: 14px;">
                  <img src="https://cdn-icons-png.flaticon.com/16/1087/1087927.png" alt="" style="vertical-align: middle; margin-right: 5px;">
                  <strong>Motivo:</strong> ${descripcion}
                </p>
                <p style="color: #000000; margin: 0; font-size: 14px;">
                  <img src="https://cdn-icons-png.flaticon.com/16/3135/3135706.png" alt="" style="vertical-align: middle; margin-right: 5px;">
                  <strong>Nuevo Saldo:</strong> RD$${saldoNuevo.toFixed(2)}
                </p>
              </div>
            </div>
            
            <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 20px 0;">
              <img src="https://cdn-icons-png.flaticon.com/20/1828/1828884.png" alt="" style="vertical-align: middle; margin-right: 8px;">
              Este credito esta disponible inmediatamente en tu cuenta y puedes usarlo para:
            </p>
            
            <ul style="color: #666666; font-size: 14px; line-height: 1.8; margin: 20px 0; padding-left: 20px;">
              <li><img src="https://cdn-icons-png.flaticon.com/16/891/891462.png" alt="" style="vertical-align: middle; margin-right: 5px;"> Canjear por productos de nuestra tienda</li>
              <li><img src="https://cdn-icons-png.flaticon.com/16/3595/3595455.png" alt="" style="vertical-align: middle; margin-right: 5px;"> Aplicar descuentos en tus proximos pedidos</li>
              <li><img src="https://cdn-icons-png.flaticon.com/16/2769/2769339.png" alt="" style="vertical-align: middle; margin-right: 5px;"> Acumular para compras futuras</li>
            </ul>
            
            <!-- Action Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://brillarte.lat/mi-cuenta" 
                 style="display: inline-block; background-color: #000000; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                <img src="https://cdn-icons-png.flaticon.com/16/1077/1077114.png" alt="" style="vertical-align: middle; margin-right: 8px; filter: invert(1);">
                Ver Mi Cuenta
              </a>
            </div>
            
            <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
              <img src="https://cdn-icons-png.flaticon.com/20/1329/1329416.png" alt="" style="vertical-align: middle; margin-right: 5px;">
              Gracias por ser parte de la familia BRILLARTE.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #000000; padding: 30px; text-align: center;">
            <p style="color: #ffffff; font-size: 16px; margin: 0 0 10px 0; font-weight: bold;">
              BRILLARTE
            </p>
            <p style="color: #cccccc; font-size: 14px; margin: 0 0 15px 0;">
              El Arte de Brillar
            </p>
            <p style="color: #999999; font-size: 12px; margin: 0;">
              <img src="https://cdn-icons-png.flaticon.com/16/484/484167.png" alt="" style="vertical-align: middle; margin-right: 5px; filter: invert(0.6);">
              Santiago de los Caballeros, Republica Dominicana<br>
              <img src="https://cdn-icons-png.flaticon.com/16/542/542638.png" alt="" style="vertical-align: middle; margin-right: 5px; filter: invert(0.6);">
              brillarte.oficial.ventas@gmail.com | 
              <img src="https://cdn-icons-png.flaticon.com/16/733/733585.png" alt="" style="vertical-align: middle; margin-right: 5px; filter: invert(0.6);">
              849-425-2220<br>
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
    console.log("Credit notification email sent successfully:", emailResponse);

    await supabase.from('email_logs').insert({
      destinatario: email,
      asunto: subject,
      contenido: emailHtml,
      tipo: "credito",
      estado: "enviado"
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-credit-notification function:", error);

    try {
      await supabase.from('email_logs').insert({
        destinatario: "unknown",
        asunto: "Error en notificacion de credito",
        contenido: error.message,
        tipo: "credito",
        estado: "error"
      });
    } catch (logError) {
      console.error("Error logging email:", logError);
    }

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
