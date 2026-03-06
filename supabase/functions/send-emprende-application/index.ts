import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data = await req.json();
    const {
      nombre, correo, telefono,
      donde_conocio, donde_conocio_otro,
      por_que_interesa, experiencia_venta,
      cantidad_productos, frecuencia_pedidos,
      mencionar_brillarte, recibir_promos
    } = data;

    const dondeConocio = donde_conocio === "otro" ? donde_conocio_otro : donde_conocio;
    const fecha = new Date().toLocaleString("es-DO", { timeZone: "America/Santo_Domingo" });

    // Email to admin
    const adminHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
          <tr><td align="center" style="padding:40px 20px;">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color:#000000;border-radius:8px;">
              <tr><td align="center" style="padding:40px 20px;">
                <img src="https://ahjibuqgthghrykzrrfj.supabase.co/storage/v1/object/public/email-assets/brillarte-logo.jpg" alt="BRILLARTE" style="width:60px;height:auto;border-radius:50%;margin-bottom:10px;" />
                <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:300;letter-spacing:2px;">BRILLARTE EMPRENDE</h1>
                <p style="color:#999;margin:8px 0 0;font-size:13px;">Nueva Solicitud de Alianza</p>
              </td></tr>
              <tr><td style="padding:0 40px 40px;">
                <table width="100%" style="background-color:#ffffff;border-radius:8px;">
                  <tr><td style="padding:30px;">
                    <h2 style="color:#000;margin:0 0 20px;font-size:22px;font-weight:400;">Nueva Solicitud Recibida</h2>
                    <p style="color:#333;font-size:15px;line-height:1.6;">Se ha recibido una nueva solicitud para el programa Brillarte Emprende.</p>
                    
                    <table width="100%" style="margin:20px 0;border-collapse:collapse;">
                      <tr><td style="padding:10px;border-bottom:1px solid #eee;color:#666;font-size:13px;width:40%;">Nombre</td><td style="padding:10px;border-bottom:1px solid #eee;color:#000;font-size:14px;font-weight:500;">${nombre}</td></tr>
                      <tr><td style="padding:10px;border-bottom:1px solid #eee;color:#666;font-size:13px;">Correo</td><td style="padding:10px;border-bottom:1px solid #eee;color:#000;font-size:14px;">${correo}</td></tr>
                      <tr><td style="padding:10px;border-bottom:1px solid #eee;color:#666;font-size:13px;">Telefono</td><td style="padding:10px;border-bottom:1px solid #eee;color:#000;font-size:14px;">${telefono || "No proporcionado"}</td></tr>
                      <tr><td style="padding:10px;border-bottom:1px solid #eee;color:#666;font-size:13px;">Donde nos conocio</td><td style="padding:10px;border-bottom:1px solid #eee;color:#000;font-size:14px;">${dondeConocio}</td></tr>
                      <tr><td style="padding:10px;border-bottom:1px solid #eee;color:#666;font-size:13px;">Por que le interesa</td><td style="padding:10px;border-bottom:1px solid #eee;color:#000;font-size:14px;">${por_que_interesa}</td></tr>
                      <tr><td style="padding:10px;border-bottom:1px solid #eee;color:#666;font-size:13px;">Experiencia en ventas</td><td style="padding:10px;border-bottom:1px solid #eee;color:#000;font-size:14px;">${experiencia_venta === "si" ? "Si" : "No"}</td></tr>
                      <tr><td style="padding:10px;border-bottom:1px solid #eee;color:#666;font-size:13px;">Cantidad por pedido</td><td style="padding:10px;border-bottom:1px solid #eee;color:#000;font-size:14px;">${cantidad_productos}</td></tr>
                      <tr><td style="padding:10px;border-bottom:1px solid #eee;color:#666;font-size:13px;">Frecuencia de pedidos</td><td style="padding:10px;border-bottom:1px solid #eee;color:#000;font-size:14px;">${frecuencia_pedidos}</td></tr>
                      <tr><td style="padding:10px;border-bottom:1px solid #eee;color:#666;font-size:13px;">Mencionar BRILLARTE</td><td style="padding:10px;border-bottom:1px solid #eee;color:#000;font-size:14px;">${mencionar_brillarte === "si" ? "Si" : "No"}</td></tr>
                      <tr><td style="padding:10px;border-bottom:1px solid #eee;color:#666;font-size:13px;">Recibir promos</td><td style="padding:10px;border-bottom:1px solid #eee;color:#000;font-size:14px;">${recibir_promos === "si" ? "Si" : "No indicado"}</td></tr>
                    </table>
                    
                    <p style="color:#999;font-size:12px;margin-top:20px;">Fecha de solicitud: ${fecha}</p>
                  </td></tr>
                </table>
              </td></tr>
              <tr><td align="center" style="padding:0 40px 30px;">
                <p style="color:#999;font-size:11px;">BRILLARTE - El Arte de Brillar | Notificacion automatica del sistema</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `;

    // Email to applicant
    const applicantHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
          <tr><td align="center" style="padding:40px 20px;">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color:#000000;border-radius:8px;">
              <tr><td align="center" style="padding:40px 20px;">
                <img src="https://ahjibuqgthghrykzrrfj.supabase.co/storage/v1/object/public/email-assets/brillarte-logo.jpg" alt="BRILLARTE" style="width:60px;height:auto;border-radius:50%;margin-bottom:10px;" />
                <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:300;letter-spacing:2px;">BRILLARTE EMPRENDE</h1>
                <p style="color:#999;margin:8px 0 0;font-size:13px;">Solicitud Recibida</p>
              </td></tr>
              <tr><td style="padding:0 40px 40px;">
                <table width="100%" style="background-color:#ffffff;border-radius:8px;">
                  <tr><td style="padding:30px;">
                    <h2 style="color:#000;margin:0 0 20px;font-size:22px;font-weight:400;">Hola, ${nombre.split(" ")[0]}</h2>
                    <p style="color:#333;font-size:15px;line-height:1.8;">
                      Hemos recibido tu solicitud para el programa <strong>Brillarte Emprende</strong>. Estamos emocionados de que quieras formar parte de nuestra red de aliados.
                    </p>
                    <p style="color:#333;font-size:15px;line-height:1.8;">
                      Nuestro equipo revisará tu informacion y te contactará pronto para explicarte con detalles todo sobre el programa, precios de mayoreo, combos especiales y como comenzar.
                    </p>
                    <div style="background:#f5f5f5;padding:20px;border-radius:6px;margin:20px 0;">
                      <p style="color:#000;font-size:14px;margin:0;font-weight:500;">Todo tipo de persona puede aplicar. Estamos aqui para ayudarte a emprender.</p>
                    </div>
                    <p style="color:#333;font-size:15px;line-height:1.8;">
                      Gracias por confiar en BRILLARTE.
                    </p>
                    <div style="text-align:center;margin:25px 0;">
                      <a href="https://brillarte.lovable.app/emprende-brillarte" style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:14px 35px;border-radius:30px;font-size:15px;">
                        Conocer Mas del Programa
                      </a>
                    </div>
                  </td></tr>
                </table>
              </td></tr>
              <tr><td align="center" style="padding:0 40px 30px;">
                <p style="color:#999;font-size:11px;">
                  BRILLARTE - El Arte de Brillar<br>
                  Santiago de los Caballeros, Republica Dominicana<br>
                  Email: brillarte.oficial.ventas@gmail.com | WhatsApp: 849-425-2220
                </p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `;

    // Send both emails
    await Promise.all([
      resend.emails.send({
        from: "BRILLARTE Emprende <sistema@oficial.brillarte.lat>",
        to: ["anotasy@gmail.com"],
        subject: `Nueva Solicitud Brillarte Emprende - ${nombre}`,
        html: adminHtml,
      }),
      resend.emails.send({
        from: "BRILLARTE <contacto@oficial.brillarte.lat>",
        to: [correo],
        subject: "Solicitud Recibida - Brillarte Emprende",
        html: applicantHtml,
      })
    ]);

    console.log("Emprende application emails sent for:", correo);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending emprende application:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
