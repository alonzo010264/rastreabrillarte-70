import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { destinatario, nombre_referidor, codigo_referido, mensaje_personalizado } = await req.json();

    if (!destinatario || !nombre_referidor || !codigo_referido) {
      return new Response(JSON.stringify({ error: "Faltan datos requeridos" }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(destinatario)) {
      return new Response(JSON.stringify({ error: "Correo no válido" }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const enlace = `https://brillarte.lat/registro?ref=${codigo_referido}`;
    const mensajeExtra = mensaje_personalizado ? `<p style="margin:20px 0;padding:15px;background:#f5f5f5;border-left:3px solid #1a1a1a;border-radius:4px;font-style:italic;color:#555;">"${mensaje_personalizado}"</p>` : '';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;margin-top:20px;margin-bottom:20px;">
    <div style="background:#1a1a1a;padding:30px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:28px;letter-spacing:2px;">BRILLARTE</h1>
      <p style="color:#999;margin:5px 0 0;font-size:12px;letter-spacing:3px;">ACCESORIOS ARTESANALES</p>
    </div>
    <div style="padding:30px;">
      <h2 style="color:#1a1a1a;font-size:22px;">${nombre_referidor} te invita a BRILLARTE</h2>
      <p style="color:#555;font-size:15px;line-height:1.6;">
        <strong>${nombre_referidor}</strong> quiere que conozcas BRILLARTE, donde encontraras accesorios unicos hechos a mano.
      </p>
      ${mensajeExtra}
      <p style="color:#555;font-size:15px;">Registrate con su codigo y ambos ganan puntos:</p>
      <div style="text-align:center;margin:25px 0;">
        <div style="display:inline-block;background:#f5f5f5;border:2px solid #1a1a1a;border-radius:8px;padding:15px 30px;">
          <p style="margin:0;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:2px;">Codigo de referido</p>
          <p style="margin:5px 0 0;font-size:28px;font-weight:bold;color:#1a1a1a;letter-spacing:3px;">${codigo_referido}</p>
        </div>
      </div>
      <div style="text-align:center;margin:30px 0;">
        <a href="${enlace}" style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-weight:bold;font-size:16px;">Registrarme Ahora</a>
      </div>
      <p style="color:#999;font-size:12px;text-align:center;">O copia este enlace: ${enlace}</p>
    </div>
    <div style="background:#f5f5f5;padding:20px;text-align:center;">
      <p style="color:#999;font-size:11px;margin:0;">BRILLARTE - brillarte.lat</p>
    </div>
  </div>
</body>
</html>`;

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "BRILLARTE Referidos <referidos@oficial.brillarte.lat>",
        to: [destinatario],
        subject: `${nombre_referidor} te invita a BRILLARTE`,
        html: htmlContent,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Resend error:", error);
      return new Response(JSON.stringify({ error: "Error al enviar correo" }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Error interno" }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
