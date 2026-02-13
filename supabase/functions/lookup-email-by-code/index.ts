import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface LookupRequest {
  codigoMembresia: string;
}

// Simple in-memory rate limiting (per instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // max attempts
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  
  entry.count++;
  if (entry.count > RATE_LIMIT) {
    return true;
  }
  return false;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Rate limiting by IP
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    if (isRateLimited(ip)) {
      console.warn(`Rate limited IP: ${ip}`);
      return new Response(
        JSON.stringify({ error: "Demasiados intentos. Intenta más tarde." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { codigoMembresia }: LookupRequest = await req.json();

    const code = (codigoMembresia || "").toString().trim();
    // Strict validation: alphanumeric only, 3-20 chars
    if (!code || code.length < 3 || code.length > 20 || !/^[a-zA-Z0-9\-]+$/.test(code)) {
      // Return generic error to prevent enumeration
      return new Response(
        JSON.stringify({ error: "Código no encontrado" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") as string;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      throw new Error("Missing environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data, error } = await supabase
      .from("profiles")
      .select("correo, nombre_completo")
      .eq("codigo_membresia", code)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      // Same generic error for not found - prevents enumeration
      return new Response(
        JSON.stringify({ error: "Código no encontrado" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Minimize data: mask email
    const email = data.correo || "";
    const maskedEmail = email.length > 4 
      ? email.substring(0, 2) + "***" + email.substring(email.indexOf("@"))
      : "***";

    return new Response(JSON.stringify({ correo: maskedEmail, nombre_completo: data.nombre_completo }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error("lookup-email-by-code error:", err);
    return new Response(
      JSON.stringify({ error: "Error interno" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
