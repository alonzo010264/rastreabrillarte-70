import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CHATGPT_API_KEY = Deno.env.get("CHATGPT_API_KEY");

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function unauthorized() {
  return json({ error: "API key inválida o no proporcionada" }, 401);
}

function validateApiKey(req: Request): boolean {
  if (!CHATGPT_API_KEY) return true; // If no key configured, allow (dev mode)
  const key = req.headers.get("x-api-key") || req.headers.get("authorization")?.replace("Bearer ", "");
  return key === CHATGPT_API_KEY;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!validateApiKey(req)) return unauthorized();

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const url = new URL(req.url);
  const path = url.pathname.split("/").filter(Boolean).pop() || "";

  try {
    // ==========================================
    // GET /chatgpt-api?action=track&code=B01-XXXXX
    // ==========================================
    if (req.method === "GET") {
      const action = url.searchParams.get("action");

      // --- Rastrear pedido por código ---
      if (action === "track") {
        const code = url.searchParams.get("code")?.trim();
        if (!code) return json({ error: "Falta el parámetro 'code'" }, 400);

        // Buscar en pedidos_online (tienda)
        const { data: pedidoOnline } = await supabase
          .from("pedidos_online")
          .select("codigo_pedido, estado, estado_detallado, total, direccion_envio, tracking_envio, created_at, updated_at, items, historial_estados, empresa_envio_id")
          .eq("codigo_pedido", code)
          .maybeSingle();

        if (pedidoOnline) {
          // Get empresa name if exists
          let empresaNombre = null;
          if (pedidoOnline.empresa_envio_id) {
            const { data: empresa } = await supabase
              .from("empresas_envio")
              .select("nombre")
              .eq("id", pedidoOnline.empresa_envio_id)
              .maybeSingle();
            empresaNombre = empresa?.nombre;
          }

          return json({
            found: true,
            source: "tienda_online",
            pedido: {
              codigo: pedidoOnline.codigo_pedido,
              estado: pedidoOnline.estado,
              estado_detallado: pedidoOnline.estado_detallado,
              total: pedidoOnline.total,
              direccion_envio: pedidoOnline.direccion_envio,
              tracking_envio: pedidoOnline.tracking_envio,
              empresa_envio: empresaNombre,
              fecha_creacion: pedidoOnline.created_at,
              ultima_actualizacion: pedidoOnline.updated_at,
              items: pedidoOnline.items,
              historial_estados: pedidoOnline.historial_estados,
            },
          });
        }

        // Buscar en Pedidos (pedidos manuales)
        const { data: pedidoManual } = await supabase
          .from("Pedidos")
          .select("*, Estatus:Estatus_id(nombre, categoria)")
          .eq("Código de pedido", code)
          .maybeSingle();

        if (pedidoManual) {
          // Get historial
          const { data: historial } = await supabase
            .from("Historial_Estatus")
            .select("*, Estatus:Estatus_id(nombre, categoria)")
            .eq("Código de pedido", code)
            .order("Fecha", { ascending: true });

          return json({
            found: true,
            source: "pedidos_manuales",
            pedido: {
              codigo: pedidoManual["Código de pedido"],
              cliente: pedidoManual.Cliente,
              estado: pedidoManual.Estatus?.nombre || pedidoManual.estado || "Pendiente",
              categoria_estado: pedidoManual.Estatus?.categoria,
              total: pedidoManual.Total,
              peso: pedidoManual.Peso,
              precio: pedidoManual.Precio,
              notas: pedidoManual.Notas,
              fecha_creacion: pedidoManual.Fecha_creacion,
              fecha_estimada_entrega: pedidoManual.Fecha_estimada_entrega,
              es_envio: pedidoManual.es_envio,
              factura_url: pedidoManual.factura_url,
              historial: (historial || []).map((h: any) => ({
                estado: h.Estatus?.nombre || "Desconocido",
                categoria: h.Estatus?.categoria,
                descripcion: h.Descripcion,
                fecha: h.Fecha,
              })),
            },
          });
        }

        return json({ found: false, message: "No se encontró ningún pedido con ese código" });
      }

      // --- Listar productos disponibles ---
      if (action === "products") {
        const { data } = await supabase
          .from("productos")
          .select("id, nombre, precio, stock, colores, tallas, categoria, imagenes")
          .eq("activo", true)
          .eq("disponible", true)
          .order("nombre")
          .limit(100);

        return json({ productos: data || [] });
      }

      // --- Buscar cliente por correo ---
      if (action === "search_client") {
        const email = url.searchParams.get("email")?.trim();
        if (!email) return json({ error: "Falta el parámetro 'email'" }, 400);

        const { data } = await supabase
          .from("profiles")
          .select("user_id, nombre_completo, correo, direccion, telefono, codigo_membresia")
          .ilike("correo", `%${email}%`)
          .limit(5);

        return json({
          clientes: (data || []).map((p: any) => ({
            user_id: p.user_id,
            nombre: p.nombre_completo,
            correo: p.correo,
            direccion: p.direccion,
            telefono: p.telefono,
            codigo_membresia: p.codigo_membresia,
          })),
        });
      }

      return json({ error: "Acción no válida. Usa: track, products, search_client" }, 400);
    }

    // ==========================================
    // POST /chatgpt-api  — Crear pedido
    // ==========================================
    if (req.method === "POST") {
      const body = await req.json();
      const { action } = body;

      if (action === "create_order") {
        const { user_id, items, direccion_envio } = body;

        if (!user_id) return json({ error: "Falta user_id del cliente" }, 400);
        if (!items || !Array.isArray(items) || items.length === 0) return json({ error: "Falta items (array de productos)" }, 400);
        if (!direccion_envio) return json({ error: "Falta direccion_envio" }, 400);

        // Validate products exist and get prices
        const productIds = items.map((i: any) => i.producto_id);
        const { data: productosDB } = await supabase
          .from("productos")
          .select("id, nombre, precio, imagenes, colores, tallas")
          .in("id", productIds)
          .eq("activo", true);

        if (!productosDB || productosDB.length === 0) {
          return json({ error: "No se encontraron productos válidos" }, 400);
        }

        const productMap = new Map(productosDB.map((p: any) => [p.id, p]));
        let subtotal = 0;
        const orderItems: any[] = [];

        for (const item of items) {
          const prod = productMap.get(item.producto_id);
          if (!prod) continue;
          const cantidad = Math.max(1, item.cantidad || 1);
          subtotal += prod.precio * cantidad;
          orderItems.push({
            producto_id: prod.id,
            nombre: prod.nombre,
            precio: prod.precio,
            cantidad,
            color: item.color || null,
            talla: item.talla || null,
            imagen: prod.imagenes?.[0] || null,
          });
        }

        if (orderItems.length === 0) {
          return json({ error: "Ningún producto válido en la lista" }, 400);
        }

        // Generate unique code
        const codigoPedido = `B01-${Math.floor(10000 + Math.random() * 90000)}`;

        const historialInicial = [{
          estado: "Pedido Pagado",
          fecha: new Date().toISOString(),
          descripcion: "Pedido creado vía API ChatGPT",
        }];

        const { data: newOrder, error } = await supabase
          .from("pedidos_online")
          .insert({
            codigo_pedido: codigoPedido,
            user_id,
            subtotal,
            total: subtotal,
            items: orderItems,
            direccion_envio,
            estado: "Pagado",
            estado_detallado: "Pedido Pagado",
            historial_estados: historialInicial,
          })
          .select("id, codigo_pedido, total")
          .single();

        if (error) {
          console.error("Error creating order:", error);
          return json({ error: "Error al crear el pedido: " + error.message }, 500);
        }

        return json({
          success: true,
          pedido: {
            id: newOrder.id,
            codigo: newOrder.codigo_pedido,
            total: newOrder.total,
            items: orderItems.length,
            mensaje: `Pedido ${newOrder.codigo_pedido} creado exitosamente por $${newOrder.total.toFixed(2)}`,
          },
        });
      }

      return json({ error: "Acción POST no válida. Usa: create_order" }, 400);
    }

    return json({ error: "Método no soportado" }, 405);
  } catch (err) {
    console.error("API Error:", err);
    return json({ error: "Error interno del servidor" }, 500);
  }
});
