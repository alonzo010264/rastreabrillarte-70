import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface UrgentCaseRequest {
  clientEmail: string;
  clientName: string;
  problema: string;
  detalles: string;
  agentName: string;
  agentRole: string;
  sessionId: string;
  tipoUrgencia: string;
  mensajesChat?: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      clientEmail,
      clientName,
      problema,
      detalles,
      agentName,
      agentRole,
      sessionId,
      tipoUrgencia,
      mensajesChat = [],
    }: UrgentCaseRequest = await req.json();

    const chatResumen = mensajesChat.length > 0 
      ? mensajesChat.slice(-10).join('\n\n')
      : 'No hay mensajes disponibles';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: linear-gradient(135deg, #1a1a1a, #333); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .section { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px; }
          .urgent { background: #fee2e2; border-left: 4px solid #dc2626; }
          .label { font-weight: bold; color: #666; }
          .value { margin-top: 5px; }
          .chat-log { background: #f9fafb; padding: 15px; border-radius: 8px; max-height: 300px; overflow-y: auto; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>CASO URGENTE - BRILLARTE</h1>
          <p>Se requiere atencion inmediata</p>
        </div>
        
        <div class="content">
          <div class="section urgent">
            <h2>Tipo de Urgencia: ${tipoUrgencia}</h2>
            <p>Este caso ha sido escalado por el agente IA y requiere revision humana.</p>
          </div>
          
          <div class="section">
            <p class="label">Cliente:</p>
            <p class="value">${clientName || 'No proporcionado'}</p>
            
            <p class="label">Correo del Cliente:</p>
            <p class="value"><a href="mailto:${clientEmail}">${clientEmail}</a></p>
            
            <p class="label">ID de Sesion:</p>
            <p class="value">${sessionId}</p>
          </div>
          
          <div class="section">
            <p class="label">Agente que Atendio:</p>
            <p class="value">${agentName} - ${agentRole}</p>
          </div>
          
          <div class="section">
            <p class="label">Problema Reportado:</p>
            <p class="value">${problema}</p>
            
            <p class="label">Detalles:</p>
            <p class="value">${detalles}</p>
          </div>
          
          <div class="section">
            <p class="label">Resumen del Chat:</p>
            <div class="chat-log">
              <pre style="white-space: pre-wrap; font-family: inherit;">${chatResumen}</pre>
            </div>
          </div>
          
          <div class="section">
            <p><strong>Accion Requerida:</strong></p>
            <p>Por favor contactar al cliente dentro de las proximas 24-48 horas a traves del correo proporcionado.</p>
          </div>
        </div>
        
        <div class="footer">
          <p>Este correo fue generado automaticamente por el sistema de chat de BRILLARTE.</p>
          <p>Panel de agentes: <a href="https://brillarte.lovable.app/agente/login">/agente/login</a></p>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Casos Urgentes <caso@oficial.brillarte.lat>",
      to: ["anotasy@gmail.com"],
      subject: `[URGENTE] ${tipoUrgencia} - Cliente: ${clientName || clientEmail}`,
      html: emailHtml,
    });

    console.log("Urgent case notification sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending urgent case notification:", error);
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
