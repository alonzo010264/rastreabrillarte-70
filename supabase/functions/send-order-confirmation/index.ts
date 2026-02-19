import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OrderConfirmationRequest {
  customerEmail: string;
  customerName: string;
  lastName: string;
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
    const { customerEmail, customerName, lastName }: OrderConfirmationRequest = await req.json();

    console.log("Sending order confirmation to:", customerEmail);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <tr>
              <td style="padding: 40px 20px; text-align: center; background-color: #000000;">
                <img src="${LOGO_URL}" alt="BRILLARTE" style="width: 70px; height: auto; margin-bottom: 10px; border-radius: 50%;" />
                <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 300;">BRILLARTE</h1>
                <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px;">
                  Pedidos
                </p>
              </td>
            </tr>
            
            <tr>
              <td style="padding: 40px 30px;">
                <h2 style="color: #000000; margin: 0 0 20px 0; font-size: 24px; font-weight: 400;">
                  Hola ${customerName} ${lastName}
                </h2>
                
                <p style="color: #333333; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                  Gracias por hacernos saber que quieres pedir con nosotros. Nos encantara ayudarte en todo el proceso de tu compra.
                </p>
                
                <div style="background-color: #f5f5f5; padding: 20px; border-left: 4px solid #000000; margin: 30px 0;">
                  <p style="color: #000000; margin: 0; font-size: 15px; line-height: 1.6;">
                    <strong>Proximos pasos:</strong><br><br>
                    Pronto te contactaremos por alguno de los medios de contacto que proporcionaste para agendar y confirmar los detalles de tu pedido.
                  </p>
                </div>
                
                <p style="color: #333333; line-height: 1.6; margin: 20px 0; font-size: 16px;">
                  Mientras tanto, si tienes alguna pregunta, no dudes en contactarnos.
                </p>
                
                <p style="color: #333333; line-height: 1.6; margin: 30px 0 0 0; font-size: 16px;">
                  Saludos cordiales,<br>
                  <strong>El equipo de BRILLARTE</strong>
                </p>
              </td>
            </tr>
            
            <tr>
              <td style="padding: 30px; text-align: center; background-color: #000000;">
                <p style="color: #ffffff; margin: 0; font-size: 14px;">
                  ${new Date().getFullYear()} BRILLARTE. Todos los derechos reservados.
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "BRILLARTE <contacto@oficial.brillarte.lat>",
      to: [customerEmail],
      replyTo: ["contacto@oficial.brillarte.lat"],
      subject: "Gracias por tu solicitud de pedido - BRILLARTE",
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    // Notificar al CEO
    try {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "BRILLARTE Sistema <sistema@oficial.brillarte.lat>",
          to: ["anotasy@gmail.com"],
          subject: `Nuevo pedido recibido de ${customerName} ${lastName}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <h2 style="color:#000;">Solicitud de pedido recibida</h2>
            <div style="background:#f5f5f5;padding:15px;border-left:4px solid #000;margin:15px 0;">
              <p><strong>Cliente:</strong> ${customerName} ${lastName}</p>
              <p><strong>Correo:</strong> ${customerEmail}</p>
              <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo' })}</p>
            </div>
            <p style="color:#666;font-size:12px;">Notificacion automatica del sistema BRILLARTE</p>
          </div>`,
        }),
      });
    } catch (ceoErr) { console.error("Error notificando al CEO:", ceoErr); }

    await supabase.from('email_logs').insert({
      destinatario: customerEmail,
      asunto: "Gracias por tu solicitud de pedido - BRILLARTE",
      contenido: emailHtml,
      tipo: "confirmacion_pedido",
      estado: "enviado"
    });

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-order-confirmation function:", error);

    try {
      await supabase.from('email_logs').insert({
        destinatario: "unknown",
        asunto: "Error en confirmacion de pedido",
        contenido: error.message,
        tipo: "confirmacion_pedido",
        estado: "error"
      });
    } catch (logError) {
      console.error("Error logging email:", logError);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);