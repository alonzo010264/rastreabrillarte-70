import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { titulo, descripcion, imagen_url, fecha_limite } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all active subscribers
    const { data: suscriptores, error: subError } = await supabase
      .from("suscriptores_newsletter")
      .select("correo")
      .eq("activo", true);

    if (subError) throw subError;

    if (!suscriptores || suscriptores.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No hay suscriptores activos" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const fechaFormateada = fecha_limite
      ? new Date(fecha_limite).toLocaleDateString("es-DO", { year: "numeric", month: "long", day: "numeric" })
      : "Próximamente";

    const imagenHtml = imagen_url
      ? `<img src="${imagen_url}" alt="${titulo}" style="width:100%;max-height:300px;object-fit:cover;border-radius:8px;margin:20px 0;" />`
      : "";

    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family:Arial,sans-serif;margin:0;padding:0;background:#f9f9f9;">
        <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
          <div style="background:#000;color:#fff;text-align:center;padding:30px;">
            <img src="https://ahjibuqgthghrykzrrfj.supabase.co/storage/v1/object/public/email-assets/brillarte-logo.jpg" alt="BRILLARTE" style="width:60px;height:60px;border-radius:50%;margin-bottom:10px;" />
            <h1 style="margin:0;font-size:24px;letter-spacing:2px;">BRILLARTE</h1>
            <p style="margin:5px 0 0;font-size:14px;opacity:0.8;">Nueva Promoción Disponible</p>
          </div>
          <div style="padding:30px;">
            <h2 style="color:#000;margin-top:0;">🎁 ${titulo}</h2>
            ${imagenHtml}
            <p style="color:#333;line-height:1.6;">${descripcion}</p>
            <div style="background:#f5f5f5;padding:15px;border-left:4px solid #000;margin:20px 0;border-radius:4px;">
              <p style="margin:0;"><strong>📅 Válida hasta:</strong> ${fechaFormateada}</p>
            </div>
            <div style="text-align:center;margin:30px 0;">
              <a href="https://brillarte.lovable.app/promociones" style="background:#000;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">
                Ver Promoción
              </a>
            </div>
          </div>
          <div style="text-align:center;padding:20px;border-top:1px solid #eee;color:#999;font-size:12px;">
            <p>BRILLARTE - Santiago de los Caballeros, RD</p>
            <p>Recibes este correo porque estás suscrito al newsletter de BRILLARTE.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send emails in batches of 10
    let sentCount = 0;
    const batchSize = 10;

    for (let i = 0; i < suscriptores.length; i += batchSize) {
      const batch = suscriptores.slice(i, i + batchSize);
      const promises = batch.map((sub) =>
        resend.emails.send({
          from: "BRILLARTE Promociones <promociones@oficial.brillarte.lat>",
          to: [sub.correo],
          subject: `🎁 Nueva Promoción: ${titulo}`,
          html: htmlTemplate,
        }).then(() => { sentCount++; })
          .catch((err: Error) => console.error(`Error sending to ${sub.correo}:`, err))
      );
      await Promise.all(promises);
    }

    console.log(`Emails sent: ${sentCount}/${suscriptores.length}`);

    return new Response(
      JSON.stringify({ sent: sentCount, total: suscriptores.length }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
