import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerificationRequest {
  email: string;
  nombre: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { email, nombre }: VerificationRequest = await req.json();

    console.log(`Sending verification code to: ${email}`);

    // Check rate limiting - max 5 attempts per email in 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentAttempts, error: attemptsError } = await supabase
      .from('email_registration_attempts')
      .select('id')
      .eq('email', email.toLowerCase())
      .gte('created_at', oneHourAgo);

    if (recentAttempts && recentAttempts.length >= 5) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Demasiados intentos. Espera 1 hora antes de intentar de nuevo." 
      }), {
        status: 429,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check if email is already registered
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('correo', email.toLowerCase())
      .maybeSingle();

    if (existingUser) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Este correo ya esta registrado. Intenta iniciar sesion." 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any existing unused codes for this email
    await supabase
      .from('verification_codes')
      .delete()
      .eq('email', email.toLowerCase())
      .eq('used', false);

    // Store the verification code
    const { error: insertError } = await supabase
      .from('verification_codes')
      .insert({
        email: email.toLowerCase(),
        code,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      });

    if (insertError) throw insertError;

    // Log the attempt
    await supabase
      .from('email_registration_attempts')
      .insert({
        email: email.toLowerCase(),
        success: false
      });

    // Send email with code
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not found");
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Codigo de Verificacion BRILLARTE</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #000000; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background-color: #000000; padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 3px;">
              BRILLARTE
            </h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
              El Arte de Brillar
            </p>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 40px 30px; background-color: #ffffff; text-align: center;">
            <h2 style="color: #000000; margin: 0 0 20px 0; font-size: 24px; font-weight: bold;">
              Verifica tu correo electronico
            </h2>
            
            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 20px 0;">
              Hola ${nombre || 'cliente'}! Usa este codigo para completar tu registro en BRILLARTE:
            </p>

            <!-- Code Box -->
            <div style="background-color: #f8f9fa; border: 2px solid #000000; padding: 30px; margin: 30px 0; border-radius: 8px;">
              <p style="color: #000000; font-size: 42px; font-weight: bold; letter-spacing: 10px; margin: 0;">
                ${code}
              </p>
            </div>

            <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 20px 0;">
              Este codigo expira en 15 minutos.<br>
              Si no solicitaste este codigo, ignora este correo.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #000000; padding: 30px; text-align: center;">
            <p style="color: #ffffff; font-size: 16px; margin: 0 0 10px 0; font-weight: bold;">
              BRILLARTE
            </p>
            <p style="color: #999999; font-size: 12px; margin: 0;">
              Santiago de los Caballeros, Republica Dominicana<br>
              ${new Date().getFullYear()} BRILLARTE. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailData = {
      from: "BRILLARTE <verificacion@brillarte.lat>",
      to: [email],
      reply_to: "contacto@brillarte.lat",
      subject: `${code} - Codigo de Verificacion BRILLARTE`,
      html: emailHtml,
    };

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Error de Resend: ${response.status} - ${errorData}`);
    }

    console.log("Verification code sent successfully");

    // Log email sent
    await supabase.from('email_logs').insert({
      destinatario: email,
      asunto: `${code} - Codigo de Verificacion`,
      contenido: "Codigo de verificacion enviado",
      tipo: "verificacion",
      estado: "enviado"
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Codigo enviado correctamente" 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending verification code:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
