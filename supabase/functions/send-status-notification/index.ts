import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface StatusNotificationRequest {
  customerEmail: string;
  orderCode: string;
  statusName: string;
  statusDescription: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      customerEmail, 
      orderCode, 
      statusName, 
      statusDescription 
    }: StatusNotificationRequest = await req.json();

    console.log(`Sending status notification for order ${orderCode} to ${customerEmail}`);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not found");
    }

    const subject = `Actualización de tu pedido ${orderCode} - BRILLARTE`;
    
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Actualización de Pedido - BRILLARTE</title>
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
              ¡Tu pedido ha sido actualizado!
            </h2>
            
            <div style="background-color: #f8f9fa; border-left: 4px solid #000000; padding: 20px; margin: 20px 0;">
              <h3 style="color: #000000; margin: 0 0 10px 0; font-size: 18px;">
                Código de Pedido: <span style="font-weight: normal;">${orderCode}</span>
              </h3>
              <p style="color: #000000; margin: 0 0 10px 0; font-size: 16px;">
                <strong>Nuevo Estado:</strong> ${statusName}
              </p>
              <p style="color: #666666; margin: 0; font-size: 14px; line-height: 1.5;">
                ${statusDescription}
              </p>
            </div>
            
            <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 20px 0;">
              Te mantendremos informado sobre cualquier cambio en el estado de tu pedido.
            </p>
            
            <!-- Action Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://gzyfcunlbrfcnbxxaaft.lovable.app/rastrear" 
                 style="display: inline-block; background-color: #000000; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                Rastrear Pedido
              </a>
            </div>
            
            <!-- Cancellation Notice -->
            <div style="background-color: #f1f3f4; padding: 20px; border-radius: 5px; margin: 30px 0;">
              <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 0;">
                <strong>¿No deseas recibir estas notificaciones?</strong><br>
                Puedes cancelar las notificaciones de estado de tus pedidos visitando nuestra 
                <a href="https://gzyfcunlbrfcnbxxaaft.lovable.app/cancel-notifications" 
                   style="color: #000000; text-decoration: underline;">página de cancelaciones</a>.
                Ten en cuenta que deberás estar pendiente del estado de tus pedidos por otros medios.
              </p>
            </div>
            
            <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
              Gracias por preferirnos y confiar en BRILLARTE para tus necesidades.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #000000; padding: 30px; text-align: center;">
            <p style="color: #ffffff; font-size: 16px; margin: 0 0 10px 0; font-weight: bold;">
              BRILLARTE
            </p>
            <p style="color: #cccccc; font-size: 14px; margin: 0 0 15px 0;">
              Excelencia y calidad en cada producto
            </p>
            <p style="color: #999999; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} BRILLARTE. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailData = {
      from: "BRILLARTE <onboarding@resend.dev>",
      to: [customerEmail],
      subject: subject,
      html: emailHtml,
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

    console.log("Status notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Notification sent successfully" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-status-notification function:", error);
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