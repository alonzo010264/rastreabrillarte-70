import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  customerName?: string;
  customerEmail?: string;
  orderCode?: string;
  // Legacy fields
  nombre_cliente?: string;
  correo?: string;
  codigo_pedido?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: ContactEmailRequest = await req.json();
    
    // Support both new and legacy field names
    const customerName = requestData.customerName || requestData.nombre_cliente || '';
    const customerEmail = requestData.customerEmail || requestData.correo || '';
    const orderCode = requestData.orderCode || requestData.codigo_pedido || '';

    console.log("Enviando email de confirmación a:", customerEmail);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY no está configurado");
    }

    // Determine if this is a new order or a support request
    const isNewOrder = requestData.customerName && requestData.orderCode;

    let emailHtml: string;
    let subject: string;

    if (isNewOrder) {
      // New order confirmation email
      subject = `Tu código de pedido BrillArte: ${orderCode} - ¡Solicitud recibida!`;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #8B5CF6; text-align: center; margin-bottom: 30px;">BrillArte Joyería</h1>
            
            <h2 style="color: #333; margin-bottom: 20px;">¡Hola ${customerName}!</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Hemos recibido tu solicitud correctamente. Tu código de pedido es:
            </p>
            
            <div style="background-color: #8B5CF6; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h2 style="margin: 0; font-size: 24px; letter-spacing: 2px;">${orderCode}</h2>
              <p style="margin: 10px 0 0 0; font-size: 14px;">Código de pedido BrillArte</p>
            </div>
            
            <div style="background-color: #fee2e2; border: 1px solid #fca5a5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #dc2626; margin-top: 0; font-size: 16px;">⚠️ IMPORTANTE - Mantén tu código seguro</h3>
              <p style="color: #dc2626; margin-bottom: 0; font-size: 14px;">
                Este código es ÚNICO para tu pedido. No lo compartas con nadie a menos que sea de tu total confianza. 
                Si decides compartirlo, la responsabilidad es tuya. BrillArte no se hace responsable por el mal uso del código.
              </p>
            </div>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #8B5CF6; margin-top: 0;">¿Qué sigue?</h3>
              <ul style="color: #666; padding-left: 20px;">
                <li>Puedes rastrear tu pedido con este código en nuestra página</li>
                <li>Nuestros agentes buscarán el artículo que solicitas</li>
                <li>Te contactaremos cuando encontremos el producto</li>
                <li>Te proporcionaremos precio y fecha estimada de entrega</li>
              </ul>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              ¡Gracias por preferirnos! Si tienes alguna pregunta, no dudes en contactarnos.
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #999; font-size: 14px;">
                Gracias por confiar en BrillArte Joyería<br>
                Tu tienda de confianza para joyas únicas
              </p>
            </div>
          </div>
        </div>
      `;
    } else {
      // Legacy support request email
      subject = "¡Gracias por contactarnos! - BrillArte";
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1f2937; margin-bottom: 10px;">¡Gracias por contactarnos!</h1>
              <div style="width: 50px; height: 3px; background-color: #3b82f6; margin: 0 auto;"></div>
            </div>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Hola <strong>${customerName}</strong>,
            </p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Gracias por contactarnos. Estamos aquí para resolver tus problemas.
            </p>
            
            ${orderCode ? `
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #374151; margin: 0;"><strong>Código de pedido:</strong> ${orderCode}</p>
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
    }

    const emailData = {
      from: "BrillArte <onboarding@resend.dev>",
      to: [customerEmail],
      subject: subject,
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