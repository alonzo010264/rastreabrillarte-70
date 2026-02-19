import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AbandonedCartEmailRequest {
  email: string;
  nombre: string;
  productos: Array<{
    nombre: string;
    precio: number;
    cantidad: number;
  }>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, nombre, productos }: AbandonedCartEmailRequest = await req.json();

    console.log("Enviando email de carrito abandonado a:", email);

    const productosHtml = productos.map(p => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${p.nombre}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${p.cantidad}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$${p.precio.toFixed(2)}</td>
      </tr>
    `).join('');

    const total = productos.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);

    const emailHtml = `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f8f8;">
        <div style="background-color: #ffffff; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #000000 0%, #333333 100%); padding: 40px 30px; text-align: center;">
            <img src="https://ahjibuqgthghrykzrrfj.supabase.co/storage/v1/object/public/email-assets/brillarte-logo.jpg" alt="BRILLARTE" style="width: 70px; height: auto; margin-bottom: 10px; border-radius: 50%;" />
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 3px;">BRILLARTE</h1>
            <div style="width: 60px; height: 2px; background-color: #ffffff; margin: 15px auto;"></div>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #000000; margin: 0 0 20px; font-size: 22px;">¡Hola ${nombre}! 👋</h2>
            
            <p style="color: #333333; font-size: 16px; line-height: 1.8; margin-bottom: 25px;">
              Acabamos de ver que agregaste algunos productos a tu carrito pero no completaste tu compra. 
              ¡No te preocupes! Tus artículos te están esperando.
            </p>
            
            <!-- Products Table -->
            <div style="background-color: #f8f8f8; border-radius: 10px; padding: 20px; margin: 25px 0;">
              <h3 style="color: #000000; margin: 0 0 15px; font-size: 18px;">Productos en tu carrito:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #000000; color: #ffffff;">
                    <th style="padding: 12px; text-align: left;">Producto</th>
                    <th style="padding: 12px; text-align: center;">Cantidad</th>
                    <th style="padding: 12px; text-align: right;">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  ${productosHtml}
                </tbody>
                <tfoot>
                  <tr style="background-color: #f0f0f0;">
                    <td colspan="2" style="padding: 15px; font-weight: bold;">Total:</td>
                    <td style="padding: 15px; text-align: right; font-weight: bold; font-size: 18px;">$${total.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://brillarte.lat/productos" 
                 style="display: inline-block; background-color: #000000; color: #ffffff; padding: 15px 40px; 
                        text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Completar mi compra
              </a>
            </div>
            
            <p style="color: #666666; font-size: 14px; text-align: center; line-height: 1.6;">
              Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.
              ¡Estamos aquí para ti!
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8f8f8; padding: 25px; text-align: center; border-top: 2px solid #000000;">
            <p style="color: #666666; font-size: 13px; margin: 0; line-height: 1.6;">
              Con cariño,<br>
              <strong style="color: #000000;">El equipo de BRILLARTE</strong><br>
              <span style="font-size: 12px;">WhatsApp: 849-425-2220</span>
            </p>
          </div>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "BRILLARTE <cupon@oficial.brillarte.lat>",
      to: [email],
      subject: "¡Tu carrito te extraña! 🛒 - BRILLARTE",
      html: emailHtml,
    });

    console.log("Email de carrito abandonado enviado:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error en send-abandoned-cart-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);