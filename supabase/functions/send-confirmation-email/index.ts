import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  customerName?: string;
  customerEmail?: string;
  orderCode?: string;
  nombre_cliente?: string;
  correo?: string;
  codigo_pedido?: string;
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
    const requestData: ContactEmailRequest = await req.json();
    
    const customerName = requestData.customerName || requestData.nombre_cliente || '';
    const customerEmail = requestData.customerEmail || requestData.correo || '';
    const orderCode = requestData.orderCode || requestData.codigo_pedido || '';

    console.log("Enviando email de confirmacion a:", customerEmail);

    const isNewOrder = requestData.customerName && requestData.orderCode;

    let emailHtml: string;
    let subject: string;

    if (isNewOrder) {
      subject = `Tu codigo de pedido BRILLARTE: ${orderCode}`;
      emailHtml = `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #000000;">
          <div style="background-color: #ffffff; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #000000 0%, #333333 100%); padding: 40px 30px; text-align: center;">
              <img src="${LOGO_URL}" alt="BRILLARTE" style="width: 80px; height: auto; margin-bottom: 10px; border-radius: 50%;" />
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 3px; text-transform: uppercase;">BRILLARTE</h1>
              <div style="width: 80px; height: 3px; background-color: #ffffff; margin: 15px auto 0;"></div>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #000000; margin: 0 0 25px; font-size: 24px; font-weight: 600;">
                Hola ${customerName}
              </h2>
              
              <p style="color: #333333; line-height: 1.8; margin-bottom: 30px; font-size: 16px;">
                Hemos recibido tu solicitud correctamente. Tu codigo de pedido es:
              </p>
              
              <!-- Order Code Box -->
              <div style="background: linear-gradient(135deg, #000000 0%, #333333 100%); color: white; padding: 25px; border-radius: 12px; text-align: center; margin: 30px 0; border: 2px solid #000000;">
                <h2 style="margin: 0; font-size: 28px; letter-spacing: 3px; font-weight: bold;">${orderCode}</h2>
                <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9; text-transform: uppercase;">
                  Codigo de pedido BRILLARTE
                </p>
              </div>
              
              <!-- Warning Box -->
              <div style="background-color: #f8f8f8; border-left: 5px solid #000000; padding: 20px; border-radius: 8px; margin: 30px 0;">
                <h3 style="color: #000000; margin-top: 0; font-size: 18px; font-weight: bold;">
                  IMPORTANTE - Manten tu codigo seguro
                </h3>
                <p style="color: #333333; margin-bottom: 0; font-size: 15px; line-height: 1.6;">
                  Este codigo es <strong>UNICO</strong> para tu pedido. No lo compartas con nadie a menos que sea de tu total confianza. 
                  Si decides compartirlo, la responsabilidad es tuya. BRILLARTE no se hace responsable por el mal uso del codigo.
                </p>
              </div>
              
              <!-- Next Steps -->
              <div style="background-color: #ffffff; border: 2px solid #f0f0f0; padding: 25px; border-radius: 12px; margin: 30px 0;">
                <h3 style="color: #000000; margin-top: 0; font-size: 20px; font-weight: bold;">
                  Que sigue?
                </h3>
                <ul style="color: #333333; padding-left: 20px; line-height: 1.8; font-size: 15px;">
                  <li style="margin-bottom: 8px;">Puedes rastrear tu pedido con este codigo en nuestra pagina</li>
                  <li style="margin-bottom: 8px;">Nuestros agentes buscaran el articulo que solicitas</li>
                  <li style="margin-bottom: 8px;">Te contactaremos cuando encontremos el producto</li>
                  <li style="margin-bottom: 0;">Te proporcionaremos precio y fecha estimada de entrega</li>
                </ul>
              </div>
              
              <p style="color: #333333; line-height: 1.8; font-size: 16px; text-align: center; margin: 30px 0;">
                Gracias por preferirnos. Si tienes alguna pregunta, no dudes en contactarnos.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f8f8f8; padding: 30px; text-align: center; border-top: 3px solid #000000;">
              <p style="color: #666666; font-size: 14px; margin: 0; line-height: 1.6;">
                Gracias por confiar en<br>
                <strong style="color: #000000; font-size: 18px; letter-spacing: 2px;">BRILLARTE</strong><br>
                <span style="font-size: 13px;">Santiago de los Caballeros, Republica Dominicana</span><br>
                <span style="font-size: 12px;">brillarte.oficial.ventas@gmail.com | 849-425-2220</span>
              </p>
            </div>
          </div>
        </div>
      `;
    } else {
      subject = "Gracias por contactarnos - BRILLARTE";
      emailHtml = `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #000000;">
          <div style="background-color: #ffffff; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #000000 0%, #333333 100%); padding: 40px 30px; text-align: center;">
              <img src="${LOGO_URL}" alt="BRILLARTE" style="width: 80px; height: auto; margin-bottom: 10px; border-radius: 50%;" />
              <h1 style="color: #ffffff; margin: 0 0 10px; font-size: 32px; font-weight: bold; letter-spacing: 3px; text-transform: uppercase;">BRILLARTE</h1>
              <div style="width: 80px; height: 3px; background-color: #ffffff; margin: 0 auto;"></div>
              <h2 style="color: #ffffff; margin: 15px 0 0; font-size: 20px; font-weight: 300;">
                Gracias por contactarnos
              </h2>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="color: #000000; font-size: 18px; line-height: 1.8; margin-bottom: 20px;">
                Hola <strong>${customerName}</strong>,
              </p>
              
              <p style="color: #333333; font-size: 16px; line-height: 1.8; margin-bottom: 25px;">
                Gracias por contactarnos. Estamos aqui para resolver tus consultas y brindarte el mejor servicio.
              </p>
              
              ${orderCode ? `
                <div style="background: linear-gradient(135deg, #f8f8f8 0%, #ffffff 100%); border-left: 5px solid #000000; padding: 20px; border-radius: 8px; margin: 25px 0;">
                  <p style="color: #000000; margin: 0; font-size: 16px;">
                    <strong>Codigo de pedido:</strong> <span style="font-family: monospace; font-size: 18px; font-weight: bold;">${orderCode}</span>
                  </p>
                </div>
              ` : ''}
              
              <!-- Info Box -->
              <div style="background-color: #f8f8f8; border: 2px solid #000000; padding: 25px; border-radius: 12px; margin: 30px 0;">
                <p style="color: #000000; margin: 0 0 10px; font-weight: bold; font-size: 16px;">
                  Tiempo de respuesta estimado
                </p>
                <p style="color: #333333; margin: 0; font-size: 15px; line-height: 1.6;">
                  Generalmente tardamos 1 hora para solucionar tu consulta. Un agente se contactara contigo muy pronto para resolver tu situacion.
                </p>
              </div>
              
              <p style="color: #333333; font-size: 16px; line-height: 1.8; text-align: center; margin: 30px 0;">
                Mientras tanto, puedes seguir rastreando tu pedido en nuestra pagina web.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f8f8f8; padding: 30px; text-align: center; border-top: 3px solid #000000;">
              <p style="color: #666666; font-size: 14px; margin: 0; line-height: 1.6;">
                Atentamente,<br>
                <strong style="color: #000000; font-size: 18px; letter-spacing: 2px;">El equipo de BRILLARTE</strong><br>
                <span style="font-size: 13px;">Santiago de los Caballeros, Republica Dominicana</span><br>
                <span style="font-size: 12px;">brillarte.oficial.ventas@gmail.com | 849-425-2220</span>
              </p>
            </div>
          </div>
        </div>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "BRILLARTE <contacto@oficial.brillarte.lat>",
      to: [customerEmail],
      replyTo: ["contacto@oficial.brillarte.lat"],
      subject: subject,
      html: emailHtml,
    });

    console.log("Email enviado exitosamente:", emailResponse);

    // Notificar al CEO
    try {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "BRILLARTE Sistema <sistema@oficial.brillarte.lat>",
          to: ["anotasy@gmail.com"],
          subject: `Correo enviado: ${isNewOrder ? 'Confirmacion de pedido' : 'Contacto'} - ${customerName}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <h2 style="color:#000;">Correo de ${isNewOrder ? 'confirmacion de pedido' : 'contacto'} enviado</h2>
            <div style="background:#f5f5f5;padding:15px;border-left:4px solid #000;margin:15px 0;">
              <p><strong>Cliente:</strong> ${customerName}</p>
              <p><strong>Correo:</strong> ${customerEmail}</p>
              ${orderCode ? `<p><strong>Codigo de pedido:</strong> ${orderCode}</p>` : ''}
              <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo' })}</p>
            </div>
            <p style="color:#666;font-size:12px;">Notificacion automatica del sistema BRILLARTE</p>
          </div>`,
        }),
      });
    } catch (ceoErr) { console.error("Error notificando al CEO:", ceoErr); }

    // Guardar log del email
    await supabase.from('email_logs').insert({
      destinatario: customerEmail,
      asunto: subject,
      contenido: emailHtml,
      tipo: isNewOrder ? "confirmacion_pedido" : "contacto",
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
    console.error("Error en send-confirmation-email function:", error);

    try {
      await supabase.from('email_logs').insert({
        destinatario: "unknown",
        asunto: "Error en confirmacion",
        contenido: error.message,
        tipo: "confirmacion",
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