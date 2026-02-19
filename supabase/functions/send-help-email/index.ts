import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface HelpEmailRequest {
  orderCode: string;
  email: string;
  situation: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderCode, email, situation }: HelpEmailRequest = await req.json();

    console.log('Processing help email for order:', orderCode);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #000000; border-radius: 8px;">
                <!-- Header -->
                <tr>
                  <td align="center" style="padding: 40px 20px;">
                    <img src="https://ahjibuqgthghrykzrrfj.supabase.co/storage/v1/object/public/email-assets/brillarte-logo.jpg" alt="BRILLARTE" style="width: 70px; height: auto; margin-bottom: 10px; border-radius: 50%;" />
                    <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 300; letter-spacing: 2px;">
                      BRILLARTE
                    </h1>
                    <p style="color: #cccccc; margin: 10px 0 0 0; font-size: 14px; letter-spacing: 1px;">
                      El Arte de Brillar
                    </p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 0 40px 40px 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
                      <tr>
                        <td style="padding: 40px;">
                          <h2 style="color: #000000; margin: 0 0 20px 0; font-size: 24px; font-weight: 400;">
                            Solicitud de Ayuda de Emergencia Recibida
                          </h2>
                          
                          <p style="color: #333333; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                            Hola,
                          </p>
                          
                          <p style="color: #333333; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                            Recibimos tu solicitud de emergencia para el pedido <strong>${orderCode}</strong>.
                          </p>
                          
                          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0;">
                            <p style="color: #856404; margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">
                              Solicitud de Emergencia
                            </p>
                            <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.6;">
                              Nuestro equipo ha sido notificado de tu situación y trabajará para dar solución lo más pronto posible.
                            </p>
                          </div>
                          
                          <p style="color: #333333; margin: 20px 0; font-size: 16px; line-height: 1.6;">
                            En breve, nuestros agentes te contactarán para dar solución y que estés satisfecho.
                          </p>
                          
                          <p style="color: #333333; margin: 20px 0; font-size: 16px; line-height: 1.6;">
                            Gracias por preferirnos. Tu satisfacción es nuestra prioridad.
                          </p>
                          
                          <div style="text-align: center; margin: 30px 0;">
                            <a href="https://brillarte.lovable.app/rastrear" 
                               style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 4px; font-size: 16px; font-weight: 500;">
                              Rastrear mi Pedido
                            </a>
                          </div>
                          
                          <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 4px;">
                            <p style="color: #666666; margin: 0 0 10px 0; font-size: 12px; font-weight: bold;">
                              Detalles de tu solicitud:
                            </p>
                            <p style="color: #666666; margin: 0; font-size: 12px; line-height: 1.6;">
                              ${situation}
                            </p>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td align="center" style="padding: 0 40px 40px 40px;">
                    <p style="color: #cccccc; margin: 0; font-size: 12px; line-height: 1.6;">
                      BRILLARTE - El Arte de Brillar<br>
                      Santiago de los Caballeros, República Dominicana<br>
                      Email: brillarte.oficial.ventas@gmail.com | WhatsApp: 849-425-2220<br>
                      © ${new Date().getFullYear()} Todos los derechos reservados
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await resend.emails.send({
      from: "BRILLARTE <contacto@oficial.brillarte.lat>",
      to: [email],
      replyTo: ["contacto@oficial.brillarte.lat"],
      subject: "Solicitud de Ayuda de Emergencia Recibida - BRILLARTE",
      html,
    });

    console.log('Help email sent successfully');

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending help email:", error);
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
