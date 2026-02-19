import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HelpRequest {
  codigo_pedido: string;
  nombre_cliente: string;
  correo: string;
  mensaje: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { codigo_pedido, nombre_cliente, correo, mensaje }: HelpRequest = await req.json();

    console.log(`Enviando correo de ayuda para pedido: ${codigo_pedido}`);

    // Enviar correo al cliente
    const emailResponse = await resend.emails.send({
      from: "BRILLARTE <pedidos@oficial.brillarte.lat>",
      to: [correo],
      replyTo: "pedidos@oficial.brillarte.lat",
      subject: `Hemos recibido tu consulta - Pedido ${codigo_pedido}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
              .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✨ BRILLARTE</h1>
                <p>Recibimos tu Consulta</p>
              </div>
              <div class="content">
                <h2>Hola ${nombre_cliente},</h2>
                <p>Hemos recibido tu consulta sobre el pedido <strong>${codigo_pedido}</strong>.</p>
                
                <div class="info-box">
                  <h3>Tu Mensaje:</h3>
                  <p>${mensaje}</p>
                </div>

                <p><strong>Nuestro equipo está revisando tu consulta y te responderemos lo antes posible.</strong></p>
                
                <p>Si deseas agregar más información o tienes dudas adicionales, simplemente responde a este correo y nuestro equipo te atenderá directamente.</p>

                <p>Puedes escribirnos también a:</p>
                <ul>
                  <li>📧 Email: pedidos@oficial.brillarte.lat</li>
                  <li>📱 Instagram: @brillarte.do.oficial</li>
                  <li>📞 WhatsApp: (849) 425-2220</li>
                </ul>

                <p>Gracias por tu paciencia,</p>
                <p><strong>Equipo BRILLARTE</strong><br>
                El Arte de Brillar ✨</p>
              </div>
              <div class="footer">
                <p>Este es un correo automático. Puedes responder directamente para contactarnos.</p>
                <p>© 2025 BRILLARTE - Todos los derechos reservados</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Correo de ayuda enviado:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error en send-order-tracking-help:", error);
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
