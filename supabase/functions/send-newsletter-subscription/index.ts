import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewsletterRequest {
  correo: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { correo }: NewsletterRequest = await req.json();

    console.log("Enviando correo de suscripción a:", correo);

    const emailResponse = await resend.emails.send({
      from: "BRILLARTE Anuncios <anuncios@oficial.brillarte.lat>",
      to: [correo],
      subject: "¡Bienvenido a BRILLARTE!",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #000000;
                background-color: #ffffff;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                text-align: center;
                padding: 30px 0;
                border-bottom: 2px solid #000000;
              }
              .logo {
                font-size: 32px;
                font-weight: bold;
                color: #000000;
                letter-spacing: 2px;
              }
              .content {
                padding: 30px 0;
              }
              h1 {
                color: #000000;
                font-size: 24px;
                margin-bottom: 20px;
              }
              p {
                color: #333333;
                margin-bottom: 15px;
              }
              .benefits {
                background-color: #f8f8f8;
                padding: 20px;
                border-left: 4px solid #000000;
                margin: 20px 0;
              }
              .benefits ul {
                margin: 10px 0;
                padding-left: 20px;
              }
              .benefits li {
                margin: 8px 0;
              }
              .footer {
                text-align: center;
                padding: 20px 0;
                border-top: 2px solid #000000;
                margin-top: 30px;
                color: #666666;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="https://ahjibuqgthghrykzrrfj.supabase.co/storage/v1/object/public/email-assets/brillarte-logo.jpg" alt="BRILLARTE" style="width: 70px; height: auto; margin-bottom: 10px; border-radius: 50%;" />
                <div class="logo">BRILLARTE</div>
              </div>
              
              <div class="content">
                <h1>¡Gracias por Suscribirte!</h1>
                
                <p>Estamos emocionados de tenerte en nuestra comunidad BRILLARTE.</p>
                
                <p>A partir de ahora recibirás:</p>
                
                <div class="benefits">
                  <ul>
                    <li>Ofertas exclusivas y descuentos especiales</li>
                    <li>Novedades y lanzamientos de nuevos productos</li>
                    <li>Consejos y tendencias en bisutería</li>
                    <li>Promociones por temporada</li>
                  </ul>
                </div>
                
                <p>Mantente atento a tu correo para no perderte ninguna de nuestras ofertas especiales.</p>
                
                <p>¡Gracias por elegir BRILLARTE!</p>
              </div>
              
              <div class="footer">
                <p>BRILLARTE - Santiago de los Caballeros, República Dominicana</p>
                <p>brillarte.oficial.ventas@gmail.com | 849-425-2220</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Correo de suscripción enviado:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error en send-newsletter-subscription:", error);
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
