import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreditNotificationRequest {
  email: string;
  nombre: string;
  monto: number;
  descripcion: string;
  saldoNuevo: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, nombre, monto, descripcion, saldoNuevo }: CreditNotificationRequest = await req.json();

    console.log(`Sending credit notification to ${email}`);

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
        <title>Crédito Aplicado - BRILLARTE</title>
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
              ¡Crédito Aplicado a tu Cuenta!
            </h2>
            
            <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 20px 0;">
              Hola ${nombre},
            </p>
            
            <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 20px 0;">
              Nos complace informarte que se ha aplicado un crédito a tu cuenta de BRILLARTE.
            </p>
            
            <div style="background-color: #f8f9fa; border-left: 4px solid #000000; padding: 20px; margin: 20px 0;">
              <div style="text-align: center; margin-bottom: 15px;">
                <p style="color: #666666; margin: 0 0 5px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                  Monto Aplicado
                </p>
                <h3 style="color: #000000; margin: 0; font-size: 36px; font-weight: bold;">
                  RD$${monto.toFixed(2)}
                </h3>
              </div>
              
              <div style="border-top: 1px solid #e0e0e0; padding-top: 15px; margin-top: 15px;">
                <p style="color: #000000; margin: 0 0 10px 0; font-size: 14px;">
                  <strong>Motivo:</strong> ${descripcion}
                </p>
                <p style="color: #000000; margin: 0; font-size: 14px;">
                  <strong>Nuevo Saldo:</strong> RD$${saldoNuevo.toFixed(2)}
                </p>
              </div>
            </div>
            
            <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 20px 0;">
              Este crédito está disponible inmediatamente en tu cuenta y puedes usarlo para:
            </p>
            
            <ul style="color: #666666; font-size: 14px; line-height: 1.8; margin: 20px 0; padding-left: 20px;">
              <li>Canjear por productos de nuestra tienda</li>
              <li>Aplicar descuentos en tus próximos pedidos</li>
              <li>Acumular para compras futuras</li>
            </ul>
            
            <!-- Action Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://gzyfcunlbrfcnbxxaaft.lovable.app/mi-cuenta" 
                 style="display: inline-block; background-color: #000000; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                Ver Mi Cuenta
              </a>
            </div>
            
            <p style="color: #000000; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
              Gracias por ser parte de la familia BRILLARTE.
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
      from: "BRILLARTE <contacto@brillarte.lat>",
      to: [email],
      reply_to: "contacto@brillarte.lat",
      subject: "¡Crédito Aplicado a tu Cuenta! - BRILLARTE",
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
    console.log("Credit notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-credit-notification function:", error);
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