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
  if (!CHATGPT_API_KEY) return true;
  const key = req.headers.get("x-api-key") || req.headers.get("authorization")?.replace("Bearer ", "");
  return key === CHATGPT_API_KEY;
}

// Calculate estimated delivery date: 3-5 business days based on item count
function calcEstimatedDelivery(itemCount: number): string {
  const days = itemCount >= 5 ? 5 : itemCount >= 3 ? 4 : 3;
  const date = new Date();
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const dow = date.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return date.toISOString().split("T")[0];
}

// ── OpenAPI Spec ──────────────────────────────────────────────
function getOpenAPISpec(baseUrl: string) {
  return {
    openapi: "3.1.0",
    info: {
      title: "Brillarte API",
      description: "API oficial de Brillarte para gestionar pedidos, rastrear envíos, consultar productos y buscar clientes. Diseñada para integrarse como Action de ChatGPT.",
      version: "2.0.0",
    },
    servers: [{ url: baseUrl }],
    paths: {
      "/chatgpt-api": {
        get: {
          operationId: "handleGetActions",
          summary: "Rastrear pedido, listar productos, buscar cliente o ver cola de pedidos",
          parameters: [
            { name: "action", in: "query", required: true, schema: { type: "string", enum: ["track", "products", "search_client", "order_queue"] }, description: "Acción a ejecutar" },
            { name: "code", in: "query", required: false, schema: { type: "string" }, description: "Código de pedido para rastrear (requerido si action=track)" },
            { name: "email", in: "query", required: false, schema: { type: "string" }, description: "Email del cliente a buscar (requerido si action=search_client)" },
          ],
          responses: {
            "200": {
              description: "Respuesta exitosa",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      found: { type: "boolean", description: "Si se encontró el pedido (solo para track)" },
                      source: { type: "string", description: "Fuente del pedido: tienda_online o pedidos_manuales" },
                      pedido: {
                        type: "object",
                        properties: {
                          codigo: { type: "string" },
                          estado: { type: "string" },
                          estado_detallado: { type: "string" },
                          total: { type: "number" },
                          direccion_envio: { type: "string" },
                          tracking_envio: { type: "string" },
                          empresa_envio: { type: "string" },
                          fecha_creacion: { type: "string" },
                          fecha_estimada_entrega: { type: "string" },
                          ultima_actualizacion: { type: "string" },
                          posicion_en_cola: { type: "integer", description: "Posición del pedido en la cola de trabajo" },
                          items: { type: "array", items: { type: "object", properties: { nombre: { type: "string" }, precio: { type: "number" }, cantidad: { type: "integer" } } } },
                          historial_estados: { type: "array", items: { type: "object", properties: { estado: { type: "string" }, fecha: { type: "string" }, descripcion: { type: "string" } } } },
                        },
                      },
                      productos: { type: "array", items: { type: "object", properties: { id: { type: "string" }, nombre: { type: "string" }, precio: { type: "number" }, stock: { type: "integer" }, categoria: { type: "string" }, colores: { type: "array", items: { type: "string" } }, tallas: { type: "array", items: { type: "string" } }, es_preventa: { type: "boolean" }, monto_minimo_preventa: { type: "number" } } } },
                      clientes: { type: "array", items: { type: "object", properties: { user_id: { type: "string" }, nombre: { type: "string" }, correo: { type: "string" }, direccion: { type: "string" }, telefono: { type: "string" }, codigo_membresia: { type: "string" } } } },
                      cola: { type: "object", properties: { total_pendientes: { type: "integer" }, pedidos: { type: "array", items: { type: "object", properties: { posicion: { type: "integer" }, codigo: { type: "string" }, estado: { type: "string" }, fecha_creacion: { type: "string" }, fecha_estimada_entrega: { type: "string" }, total: { type: "number" } } } } } },
                      message: { type: "string" },
                      error: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          operationId: "handlePostActions",
          summary: "Crear pedido o actualizar estado de pedido",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["action"],
                  properties: {
                    action: { type: "string", enum: ["create_order", "update_status"], description: "Acción a ejecutar" },
                    user_id: { type: "string", description: "UUID del cliente (requerido para create_order)" },
                    items: { type: "array", description: "Productos del pedido", items: { type: "object", required: ["producto_id"], properties: { producto_id: { type: "string" }, cantidad: { type: "integer", default: 1 }, color: { type: "string" }, talla: { type: "string" } } } },
                    direccion_envio: { type: "string", description: "Dirección de entrega" },
                    notas: { type: "string", description: "Notas adicionales del pedido" },
                    codigo_pedido: { type: "string", description: "Código del pedido (requerido para update_status)" },
                    nuevo_estado: { type: "string", description: "Nuevo estado del pedido (requerido para update_status)" },
                    descripcion_cambio: { type: "string", description: "Descripción del cambio de estado" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Respuesta exitosa",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      pedido: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          codigo: { type: "string" },
                          total: { type: "number" },
                          items: { type: "integer" },
                          fecha_estimada_entrega: { type: "string" },
                          posicion_en_cola: { type: "integer" },
                          mensaje: { type: "string" },
                        },
                      },
                      error: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
}

// ── Handlers ──────────────────────────────────────────────────

async function handleTrack(supabase: any, code: string) {
  // Search pedidos_online
  const { data: pedidoOnline } = await supabase
    .from("pedidos_online")
    .select("codigo_pedido, estado, estado_detallado, total, direccion_envio, tracking_envio, created_at, updated_at, items, historial_estados, empresa_envio_id")
    .eq("codigo_pedido", code)
    .maybeSingle();

  if (pedidoOnline) {
    let empresaNombre = null;
    if (pedidoOnline.empresa_envio_id) {
      const { data: empresa } = await supabase.from("empresas_envio").select("nombre").eq("id", pedidoOnline.empresa_envio_id).maybeSingle();
      empresaNombre = empresa?.nombre;
    }

    // Get queue position
    const posicion = await getQueuePosition(supabase, code);

    // Calculate estimated delivery from items
    const itemCount = Array.isArray(pedidoOnline.items) ? pedidoOnline.items.reduce((s: number, i: any) => s + (i.cantidad || 1), 0) : 1;
    const fechaEstimada = calcEstimatedDelivery(itemCount);

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
        fecha_estimada_entrega: fechaEstimada,
        ultima_actualizacion: pedidoOnline.updated_at,
        posicion_en_cola: posicion,
        items: pedidoOnline.items,
        historial_estados: pedidoOnline.historial_estados,
      },
    });
  }

  // Search Pedidos (manual)
  const { data: pedidoManual } = await supabase
    .from("Pedidos")
    .select("*, Estatus:Estatus_id(nombre, categoria)")
    .eq("Código de pedido", code)
    .maybeSingle();

  if (pedidoManual) {
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

async function getQueuePosition(supabase: any, code: string): Promise<number> {
  const { data } = await supabase
    .from("pedidos_online")
    .select("codigo_pedido")
    .in("estado", ["Pagado", "En proceso", "Preparando"])
    .order("created_at", { ascending: true })
    .limit(100);

  if (!data) return 0;
  const idx = data.findIndex((p: any) => p.codigo_pedido === code);
  return idx >= 0 ? idx + 1 : 0;
}

async function handleOrderQueue(supabase: any) {
  const { data } = await supabase
    .from("pedidos_online")
    .select("codigo_pedido, estado, estado_detallado, total, created_at, items")
    .in("estado", ["Pagado", "En proceso", "Preparando"])
    .order("created_at", { ascending: true })
    .limit(50);

  const pedidos = (data || []).map((p: any, i: number) => {
    const itemCount = Array.isArray(p.items) ? p.items.reduce((s: number, it: any) => s + (it.cantidad || 1), 0) : 1;
    return {
      posicion: i + 1,
      codigo: p.codigo_pedido,
      estado: p.estado,
      estado_detallado: p.estado_detallado,
      fecha_creacion: p.created_at,
      fecha_estimada_entrega: calcEstimatedDelivery(itemCount),
      total: p.total,
    };
  });

  return json({ cola: { total_pendientes: pedidos.length, pedidos } });
}

async function handleProducts(supabase: any) {
  const { data } = await supabase
    .from("productos")
    .select("id, nombre, precio, stock, colores, tallas, categoria, imagenes, es_preventa, monto_minimo_preventa")
    .eq("activo", true)
    .eq("disponible", true)
    .order("nombre")
    .limit(100);

  return json({ productos: data || [] });
}

async function handleSearchClient(supabase: any, email: string) {
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

async function handleCreateOrder(supabase: any, body: any) {
  const { user_id, items, direccion_envio, notas } = body;

  if (!user_id) return json({ error: "Falta user_id del cliente" }, 400);
  if (!items || !Array.isArray(items) || items.length === 0) return json({ error: "Falta items (array de productos)" }, 400);
  if (!direccion_envio) return json({ error: "Falta direccion_envio" }, 400);

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
  let totalCantidad = 0;
  const orderItems: any[] = [];

  for (const item of items) {
    const prod = productMap.get(item.producto_id);
    if (!prod) continue;
    const cantidad = Math.max(1, item.cantidad || 1);
    subtotal += prod.precio * cantidad;
    totalCantidad += cantidad;
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

  const codigoPedido = `B01-${Math.floor(10000 + Math.random() * 90000)}`;
  const fechaEstimada = calcEstimatedDelivery(totalCantidad);

  const historialInicial = [{
    estado: "Pedido Pagado",
    fecha: new Date().toISOString(),
    descripcion: notas ? `Pedido creado vía API Brillarte. Notas: ${notas}` : "Pedido creado vía API Brillarte",
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

  // Get queue position
  const posicion = await getQueuePosition(supabase, codigoPedido);

  return json({
    success: true,
    pedido: {
      id: newOrder.id,
      codigo: newOrder.codigo_pedido,
      total: newOrder.total,
      items: orderItems.length,
      fecha_estimada_entrega: fechaEstimada,
      posicion_en_cola: posicion,
      mensaje: `Pedido ${newOrder.codigo_pedido} creado exitosamente por RD$${newOrder.total.toFixed(2)}. Entrega estimada: ${fechaEstimada}. Posición en cola: #${posicion}.`,
    },
  });
}

async function handleUpdateStatus(supabase: any, body: any) {
  const { codigo_pedido, nuevo_estado, descripcion_cambio } = body;

  if (!codigo_pedido) return json({ error: "Falta codigo_pedido" }, 400);
  if (!nuevo_estado) return json({ error: "Falta nuevo_estado" }, 400);

  // Get current order
  const { data: pedido } = await supabase
    .from("pedidos_online")
    .select("id, historial_estados")
    .eq("codigo_pedido", codigo_pedido)
    .maybeSingle();

  if (!pedido) return json({ error: "Pedido no encontrado" }, 404);

  const historial = Array.isArray(pedido.historial_estados) ? pedido.historial_estados : [];
  historial.push({
    estado: nuevo_estado,
    fecha: new Date().toISOString(),
    descripcion: descripcion_cambio || `Estado actualizado a: ${nuevo_estado}`,
  });

  const { error } = await supabase
    .from("pedidos_online")
    .update({
      estado: nuevo_estado,
      estado_detallado: nuevo_estado,
      historial_estados: historial,
    })
    .eq("id", pedido.id);

  if (error) return json({ error: "Error al actualizar: " + error.message }, 500);

  return json({
    success: true,
    pedido: {
      codigo: codigo_pedido,
      nuevo_estado,
      mensaje: `Pedido ${codigo_pedido} actualizado a "${nuevo_estado}"`,
    },
  });
}

// ── Main handler ──────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  // Serve OpenAPI spec without auth
  if (req.method === "GET" && action === "openapi") {
    const baseUrl = `${url.protocol}//${url.host}`;
    return json(getOpenAPISpec(baseUrl));
  }

  if (!validateApiKey(req)) return unauthorized();

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    if (req.method === "GET") {
      if (action === "track") {
        const code = url.searchParams.get("code")?.trim();
        if (!code) return json({ error: "Falta el parámetro 'code'" }, 400);
        return await handleTrack(supabase, code);
      }
      if (action === "products") return await handleProducts(supabase);
      if (action === "search_client") {
        const email = url.searchParams.get("email")?.trim();
        if (!email) return json({ error: "Falta el parámetro 'email'" }, 400);
        return await handleSearchClient(supabase, email);
      }
      if (action === "order_queue") return await handleOrderQueue(supabase);
      return json({ error: "Acción no válida. Usa: track, products, search_client, order_queue, openapi" }, 400);
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { action: postAction } = body;
      if (postAction === "create_order") return await handleCreateOrder(supabase, body);
      if (postAction === "update_status") return await handleUpdateStatus(supabase, body);
      return json({ error: "Acción POST no válida. Usa: create_order, update_status" }, 400);
    }

    return json({ error: "Método no soportado" }, 405);
  } catch (err) {
    console.error("API Error:", err);
    return json({ error: "Error interno del servidor" }, 500);
  }
});
