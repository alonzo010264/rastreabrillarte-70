import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  nombre_cliente: string;
  correo: string;
  codigo_pedido?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nombre_cliente, correo, codigo_pedido }: ContactEmailRequest = await req.json();

    console.log("Enviando email de confirmación a:", correo);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY no está configurado");
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1f2937; margin-bottom: 10px;">¡Gracias por contactarnos!</h1>
            <div style="width: 50px; height: 3px; background-color: #3b82f6; margin: 0 auto;"></div>
          </div>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Hola <strong>${nombre_cliente}</strong>,
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Gracias por contactarnos. Estamos aquí para resolver tus problemas.
          </p>
          
          ${codigo_pedido ? `
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #374151; margin: 0;"><strong>Código de pedido:</strong> ${codigo_pedido}</p>
            </div>
          ` : ''}
          
          <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <p style="color: #1e40af; margin: 0; font-weight: 500;">
              ⏰ Generalmente tardamos 1 hora para solucionar tu problema con tu pedido.
            </p>
            <p style="color: #1e40af; margin: 10px 0 0 0;">
              En pocas horas un agente te contactará para resolver tu situación.
            </p>
          </div>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Mientras tanto, puedes seguir rastreando tu pedido en nuestra página web.
          </p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Atentamente,<br>
              <strong style="color: #1f2937;">El equipo de BrillArte</strong>
            </p>
          </div>
        </div>
      </div>
    `;

    const emailData = {
      from: "BrillArte <onboarding@resend.dev>",
      to: [correo],
      subject: "¡Gracias por contactarnos! - BrillArte",
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

    const emailResponse = await response.json();
    console.log("Email enviado exitosamente:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error en send-confirmation-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);