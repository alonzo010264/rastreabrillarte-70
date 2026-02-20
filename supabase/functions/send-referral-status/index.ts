import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { destinatario, nombre_usuario, estado, razon } = await req.json();

    if (!destinatario || !estado) {
      return new Response(JSON.stringify({ error: "Faltan datos" }), { status: 400, headers: corsHeaders });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY no configurada" }), { status: 500, headers: corsHeaders });
    }

    const esAprobado = estado === "aprobado";
    const subject = esAprobado
      ? `${nombre_usuario || "Usuario"}, tu solicitud a BRILLARTE Referidos fue aprobada`
      : `${nombre_usuario || "Usuario"}, actualización sobre tu solicitud a BRILLARTE Referidos`;

    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e0e0e0;">
  <tr><td style="background:#000000;padding:32px 40px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:22px;letter-spacing:2px;">BRILLARTE</h1>
    <p style="color:#999999;margin:8px 0 0;font-size:12px;letter-spacing:1px;">PROGRAMA DE REFERIDOS</p>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="font-size:15px;color:#333;margin:0 0 20px;">Hola <strong>${nombre_usuario || "Usuario"}</strong>,</p>
    ${esAprobado ? `
    <p style="font-size:15px;color:#333;margin:0 0 16px;">Tu solicitud para unirte al programa de referidos de BRILLARTE ha sido <strong>aprobada</strong>.</p>
    <p style="font-size:15px;color:#333;margin:0 0 16px;">Ya puedes acceder a tu panel de referidos, obtener tu codigo unico y empezar a invitar amigos para ganar puntos.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr><td align="center">
        <a href="https://brillarte.lat/referidos" style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:14px 32px;font-size:14px;font-weight:bold;letter-spacing:1px;">ACCEDER A REFERIDOS</a>
      </td></tr>
    </table>
    ` : `
    <p style="font-size:15px;color:#333;margin:0 0 16px;">Lamentamos informarte que tu solicitud para unirte al programa de referidos ha sido <strong>rechazada</strong>.</p>
    ${razon ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
      <tr><td style="background:#f9f9f9;border-left:3px solid #000;padding:16px 20px;">
        <p style="font-size:12px;color:#999;margin:0 0 6px;text-transform:uppercase;letter-spacing:1px;">Razon</p>
        <p style="font-size:14px;color:#333;margin:0;">${razon}</p>
      </td></tr>
    </table>` : ""}
    <p style="font-size:15px;color:#333;margin:0 0 16px;">Si consideras que esto fue un error o deseas mas informacion, puedes contactarnos a traves de nuestro chat de soporte.</p>
    `}
    <hr style="border:none;border-top:1px solid #eee;margin:30px 0;">
    <p style="font-size:12px;color:#999;text-align:center;margin:0;">BRILLARTE · brillarte.lat</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "BRILLARTE Referidos <referidos@oficial.brillarte.lat>",
        to: [destinatario],
        subject,
        html,
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
