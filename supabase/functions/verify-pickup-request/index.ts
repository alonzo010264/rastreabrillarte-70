import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PickupRequest {
  nombre: string;
  apellido: string;
  codigoPedido: string;
  correo: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Pickup verification request received");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { nombre, apellido, codigoPedido, correo }: PickupRequest = await req.json();

    console.log("Processing pickup request for order:", codigoPedido);

    // Verify the order code exists in the Pedidos table
    const { data: pedido, error: pedidoError } = await supabase
      .from("Pedidos")
      .select("*")
      .eq("Código de pedido", codigoPedido)
      .single();

    if (pedidoError || !pedido) {
      console.log("Order not found:", codigoPedido);
      return new Response(
        JSON.stringify({
          success: false,
          message: "No pudimos encontrar el código en nuestro sistema. Por favor contacta con nosotros e intenta de nuevo. Gracias por preferirnos."
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    console.log("Order found, saving pickup request to database");

    // Save pickup request to database
    const { error: insertError } = await supabase
      .from("solicitudes_retiro")
      .insert({
        nombre,
        apellido,
        codigo_pedido: codigoPedido,
        correo,
        estado: "Pendiente"
      });

    if (insertError) {
      console.error("Error saving pickup request:", insertError);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Error guardando la solicitud. Intenta de nuevo."
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    console.log("Pickup request saved successfully, sending confirmation email");

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY no está configurado");
    }

    const emailData = {
      from: "BRILLARTE <onboarding@resend.dev>",
      to: [correo],
      subject: `Confirmación de Solicitud de Retiro ${codigoPedido} - BRILLARTE`,
      html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirmación de Solicitud de Retiro - BRILLARTE</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #000000; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background-color: #000000; padding: 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 2px;">
                BRILLARTE
              </h1>
              <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">
                Excelencia en cada detalle
              </p>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 40px 30px; background-color: #ffffff;">
              <h2 style="color: #000000; margin: 0 0 20px 0; font-size: 24px; font-weight: bold;">
                ¡Solicitud de Retiro Recibida!
              </h2>
              
              <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hola <strong>${nombre} ${apellido}</strong>,
              </p>
              
              <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hemos recibido tu solicitud de retiro para el pedido <strong>${codigoPedido}</strong> exitosamente.
              </p>
              
              <!-- Order Info Box -->
              <div style="background-color: #f8f9fa; border-left: 4px solid #000000; padding: 20px; margin: 20px 0;">
                <h3 style="color: #000000; margin: 0 0 15px 0; font-size: 18px;">
                  Información de tu Solicitud
                </h3>
                <p style="color: #000000; margin: 0 0 8px 0; font-size: 14px;">
                  <strong>Código de Pedido:</strong> ${codigoPedido}
                </p>
                <p style="color: #000000; margin: 0 0 8px 0; font-size: 14px;">
                  <strong>Correo de Contacto:</strong> ${correo}
                </p>
                <p style="color: #000000; margin: 0; font-size: 14px;">
                  <strong>Estado:</strong> Pendiente de Coordinación
                </p>
              </div>
              
              <!-- Contact Info -->
              <div style="background-color: #000000; color: #ffffff; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #ffffff; margin: 0 0 15px 0; font-size: 18px; text-align: center;">
                  Información de Contacto
                </h3>
                <div style="text-align: center;">
                  <p style="color: #ffffff; margin: 0 0 8px 0; font-size: 14px;">
                    📞 <strong>WhatsApp:</strong> 849-425-2220
                  </p>
                  <p style="color: #ffffff; margin: 0; font-size: 14px;">
                    ✉️ <strong>Correo:</strong> brillarte.oficial.ventas@gmail.com
                  </p>
                </div>
              </div>
              
              <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                Nos comunicaremos contigo pronto para coordinar el retiro de tu pedido. 
                Mantente atento a tu teléfono y correo electrónico.
              </p>
              
              <!-- Action Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://gzyfcunlbrfcnbxxaaft.lovable.app/rastrear" 
                   style="display: inline-block; background-color: #000000; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                  Rastrear Pedido
                </a>
              </div>
              
              <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
                Gracias por elegir BRILLARTE. Tu confianza es nuestra mayor recompensa.
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
                Santiago de los Caballeros, República Dominicana<br>
                Email: brillarte.oficial.ventas@gmail.com | WhatsApp: 849-425-2220<br>
                © ${new Date().getFullYear()} BRILLARTE. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    // Send email using Resend API
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
    console.log("Confirmation email sent successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Solicitud procesada correctamente"
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("Error in verify-pickup-request function:", error);
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