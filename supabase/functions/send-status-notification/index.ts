import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
  isNewOrder?: boolean;
  facturaUrl?: string | null;
}

const LOGO_URL = "https://ahjibuqgthghrykzrrfj.supabase.co/storage/v1/object/public/email-assets/brillarte-logo.jpg";

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { 
      customerEmail,
      customerName,
      orderCode, 
      statusName, 
      statusDescription,
      isNewOrder = false,
      facturaUrl = null
    }: StatusNotificationRequest = await req.json();

    console.log(`Sending status notification for order ${orderCode} to ${customerEmail}`);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not found");
    }

    // For status updates (not new orders), check if customer is subscribed
    if (!isNewOrder) {
      const { data: subscription } = await supabase
        .from('suscripciones_pedidos')
        .select('id')
        .eq('correo', customerEmail.toLowerCase())
        .eq('codigo_pedido', orderCode)
        .eq('activo', true)
        .maybeSingle();

      if (!subscription) {
        console.log(`Customer ${customerEmail} not subscribed to order ${orderCode}, skipping email`);
        return new Response(JSON.stringify({ 
          success: true, 
          message: "Customer not subscribed, notification skipped" 
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    const isFacturaCreada = statusName === 'Factura Creada';

    const subject = isFacturaCreada
      ? `${customerName}, tu factura del pedido ${orderCode} está lista - BRILLARTE`
      : isNewOrder 
        ? `${customerName}, tu pedido ${orderCode} ha sido creado - BRILLARTE`
        : `${customerName}, tu pedido ${orderCode} cambió de estado - BRILLARTE`;
    
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Actualizacion de Pedido - BRILLARTE</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #000000; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background-color: #000000; padding: 20px; text-align: center;">
            <img src="${LOGO_URL}" alt="BRILLARTE" style="width: 70px; height: auto; margin-bottom: 10px; border-radius: 50%;" />
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
              ${isFacturaCreada
                ? 'Tu Factura ha sido Creada'
                : isNewOrder 
                  ? 'Acabamos de Crear tu Pedido' 
                  : statusName === 'Entregado' 
                    ? 'Pedido Entregado Exitosamente' 
                    : 'Obtuvimos una actualizacion de tu pedido'}
            </h2>
            ${isFacturaCreada ? `<p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; text-align: center; font-weight: 500;">
              La factura de tu pedido ya está disponible para descargar
            </p>` : ''}
            ${!isNewOrder && !isFacturaCreada && statusName !== 'Entregado' ? `<p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; text-align: center; font-weight: 500;">
              Pronto estara contigo
            </p>` : ''}
            ${isNewOrder ? `<p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; text-align: center; font-weight: 500;">
              Tu pedido ha sido registrado exitosamente
            </p>` : ''}
            
            <div style="background-color: #f8f9fa; border-left: 4px solid #000000; padding: 20px; margin: 20px 0;">
              <h3 style="color: #000000; margin: 0 0 10px 0; font-size: 18px;">
                Codigo de Pedido: <span style="font-weight: normal;">${orderCode}</span>
              </h3>
              <p style="color: #000000; margin: 0 0 10px 0; font-size: 16px;">
                <strong>Estado:</strong> ${statusName}
              </p>
              <p style="color: #666666; margin: 0; font-size: 14px; line-height: 1.5;">
                ${statusDescription}
              </p>
            </div>
            
            ${isNewOrder
              ? `<p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 20px 0; text-align: center;">
                  Puedes rastrear tu pedido en cualquier momento usando el codigo <strong>${orderCode}</strong>.<br>
                  Te notificaremos de cada actualizacion.
                 </p>`
              : statusName === 'Entregado' 
                ? `<p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 20px 0; text-align: center;">
                    Por favor, revisa tu zona o confirma si fue entregado en tus manos.<br>
                    <strong>Gracias por elegirnos</strong>
                   </p>`
                : `<p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 20px 0; text-align: center;">
                    Tu pedido esta en proceso. Te notificaremos cualquier cambio adicional.
                   </p>`
            }
            
            <!-- Action Buttons -->
            <div style="text-align: center; margin: 30px 0;">
              ${isFacturaCreada && facturaUrl ? `
              <a href="${facturaUrl}" 
                 style="display: inline-block; background-color: #000000; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; letter-spacing: 1px; margin-bottom: 15px;">
                VER FACTURA
              </a>
              <br><br>
              ` : ''}
              <a href="https://brillarte.lat/rastrear" 
                 style="display: inline-block; ${isFacturaCreada && facturaUrl ? 'background-color: #ffffff; color: #000000; border: 2px solid #000000;' : 'background-color: #000000; color: #ffffff;'} padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; letter-spacing: 1px;">
                RASTREAR PEDIDO
              </a>
            </div>
            ${isNewOrder ? `
            <div style="text-align: center; margin: 20px 0;">
              <a href="https://brillarte.lat/suscribir-pedido?codigo=${orderCode}" 
                 style="display: inline-block; background-color: #ffffff; color: #000000; border: 2px solid #000000; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">
                SUSCRIBIRME A NOTIFICACIONES
              </a>
              <p style="color: #999999; font-size: 12px; margin-top: 10px;">
                Recibe un correo cada vez que tu pedido cambie de estado
              </p>
            </div>` : ''}
            
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
      from: "BRILLARTE Pedidos <pedidos@oficial.brillarte.lat>",
      to: [customerEmail],
      reply_to: "pedidos@oficial.brillarte.lat",
      subject: subject,
      html: emailHtml,
    };

    console.log("Preparando envio de correo:", { 
      to: customerEmail, 
      orderCode, 
      statusName 
    });

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
              Nota: Envio de prueba por restricciones de Resend. Destinatario previsto: ${customerEmail}
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

            await supabase.from('email_logs').insert({
              destinatario: allowedEmail,
              asunto: `${subject} (TEST)`,
              contenido: fallbackHtml,
              tipo: "actualizacion_estado",
              estado: "enviado"
            });

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

    // Notificar al CEO
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "BRILLARTE Sistema <sistema@oficial.brillarte.lat>",
          to: ["anotasy@gmail.com"],
          subject: `Actualizacion de pedido ${orderCode} - Estado: ${statusName}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <h2 style="color:#000;">Notificacion de estado enviada</h2>
            <div style="background:#f5f5f5;padding:15px;border-left:4px solid #000;margin:15px 0;">
              <p><strong>Cliente:</strong> ${customerName}</p>
              <p><strong>Correo:</strong> ${customerEmail}</p>
              <p><strong>Pedido:</strong> ${orderCode}</p>
              <p><strong>Nuevo estado:</strong> ${statusName}</p>
              <p><strong>Descripcion:</strong> ${statusDescription}</p>
              <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo' })}</p>
            </div>
            <p style="color:#666;font-size:12px;">Notificacion automatica del sistema BRILLARTE</p>
          </div>`,
        }),
      });
    } catch (ceoErr) { console.error("Error notificando al CEO:", ceoErr); }

    await supabase.from('email_logs').insert({
      destinatario: customerEmail,
      asunto: subject,
      contenido: emailHtml,
      tipo: "actualizacion_estado",
      estado: "enviado"
    });

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

    try {
      await supabase.from('email_logs').insert({
        destinatario: "unknown",
        asunto: "Error en notificacion de estado",
        contenido: error.message,
        tipo: "actualizacion_estado",
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
