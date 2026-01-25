import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.4";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatSummaryRequest {
  sessionId: string;
  clientEmail: string;
  clientName: string;
  agentName: string;
  finalMessage: string;
  resolved: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, clientEmail, clientName, agentName, finalMessage, resolved }: ChatSummaryRequest = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obtener mensajes del chat
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('sender_type, sender_nombre, contenido, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    // Crear resumen de la conversacion
    let chatSummary = '';
    if (messages && messages.length > 0) {
      chatSummary = messages.slice(-10).map(msg => {
        const time = new Date(msg.created_at).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });
        const sender = msg.sender_type === 'cliente' ? (clientName || 'Cliente') : msg.sender_nombre;
        return `[${time}] ${sender}: ${msg.contenido}`;
      }).join('\n');
    }

    const statusText = resolved ? 'RESUELTO' : 'PENDIENTE DE SEGUIMIENTO';
    const statusColor = resolved ? '#22c55e' : '#f59e0b';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #000; color: #fff; padding: 30px; text-align: center; }
            .logo { font-size: 28px; font-weight: bold; letter-spacing: 2px; }
            .content { padding: 30px; background: #fff; }
            .status { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; color: #fff; background: ${statusColor}; }
            .chat-box { background: #f8f8f8; padding: 20px; border-radius: 10px; margin: 20px 0; font-family: monospace; font-size: 13px; white-space: pre-wrap; }
            .agent-info { background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .footer { background: #f8f8f8; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">BRILLARTE</div>
            </div>
            <div class="content">
              <h2>Resumen de tu Conversacion</h2>
              <p>Hola ${clientName || 'cliente'},</p>
              <p>Gracias por contactar a BRILLARTE. Aqui tienes un resumen de tu conversacion:</p>
              
              <div class="agent-info">
                <strong>Atendido por:</strong> ${agentName}<br>
                <strong>Estado:</strong> <span class="status">${statusText}</span>
              </div>
              
              <h3>Mensaje Final del Agente:</h3>
              <p style="background: #e8f4f8; padding: 15px; border-left: 4px solid #000; margin: 15px 0;">
                ${finalMessage}
              </p>
              
              <h3>Ultimos Mensajes:</h3>
              <div class="chat-box">${chatSummary || 'No hay mensajes disponibles'}</div>
              
              <p>Tus datos estan protegidos en BRILLARTE. No compartimos tu informacion con terceros.</p>
              <p>Si necesitas mas ayuda, no dudes en contactarnos nuevamente.</p>
            </div>
            <div class="footer">
              <p>BRILLARTE - El Arte de Brillar</p>
              <p>Santiago de los Caballeros, Republica Dominicana</p>
              <p>WhatsApp: 849-425-2220</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "BRILLARTE Ayuda <ayuda@brillarte.lat>",
      to: [clientEmail],
      subject: `Resumen de tu conversacion - ${resolved ? 'Caso Resuelto' : 'Seguimiento Pendiente'}`,
      html: emailHtml,
    });

    console.log("Email de resumen enviado:", emailResponse);

    // Registrar en logs
    await supabase.from('email_logs').insert({
      destinatario: clientEmail,
      asunto: `Resumen de conversacion - ${statusText}`,
      contenido: `Conversacion con ${agentName}. Estado: ${statusText}`,
      tipo: 'chat_summary',
      estado: 'enviado'
    });

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error en send-chat-summary:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
