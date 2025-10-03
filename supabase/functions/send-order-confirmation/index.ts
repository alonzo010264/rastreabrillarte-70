import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OrderConfirmationRequest {
  email: string;
  orderCode: string;
  customerName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, orderCode, customerName }: OrderConfirmationRequest = await req.json();

    console.log(`Sending order confirmation for ${orderCode} to ${email}`);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not found");
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmación de Pedido - BRILLARTE</title>
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
              ¡Pedido Confirmado!
            </h2>
            
            <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 20px 0;">
              Hola ${customerName},
            </p>
            
            <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 20px 0;">
              Hemos recibido tu pedido exitosamente. A continuación encontrarás tu código de rastreo:
            </p>
            
            <div style="background-color: #f8f9fa; border-left: 4px solid #000000; padding: 20px; margin: 20px 0; text-align: center;">
              <p style="color: #666666; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                Código de Rastreo
              </p>
              <h3 style="color: #000000; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 2px;">
                ${orderCode}
              </h3>
            </div>
            
            <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 20px 0;">
              Puedes usar este código para rastrear tu pedido en cualquier momento.
            </p>
            
            <!-- Action Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://gzyfcunlbrfcnbxxaaft.lovable.app/rastrear" 
                 style="display: inline-block; background-color: #000000; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                Rastrear Mi Pedido
              </a>
            </div>
            
            <div style="background-color: #f1f3f4; padding: 20px; border-radius: 5px; margin: 30px 0;">
              <p style="color: #000000; font-size: 14px; line-height: 1.5; margin: 0 0 10px 0; font-weight: bold;">
                ¿Qué sigue?
              </p>
              <ul style="color: #666666; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Procesaremos tu pedido</li>
                <li>Te notificaremos cada cambio de estado</li>
                <li>Podrás rastrear tu pedido en tiempo real</li>
              </ul>
            </div>
            
            <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
              Gracias por preferirnos y confiar en BRILLARTE.
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
    `;

    const emailData = {
      from: "BRILLARTE <onboarding@resend.dev>",
      to: [email],
      subject: `Confirmación de Pedido ${orderCode} - BRILLARTE`,
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
    console.log("Order confirmation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-order-confirmation function:", error);
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