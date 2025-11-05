import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderRequestConfirmation {
  nombre: string;
  correo: string;
  codigo_pedido: string;
  tipo_servicio: 'retiro' | 'envio';
  descripcion: string;
  direccion?: string;
  numero_casa?: string;
  sector?: string;
  provincia?: string;
  referencias?: string;
  telefono?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: OrderRequestConfirmation = await req.json();
    
    console.log(`Enviando confirmación de pedido: ${data.codigo_pedido} a ${data.correo}`);

    const tipoServicioTexto = data.tipo_servicio === "retiro" ? "Retiro en Tienda" : "Envío a Domicilio";
    
    let detallesServicio = '';
    if (data.tipo_servicio === 'retiro') {
      detallesServicio = `
        <div class="info-box">
          <h3>🏪 Retiro en Tienda</h3>
          <p><strong>Descripción del producto:</strong> ${data.descripcion}</p>
          <p style="color: #666;">Te contactaremos cuando tu pedido esté listo para recoger.</p>
        </div>
      `;
    } else {
      detallesServicio = `
        <div class="info-box">
          <h3>🚚 Envío a Domicilio</h3>
          <p><strong>Descripción del producto:</strong> ${data.descripcion}</p>
          <p><strong>Dirección:</strong> ${data.direccion}, #${data.numero_casa}</p>
          <p><strong>Sector:</strong> ${data.sector}</p>
          <p><strong>Provincia:</strong> ${data.provincia}</p>
          ${data.referencias ? `<p><strong>Referencias:</strong> ${data.referencias}</p>` : ''}
          <p><strong>Teléfono:</strong> ${data.telefono}</p>
          <p style="color: #666; margin-top: 10px;">Te contactaremos para coordinar el pago y envío.</p>
        </div>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "BRILLARTE <pedidos@brillarte.lat>",
      to: [data.correo],
      replyTo: "pedidos@brillarte.lat",
      subject: `Confirmación de Pedido ${data.codigo_pedido} - BRILLARTE`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #000000; background-color: #ffffff; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #000000; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
              .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #000000; }
              .highlight { background: #000000; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>BRILLARTE</h1>
                <p>¡Tu Pedido ha sido Recibido!</p>
              </div>
              <div class="content">
                <h2>¡Hola ${data.nombre}!</h2>
                <p>Gracias por tu pedido. Hemos recibido tu solicitud correctamente.</p>
                
                <div class="info-box">
                  <h3>Detalles de tu Pedido</h3>
                  <p><strong>Código de Pedido:</strong> <span class="highlight">${data.codigo_pedido}</span></p>
                  <p><strong>Tipo de Servicio:</strong> ${tipoServicioTexto}</p>
                </div>

                ${detallesServicio}

                <h3>Próximos Pasos:</h3>
                <ol>
                  <li><strong>Procesaremos tu pedido</strong> en las próximas horas</li>
                  <li><strong>Te notificaremos</strong> cuando esté listo</li>
                  <li><strong>Podrás rastrear</strong> tu pedido en nuestra web con el código: <span class="highlight">${data.codigo_pedido}</span></li>
                </ol>

                <p><strong>Para rastrear tu pedido:</strong></p>
                <p>Visita nuestra página de rastreo e ingresa tu código de pedido.</p>

                <p>Si tienes alguna pregunta, no dudes en contactarnos:</p>
                <ul>
                  <li>Email: pedidos@brillarte.lat</li>
                  <li>Instagram: @brillarte.do.oficial</li>
                  <li>WhatsApp: (849) 425-2220</li>
                </ul>

                <p>¡Gracias por confiar en BRILLARTE!</p>
                <p><strong>Equipo BRILLARTE</strong><br>
                El Arte de Brillar</p>
              </div>
              <div class="footer">
                <p>© 2025 BRILLARTE - Todos los derechos reservados</p>
                <p>Puedes responder a este correo si necesitas ayuda</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Correo de confirmación enviado:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error en send-order-request-confirmation:", error);
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
