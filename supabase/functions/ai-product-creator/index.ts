import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProductData {
  nombre: string;
  descripcion?: string;
  precio: number;
  precio_original?: number;
  stock?: number;
  categoria?: string;
  imagenes?: string[];
  activo?: boolean;
  destacado?: boolean;
  en_oferta?: boolean;
  porcentaje_descuento?: number;
  colores?: string[];
  tallas?: string[];
}

interface CommandResult {
  success: boolean;
  message: string;
  product?: ProductData;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { commands, images } = await req.json();
    
    if (!commands || !Array.isArray(commands) || commands.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No se proporcionaron comandos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const systemPrompt = `Eres un asistente especializado en crear productos para una tienda online de bisutería y accesorios hechos a mano llamada BRILLARTE.

Tu trabajo es interpretar comandos en lenguaje natural y extraer la información del producto.

Para cada comando, debes devolver un objeto JSON con la siguiente estructura:
{
  "nombre": "string (obligatorio)",
  "descripcion": "string (opcional, genera una descripción atractiva si no se proporciona)",
  "precio": number (obligatorio, en pesos dominicanos),
  "precio_original": number (opcional, para ofertas),
  "stock": number (opcional, default 0),
  "categoria": "string (opcional)",
  "activo": boolean (default true),
  "destacado": boolean (default false),
  "en_oferta": boolean (default false),
  "porcentaje_descuento": number (opcional, 0-100),
  "colores": ["array de strings"] (opcional),
  "tallas": ["array de strings"] (opcional)
}

Reglas:
- Si el usuario menciona un precio, extráelo (ej: "$150", "150 pesos", "precio 150")
- Si menciona descuento/oferta, calcula precio_original y activa en_oferta
- Si dice "destacado", pon destacado: true
- Si no da descripción, crea una atractiva y breve
- Precios deben ser números positivos
- Responde SOLO con el JSON, sin explicaciones

Ejemplos:
Comando: "Crea producto Aretes Flores precio 120"
Respuesta: {"nombre":"Aretes Flores","descripcion":"Hermosos aretes artesanales con diseño floral, perfectos para cualquier ocasión.","precio":120,"activo":true,"destacado":false}

Comando: "Nuevo collar dorado $200 con 15% descuento, destacado"
Respuesta: {"nombre":"Collar Dorado","descripcion":"Elegante collar dorado que complementa cualquier outfit con un toque de sofisticación.","precio":170,"precio_original":200,"en_oferta":true,"porcentaje_descuento":15,"destacado":true,"activo":true}`;

    const results: CommandResult[] = [];
    let productsCreated = 0;

    // Process images - get URLs from base64
    const imageUrls: string[] = [];
    if (images && Array.isArray(images)) {
      for (const img of images) {
        // For now, use the base64 directly as the image URL
        // In production, you'd upload to storage first
        if (img.url) {
          imageUrls.push(img.url);
        }
      }
    }

    for (const command of commands) {
      try {
        console.log(`Processing command: ${command}`);

        // Call AI to interpret the command
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: command }
            ],
            temperature: 0.3,
          }),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error("AI API error:", errorText);
          results.push({
            success: false,
            message: `Error al procesar: "${command.substring(0, 50)}..." - Error de IA`
          });
          continue;
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content;
        
        if (!content) {
          results.push({
            success: false,
            message: `No se pudo interpretar: "${command.substring(0, 50)}..."`
          });
          continue;
        }

        // Parse the JSON response
        let productData: ProductData;
        try {
          // Clean up the response - remove markdown code blocks if present
          let jsonStr = content.trim();
          if (jsonStr.startsWith("```json")) {
            jsonStr = jsonStr.slice(7);
          }
          if (jsonStr.startsWith("```")) {
            jsonStr = jsonStr.slice(3);
          }
          if (jsonStr.endsWith("```")) {
            jsonStr = jsonStr.slice(0, -3);
          }
          jsonStr = jsonStr.trim();

          productData = JSON.parse(jsonStr);
        } catch (parseError) {
          console.error("JSON parse error:", parseError, "Content:", content);
          results.push({
            success: false,
            message: `Error al interpretar respuesta para: "${command.substring(0, 50)}..."`
          });
          continue;
        }

        // Validate required fields
        if (!productData.nombre || !productData.precio) {
          results.push({
            success: false,
            message: `Datos incompletos para: "${command.substring(0, 50)}..." - Falta nombre o precio`
          });
          continue;
        }

        // Assign images if available
        if (imageUrls.length > 0) {
          productData.imagenes = imageUrls;
        }

        // Set defaults
        productData.activo = productData.activo !== false;
        productData.destacado = productData.destacado === true;
        productData.stock = productData.stock || 0;

        // Insert into database
        const { data: insertedProduct, error: insertError } = await supabase
          .from("productos")
          .insert([{
            nombre: productData.nombre,
            descripcion: productData.descripcion || null,
            precio: productData.precio,
            precio_original: productData.precio_original || productData.precio,
            stock: productData.stock,
            categoria: productData.categoria || null,
            imagenes: productData.imagenes || null,
            activo: productData.activo,
            destacado: productData.destacado,
            en_oferta: productData.en_oferta || false,
            porcentaje_descuento: productData.porcentaje_descuento || null,
            colores: productData.colores || null,
            tallas: productData.tallas || null,
          }])
          .select()
          .single();

        if (insertError) {
          console.error("Database insert error:", insertError);
          results.push({
            success: false,
            message: `Error al guardar "${productData.nombre}": ${insertError.message}`
          });
          continue;
        }

        productsCreated++;
        results.push({
          success: true,
          message: `✓ Producto "${productData.nombre}" creado - $${productData.precio}`,
          product: productData
        });

      } catch (cmdError) {
        console.error("Command processing error:", cmdError);
        results.push({
          success: false,
          message: `Error inesperado procesando comando`
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        productsCreated,
        results
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-product-creator:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Error desconocido" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
