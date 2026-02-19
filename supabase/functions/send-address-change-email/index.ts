import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AddressChangeEmailRequest {
  orderCode: string;
  email: string;
  newAddress: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderCode, email, newAddress }: AddressChangeEmailRequest = await req.json();

    console.log('Processing address change email for order:', orderCode);

    // Crear cliente de Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obtener información del pedido
    const { data: orderData, error: orderError } = await supabase
      .from('Pedidos')
      .select('Estatus_id, Estatus(nombre)')
      .eq('Código de pedido', orderCode)
      .single();

    if (orderError) {
      console.error('Error fetching order:', orderError);
      throw orderError;
    }

    // Determinar si se puede cambiar la dirección
    // Solo se puede cambiar si el estatus es "Creado" (id: 1)
    const canChange = orderData.Estatus_id === 1;
    const statusName = orderData.Estatus?.nombre || 'Desconocido';

    console.log('Order status:', statusName, 'Can change:', canChange);

    // Enviar correo de confirmación de recepción
    const confirmationHtml = `
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
                            Solicitud de Cambio de Dirección Recibida ✅
                          </h2>
                          
                          <p style="color: #333333; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                            Hola,
                          </p>
                          
                          <p style="color: #333333; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                            Gracias por confirmar tu nueva dirección de envío para el pedido <strong>${orderCode}</strong>.
                          </p>
                          
                          <div style="background-color: #f5f5f5; border-left: 4px solid #000000; padding: 20px; margin: 20px 0;">
                            <p style="color: #000000; margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">
                              📍 Nueva Dirección
                            </p>
                            <p style="color: #666666; margin: 0; font-size: 14px; line-height: 1.6;">
                              ${newAddress}
                            </p>
                          </div>
                          
                          <p style="color: #333333; margin: 20px 0; font-size: 16px; line-height: 1.6;">
                            Verificaremos si aún es posible hacer el cambio de dirección. Cualquier cosa te notificaremos automáticamente.
                          </p>
                          
                          <p style="color: #333333; margin: 20px 0; font-size: 16px; line-height: 1.6;">
                            Gracias por preferirnos.
                          </p>
                          
                          <div style="text-align: center; margin: 30px 0;">
                            <a href="https://brillarte.lovable.app/rastrear" 
                               style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 4px; font-size: 16px; font-weight: 500;">
                              Rastrear mi Pedido
                            </a>
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
                      © 2024 Todos los derechos reservados
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

    // Enviar correo de confirmación
    await resend.emails.send({
      from: "BRILLARTE <contacto@oficial.brillarte.lat>",
      to: [email],
      replyTo: ["contacto@oficial.brillarte.lat"],
      subject: "Solicitud de Cambio de Dirección Recibida - BRILLARTE",
      html: confirmationHtml,
    });

    console.log('Confirmation email sent');

    // Enviar segundo correo indicando si se puede o no hacer el cambio
    const statusHtml = `
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
                            ${canChange ? '✅ Cambio de Dirección Aprobado' : '❌ Cambio de Dirección No Disponible'}
                          </h2>
                          
                          <p style="color: #333333; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                            Hola,
                          </p>
                          
                          ${canChange ? `
                            <p style="color: #333333; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                              ¡Buenas noticias! Sí es posible hacer el cambio de dirección para tu pedido <strong>${orderCode}</strong>.
                            </p>
                            
                            <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0;">
                              <p style="color: #155724; margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">
                                ✅ Cambio Aprobado
                              </p>
                              <p style="color: #155724; margin: 0; font-size: 14px; line-height: 1.6;">
                                Tu pedido se encuentra en estado "Creado", por lo que podemos actualizar la dirección de envío sin problemas.
                              </p>
                            </div>
                            
                            <p style="color: #333333; margin: 20px 0; font-size: 16px; line-height: 1.6;">
                              Nuestro equipo procesará el cambio y tu pedido será enviado a la nueva dirección que proporcionaste.
                            </p>
                          ` : `
                            <p style="color: #333333; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                              Lamentablemente, no es posible hacer el cambio de dirección para tu pedido <strong>${orderCode}</strong>.
                            </p>
                            
                            <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 20px; margin: 20px 0;">
                              <p style="color: #721c24; margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">
                                ❌ Cambio No Disponible
                              </p>
                              <p style="color: #721c24; margin: 0; font-size: 14px; line-height: 1.6;">
                                Tu pedido se encuentra en estado "${statusName}", lo que significa que ya está siendo procesado o enviado. Por razones logísticas, no podemos modificar la dirección en esta etapa.
                              </p>
                            </div>
                            
                            <p style="color: #333333; margin: 20px 0; font-size: 16px; line-height: 1.6;">
                              Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos por WhatsApp o Instagram.
                            </p>
                          `}
                          
                          <p style="color: #333333; margin: 20px 0; font-size: 16px; line-height: 1.6;">
                            Gracias por tu comprensión y por preferirnos.
                          </p>
                          
                          <div style="text-align: center; margin: 30px 0;">
                            <a href="https://brillarte.lovable.app/rastrear" 
                               style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 4px; font-size: 16px; font-weight: 500;">
                              Rastrear mi Pedido
                            </a>
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
                      © 2024 Todos los derechos reservados
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

    // Enviar correo de estado
    await resend.emails.send({
      from: "BRILLARTE <contacto@oficial.brillarte.lat>",
      to: [email],
      replyTo: ["contacto@oficial.brillarte.lat"],
      subject: canChange 
        ? "✅ Cambio de Dirección Aprobado - BRILLARTE"
        : "❌ Cambio de Dirección No Disponible - BRILLARTE",
      html: statusHtml,
    });

    console.log('Status email sent');

    return new Response(
      JSON.stringify({ 
        success: true,
        canChange,
        statusName
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending address change emails:", error);
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
