import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface StatusNotificationRequest {
  customerEmail: string;
  customerName: string;
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
      customerName,
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
            <p style="color: #000000; margin: 0 0 20px 0; font-size: 16px;">
              Hola ${customerName || 'Cliente'},
            </p>
            <h2 style="color: #000000; margin: 0 0 20px 0; font-size: 24px; font-weight: bold; text-align: center;">
              ${statusName === 'Entregado' ? '¡Pedido Entregado Exitosamente!' : 'Obtuvimos una actualización de tu pedido'}
            </h2>
            ${statusName !== 'Entregado' ? `<p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; text-align: center; font-weight: 500;">
              Pronto estará contigo
            </p>` : ''}
            
            <div style="background-color: #f8f9fa; border-left: 4px solid #000000; padding: 20px; margin: 20px 0;">
              <h3 style="color: #000000; margin: 0 0 10px 0; font-size: 18px;">
                Código de Pedido: <span style="font-weight: normal;">${orderCode}</span>
              </h3>
              <p style="color: #000000; margin: 0 0 10px 0; font-size: 16px;">
                <strong>Estado:</strong> ${statusName}
              </p>
              <p style="color: #666666; margin: 0; font-size: 14px; line-height: 1.5;">
                ${statusDescription}
              </p>
            </div>
            
            ${statusName === 'Entregado' 
              ? `<p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 20px 0; text-align: center;">
                  Por favor, revisa tu zona o confirma si fue entregado en tus manos.<br>
                  <strong>¡Gracias por elegirnos!</strong>
                 </p>`
              : `<p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 20px 0; text-align: center;">
                  Tu pedido está en proceso. Te notificaremos cualquier cambio adicional.
                 </p>`
            }
            
            <!-- Action Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://gzyfcunlbrfcnbxxaaft.lovable.app/rastrear" 
                 style="display: inline-block; background-color: #000000; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; letter-spacing: 1px;">
                RASTREAR PEDIDO
              </a>
            </div>
            
            <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
              Gracias por confiar en BRILLARTE.
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
      from: "BRILLARTE Pedidos <onboarding@resend.dev>",
      to: [customerEmail],
      reply_to: "brillarte.oficial.ventas@gmail.com",
      subject: subject,
      html: emailHtml,
    };

    console.log("Preparando envío de correo:", { 
      to: customerEmail, 
      orderCode, 
      statusName 
    });

    // Send email using Resend API with fallback for testing mode
    const sendResend = async (data: any) =>
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

    let response = await sendResend(emailData);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Primary send failed:", response.status, errorText);

      // Fallback: Resend testing restriction (only to account email)
      if (
        response.status === 403 &&
        errorText.includes("You can only send testing emails to your own email address")
      ) {
        const match = errorText.match(/\(([^(\s)]+@[^(\s)]+)\)/);
        const allowedEmail = match?.[1] || Deno.env.get("RESEND_TEST_EMAIL");

        if (allowedEmail) {
          const fallbackHtml = emailHtml.replace(
            "</body>",
            `<div style="padding:12px 30px; font-size:12px; color:#666;">
              Nota: Envío de prueba por restricciones de Resend. Destinatario previsto: ${customerEmail}
            </div></body>`
          );

          const retryData = {
            ...emailData,
            from: "BRILLARTE Pedidos <onboarding@resend.dev>",
            to: [allowedEmail],
            subject: `${subject} (TEST)` ,
            html: fallbackHtml,
          };

          const retry = await sendResend(retryData);
          if (retry.ok) {
            const retryJson = await retry.json();
            console.log("Fallback test email sent:", retryJson);
            return new Response(
              JSON.stringify({
                success: true,
                message:
                  "Email enviado en modo prueba al correo permitido por Resend. Verifica tu dominio para enviar a clientes.",
                delivered_to: allowedEmail,
                intended_recipient: customerEmail,
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json", ...corsHeaders },
              }
            );
          }
        }

        throw new Error(
          `Resend en modo prueba. Verifica un dominio y usa un remitente de ese dominio. Detalle: ${errorText}`
        );
      }

      throw new Error(`Error de Resend: ${response.status} - ${errorText}`);
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