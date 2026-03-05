import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOGO_URL = "https://ahjibuqgthghrykzrrfj.supabase.co/storage/v1/object/public/email-assets/brillarte-logo.jpg";

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nombre, correo, codigoPedido } = await req.json();

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) throw new Error("RESEND_API_KEY not configured");

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background-color:#000000;font-family:Arial,sans-serif;">
        <div style="max-width:600px;margin:0 auto;background-color:#ffffff;">
          <div style="background-color:#000000;padding:30px;text-align:center;">
            <img src="${LOGO_URL}" alt="BRILLARTE" style="width:70px;height:auto;border-radius:50%;margin-bottom:10px;" />
            <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:bold;letter-spacing:2px;">BRILLARTE</h1>
            <p style="color:#ffffff;margin:5px 0 0;font-size:14px;opacity:0.9;">Excelencia en cada detalle</p>
          </div>
          <div style="padding:40px 30px;background-color:#ffffff;">
            <p style="color:#000;font-size:16px;margin:0 0 20px;">Hola ${nombre},</p>
            <h2 style="color:#000;font-size:22px;text-align:center;margin:0 0 20px;">🔔 Notificaciones Activadas</h2>
            <p style="color:#000;font-size:16px;line-height:1.6;text-align:center;">
              Te has suscrito exitosamente a las notificaciones de tu pedido:
            </p>
            <div style="background-color:#f8f9fa;border-left:4px solid #000;padding:20px;margin:20px 0;text-align:center;">
              <p style="color:#000;font-size:24px;font-weight:bold;margin:0;letter-spacing:2px;">${codigoPedido}</p>
            </div>
            <p style="color:#000;font-size:16px;line-height:1.6;text-align:center;">
              Recibirás un correo electrónico cada vez que el estado de tu pedido cambie.
            </p>
            <div style="text-align:center;margin:30px 0;">
              <a href="https://brillarte.lat/rastrear" style="display:inline-block;background-color:#000;color:#fff;padding:15px 30px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;letter-spacing:1px;">
                RASTREAR MI PEDIDO
              </a>
            </div>
            <p style="color:#000;font-size:16px;text-align:center;">Gracias por confiar en BRILLARTE.</p>
          </div>
          <div style="background-color:#000;padding:30px;text-align:center;">
            <p style="color:#fff;font-size:16px;margin:0 0 10px;font-weight:bold;">BRILLARTE</p>
            <p style="color:#ccc;font-size:14px;margin:0 0 15px;">El Arte de Brillar</p>
            <p style="color:#999;font-size:12px;margin:0;">
              Santiago de los Caballeros, República Dominicana<br>
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
      to: [correo],
      reply_to: "pedidos@oficial.brillarte.lat",
      subject: `${nombre}, te suscribiste a notificaciones del pedido ${codigoPedido} - BRILLARTE`,
      html: emailHtml,
    };

    let response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Fallback to test mode if domain not verified
      if (response.status === 403 && errorText.includes("testing emails")) {
        const match = errorText.match(/\(([^(\s)]+@[^(\s)]+)\)/);
        const allowedEmail = match?.[1] || Deno.env.get("RESEND_TEST_EMAIL");
        if (allowedEmail) {
          const retryRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...emailData,
              from: "BRILLARTE <onboarding@resend.dev>",
              to: [allowedEmail],
              subject: `${emailData.subject} (TEST)`,
            }),
          });
          if (retryRes.ok) {
            return new Response(JSON.stringify({ success: true, test_mode: true }), {
              headers: { "Content-Type": "application/json", ...corsHeaders },
            });
          }
        }
      }
      console.error("Resend error:", response.status, errorText);
      throw new Error(`Email send failed: ${response.status}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error:", error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
