// Allows an agent (or AI on its behalf) to create a real order in pedidos_online.
// Generates code B0XXXXX-XXXXX, calculates ETA (+5 days, only Sunday is non-business),
// confirms via email to client and notifies CEO.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FROM = "BRILLARTE <pedidos@oficial.brillarte.lat>";

function addBusinessDaysIncludingSat(start: Date, days: number): Date {
  const d = new Date(start);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) added++; // skip only Sunday
  }
  return d;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      cliente_nombre, cliente_email, cliente_telefono,
      direccion_envio, items, subtotal, total,
      agente_nombre, notas,
    } = body;

    if (!cliente_email || !direccion_envio || !items?.length) {
      return new Response(JSON.stringify({ error: 'Faltan campos: cliente_email, direccion_envio, items' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Find or create user_id by email
    let userId: string | null = null;
    const { data: prof } = await supabase.from('profiles').select('user_id').eq('correo', cliente_email).maybeSingle();
    if (prof) userId = prof.user_id;
    if (!userId) {
      // Try to create auth user (passwordless placeholder)
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: cliente_email, email_confirm: true,
        user_metadata: { nombre_completo: cliente_nombre || '' },
      });
      if (createErr || !created.user) {
        return new Response(JSON.stringify({ error: `No se pudo crear cliente: ${createErr?.message}` }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      userId = created.user.id;
    }

    // Generate unique code
    let codigo = '';
    for (let i = 0; i < 10; i++) {
      codigo = 'B' + Math.floor(10000 + Math.random() * 90000) + '-' + Math.floor(10000 + Math.random() * 90000);
      const { data: exists } = await supabase.from('pedidos_online').select('id').eq('codigo_pedido', codigo).maybeSingle();
      if (!exists) break;
    }

    const sub = Number(subtotal) || items.reduce((s: number, it: any) => s + (Number(it.precio || 0) * Number(it.cantidad || 1)), 0);
    const tot = Number(total) || sub;
    const eta = addBusinessDaysIncludingSat(new Date(), 5);

    const { data: pedido, error: insertErr } = await supabase.from('pedidos_online').insert({
      user_id: userId, codigo_pedido: codigo,
      subtotal: sub, total: tot,
      estado: 'Recibido', estado_detallado: 'Pedido tomado por agente',
      direccion_envio, items,
      historial_estados: [{
        fecha: new Date().toISOString(),
        estado: 'Recibido',
        descripcion: `Pedido tomado por ${agente_nombre || 'agente'}. Entrega estimada: ${eta.toLocaleDateString('es-DO')}`,
      }],
    }).select().single();

    if (insertErr) {
      return new Response(JSON.stringify({ error: insertErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const itemsHtml = items.map((it: any) =>
      `<li>${it.cantidad || 1}× ${it.nombre || it.producto || 'Producto'} — RD$${it.precio || 0}</li>`
    ).join('');

    // Email to client
    const RESEND = Deno.env.get('RESEND_API_KEY');
    if (RESEND) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM, to: [cliente_email],
          subject: `Pedido recibido · ${codigo}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#fff;color:#000">
            <h1 style="font-family:Georgia,serif;margin:0 0 8px">¡Recibimos tu pedido!</h1>
            <p>Hola ${cliente_nombre || ''}, tu pedido fue tomado por nuestro equipo.</p>
            <p><strong>Código de pedido:</strong> <span style="font-size:18px;letter-spacing:1px">${codigo}</span></p>
            <p>Guarda este código — lo necesitarás para cualquier consulta.</p>
            <p><strong>Entrega estimada:</strong> ${eta.toLocaleDateString('es-DO', { weekday:'long', day:'numeric', month:'long' })}</p>
            <p><strong>Dirección:</strong> ${direccion_envio}</p>
            <p><strong>Productos:</strong></p><ul>${itemsHtml}</ul>
            <p><strong>Total:</strong> RD$${tot}</p>
            <p style="margin-top:24px;font-size:12px;color:#555">Por confidencialidad, no compartiremos información de tu pedido sin verificar código + nombre. — BRILLARTE</p>
          </div>`,
        }),
      }).catch(console.error);
    }

    // Notify CEO
    await supabase.functions.invoke('notify-ceo', {
      body: {
        evento: 'NUEVO PEDIDO',
        agente: agente_nombre || 'IA',
        cliente_email,
        codigo_pedido: codigo,
        detalle: `Cliente: ${cliente_nombre}\nTel: ${cliente_telefono || '-'}\nDirección: ${direccion_envio}\nTotal: RD$${tot}\nEntrega estimada: ${eta.toLocaleDateString('es-DO')}\n\nNotas: ${notas || '-'}`,
        extra: { items, pedido_id: pedido?.id },
      },
    }).catch(console.error);

    return new Response(JSON.stringify({
      ok: true, codigo_pedido: codigo,
      fecha_estimada: eta.toISOString(),
      pedido_id: pedido?.id,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
