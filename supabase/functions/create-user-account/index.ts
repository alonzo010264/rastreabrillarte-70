import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  password: string;
  nombre: string;
  telefono?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { email, password, nombre, telefono }: CreateUserRequest = await req.json();

    if (!email || !password || !nombre) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Faltan campos requeridos" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "La contraseña debe tener al menos 6 caracteres" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check if email is already registered in profiles
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('correo', email.toLowerCase())
      .maybeSingle();

    if (existingProfile) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Este correo ya está registrado. Intenta iniciar sesión." 
      }), {
        status: 409,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Create user with admin API (auto-confirms email)
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        nombre_completo: nombre,
        telefono: telefono || null,
      },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      
      if (createError.message?.includes('already been registered') || 
          createError.message?.includes('already exists')) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Este correo ya está registrado. Intenta iniciar sesión." 
        }), {
          status: 409,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      throw createError;
    }

    console.log("User created successfully:", userData.user.id);

    // Create profile
    await supabase.from('profiles').upsert({
      user_id: userData.user.id,
      correo: email.toLowerCase(),
      nombre_completo: nombre,
      telefono: telefono || null,
    }, { onConflict: 'user_id' });

    // Assign default role
    await supabase.from('user_roles').upsert({
      user_id: userData.user.id,
      role: 'user',
    }, { onConflict: 'user_id,role' });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Cuenta creada exitosamente",
      userId: userData.user.id
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error creating account:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Error al crear la cuenta" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
