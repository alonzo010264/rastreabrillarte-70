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
      subject: "Confirmación de Solicitud de Retiro - BRILLARTE",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Confirmación de Retiro - BRILLARTE</title>
            <style>
              body { 
                font-family: 'Arial', sans-serif; 
                line-height: 1.6; 
                color: #000; 
                background-color: #fff;
                margin: 0;
                padding: 0; 
              }
              .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background: #fff;
                border: 2px solid #000;
              }
              .header { 
                background: #000; 
                color: #fff; 
                padding: 40px 30px; 
                text-align: center; 
              }
              .header h1 { 
                margin: 0; 
                font-size: 28px; 
                font-weight: 300; 
                letter-spacing: 3px;
              }
              .header .diamonds {
                font-size: 20px;
                margin: 0 10px;
              }
              .content { 
                padding: 40px 30px; 
                background: #fff;
              }
              .order-box {
                background: #f8f8f8;
                border: 2px solid #000;
                padding: 20px;
                text-align: center;
                margin: 30px 0;
              }
              .order-code {
                font-size: 24px;
                font-weight: bold;
                font-family: 'Courier New', monospace;
                color: #000;
                letter-spacing: 2px;
              }
              .address-section {
                background: #000;
                color: #fff;
                padding: 25px;
                margin: 30px 0;
              }
              .address-section h3 {
                margin-top: 0;
                color: #fff;
                font-size: 18px;
              }
              .instagram-info {
                background: #f0f0f0;
                border-left: 4px solid #000;
                padding: 20px;
                margin: 20px 0;
              }
              .footer { 
                background: #000; 
                color: #fff; 
                padding: 30px; 
                text-align: center; 
                font-size: 12px;
              }
              .footer a {
                color: #fff;
                text-decoration: none;
              }
              h2 { 
                color: #000; 
                font-weight: 300;
                font-size: 22px;
              }
              .success-message {
                background: #f8f8f8;
                border: 2px solid #000;
                padding: 25px;
                text-align: center;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1><span class="diamonds">◆</span> BRILLARTE <span class="diamonds">◆</span></h1>
                <p style="margin: 10px 0 0 0; font-size: 16px; font-weight: 300;">El Arte de Brillar</p>
              </div>
              
              <div class="content">
                <h2>¡Hola ${nombre} ${apellido}!</h2>
                
                <div class="success-message">
                  <h3 style="margin-top: 0; color: #000;">✓ Retiro Notificado con Éxito</h3>
                  <p style="margin-bottom: 0; font-size: 16px;">Gracias por confiar en BRILLARTE</p>
                </div>
                
                <p>Has notificado tu retiro con éxito. <strong>En unas horas te diremos cuándo pasar.</strong></p>
                
                <div class="order-box">
                  <p style="margin: 0 0 10px 0; font-size: 14px;">Código de Pedido:</p>
                  <div class="order-code">${codigoPedido}</div>
                </div>
                
                <div class="address-section">
                  <h3>📍 Nuestra Dirección:</h3>
                  <p style="margin: 0; font-size: 16px; line-height: 1.5;">
                    <strong>Cerro Alto, Barrio Las Mercedes</strong><br>
                    Calle Primera
                  </p>
                </div>
                
                <div class="instagram-info">
                  <h4 style="margin-top: 0; color: #000;">📱 ¿Dificultades para llegar?</h4>
                  <p style="margin: 10px 0;">
                    Contáctanos en Instagram: <strong>@brillarte.do.oficial</strong><br>
                    Estaremos para contestar
                  </p>
                </div>
                
                <p style="margin: 30px 0 0 0; text-align: center; font-style: italic; color: #666;">
                  Gracias por elegir BRILLARTE - El Arte de Brillar
                </p>
              </div>
              
              <div class="footer">
                <p style="margin: 0 0 10px 0;">© ${new Date().getFullYear()} BRILLARTE - Todos los derechos reservados</p>
                <p style="margin: 0; opacity: 0.8;">Productos únicos de calidad</p>
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