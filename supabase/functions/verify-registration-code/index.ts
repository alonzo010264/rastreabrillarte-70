import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerifyRequest {
  email: string;
  code: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { email, code }: VerifyRequest = await req.json();

    console.log(`Verifying code for: ${email}`);

    // Find the verification code
    const { data: verificationData, error: findError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('code', code)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!verificationData) {
      // Increment attempts counter
      await supabase
        .from('verification_codes')
        .update({ attempts: 999 })
        .eq('email', email.toLowerCase())
        .eq('used', false);

      return new Response(JSON.stringify({ 
        success: false, 
        error: "Codigo invalido o expirado. Solicita uno nuevo." 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check attempts
    if (verificationData.attempts >= 5) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Demasiados intentos. Solicita un nuevo codigo." 
      }), {
        status: 429,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Mark code as used
    await supabase
      .from('verification_codes')
      .update({ used: true })
      .eq('id', verificationData.id);

    // Mark registration attempt as successful
    await supabase
      .from('email_registration_attempts')
      .update({ success: true })
      .eq('email', email.toLowerCase())
      .eq('success', false)
      .order('created_at', { ascending: false })
      .limit(1);

    console.log("Code verified successfully");

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Codigo verificado correctamente",
      verified: true
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error verifying code:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
