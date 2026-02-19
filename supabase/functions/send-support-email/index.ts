import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SupportEmailRequest {
  email: string;
  mensaje: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, mensaje }: SupportEmailRequest = await req.json();
    
    const supportNumber = Math.floor(1000000 + Math.random() * 9000000);

    const emailResponse = await resend.emails.send({
      from: "BRILLARTE Soporte <soporte@oficial.brillarte.lat>",
      to: [email],
      subject: `Ticket de Soporte #${supportNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #000000 0%, #333333 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .ticket-number { font-size: 24px; font-weight: bold; color: #000; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="https://ahjibuqgthghrykzrrfj.supabase.co/storage/v1/object/public/email-assets/brillarte-logo.jpg" alt="BRILLARTE" style="width: 70px; height: auto; margin-bottom: 10px; border-radius: 50%;" />
                <h1>BRILLARTE</h1>
                <p>Soporte con Agentes Humanos</p>
              </div>
              <div class="content">
                <p>Hola,</p>
                <p><strong>Hemos recibido tu mensaje. Un agente humano real está revisando tu solicitud.</strong></p>
                <div class="ticket-number">Ticket #${supportNumber}</div>
                <p><strong>Tu mensaje:</strong></p>
                <p style="background: white; padding: 15px; border-left: 4px solid #000; margin: 15px 0;">
                  ${mensaje}
                </p>
                <h3>Tiempo de Respuesta</h3>
                <p>Nuestros agentes humanos capacitados (María, Amanda, Luis, José) son <strong>personas reales</strong> que te contactarán en:</p>
                <ul style="margin: 15px 0; padding-left: 20px;">
                  <li>Unos minutos para consultas simples</li>
                  <li>Algunos días para casos que requieren investigación especializada</li>
                </ul>
                <p style="background: #f8f8f8; padding: 15px; border-radius: 5px; margin: 15px 0;">
                  <strong>Nuestros agentes humanos especialistas</strong> están capacitados para anotar cada problema y resolver cualquier situación. Si no tienen la respuesta inmediata, investigarán a fondo para ayudarte.
                </p>
                <p>Si necesitas agregar más información, puedes responder directamente a este correo.</p>
                <p>Gracias por tu confianza.</p>
                <p><strong>Equipo BRILLARTE</strong><br><em>Personas reales, atención humana</em></p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} BRILLARTE - Todos los derechos reservados</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Support email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, ticketNumber: supportNumber }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-support-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
