import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOGO_URL = "https://ahjibuqgthghrykzrrfj.supabase.co/storage/v1/object/public/email-assets/brillarte-logo-white.png";
const VERIFIED_BADGE = "https://ahjibuqgthghrykzrrfj.supabase.co/storage/v1/object/public/email-assets/verificado-icon.png";

function buildHtml(opts: { asunto: string; mensaje: string; senderName: string; senderEmail: string }) {
  const safeMessage = opts.mensaje.replace(/\n/g, "<br/>");
  return `
  <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;color:#111;">
    <div style="background:#000;padding:32px 24px;text-align:center;">
      <img src="${LOGO_URL}" alt="BRILLARTE" width="64" height="64" style="border-radius:12px;display:inline-block;" />
      <h1 style="color:#fff;margin:14px 0 0;font-size:22px;letter-spacing:6px;font-weight:300;">BRILLARTE</h1>
    </div>
    <div style="padding:32px 28px;">
      <h2 style="margin:0 0 20px;font-size:20px;color:#000;font-weight:600;">${opts.asunto}</h2>
      <div style="font-size:15px;line-height:1.7;color:#333;">${safeMessage}</div>
      <hr style="border:none;border-top:1px solid #eee;margin:32px 0;" />
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-weight:600;color:#000;">${opts.senderName}</span>
        <img src="${VERIFIED_BADGE}" alt="Verificado" width="18" height="18" style="vertical-align:middle;" />
      </div>
      <div style="font-size:13px;color:#666;margin-top:4px;">${opts.senderEmail}</div>
    </div>
    <div style="background:#f8f8f8;padding:18px;text-align:center;font-size:12px;color:#888;">
      Enviado desde BRILLARTE Oficial · <a href="https://www.brillarte.lat" style="color:#000;text-decoration:none;">brillarte.lat</a>
    </div>
  </div>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseService = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnon, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(supabaseUrl, supabaseService);
    const { data: profile } = await admin.from("profiles").select("verificado, nombre_completo, correo").eq("user_id", user.id).maybeSingle();
    if (!profile?.verificado) {
      return new Response(JSON.stringify({ error: "Solo cuentas verificadas pueden enviar correos" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { destinatarios, asunto, mensaje } = await req.json();
    if (!Array.isArray(destinatarios) || destinatarios.length === 0 || !asunto || !mensaje) {
      return new Response(JSON.stringify({ error: "Datos inválidos" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (destinatarios.length > 100) {
      return new Response(JSON.stringify({ error: "Máximo 100 destinatarios por envío" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const senderName = profile.nombre_completo || "BRILLARTE";
    const senderEmail = profile.correo || user.email || "brillarte@oficial.brillarte.lat";

    const html = buildHtml({ asunto, mensaje, senderName, senderEmail });

    const sendResults = await Promise.allSettled(
      destinatarios.map((to: string) =>
        resend.emails.send({
          from: `${senderName} (BRILLARTE) <brillarte@oficial.brillarte.lat>`,
          to: [to],
          replyTo: [senderEmail],
          subject: asunto,
          html,
        })
      )
    );

    const ok = sendResults.filter((r) => r.status === "fulfilled").length;
    const failed = sendResults.length - ok;

    await admin.from("correos_enviados").insert({
      sender_user_id: user.id,
      sender_email: senderEmail,
      sender_nombre: senderName,
      destinatarios,
      asunto,
      mensaje,
    });

    return new Response(JSON.stringify({ success: true, enviados: ok, fallidos: failed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("send-bulk-email error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
