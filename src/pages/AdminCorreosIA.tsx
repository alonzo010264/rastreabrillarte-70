import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, Sparkles, Copy, Check, RefreshCw, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminCorreosIA = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [senderEmail, setSenderEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [wasSent, setWasSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateResponse = async () => {
    if (!emailContent.trim()) {
      toast({ title: "Error", description: "Pega el contenido del correo recibido", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setAiResponse("");
    setWasSent(false);

    try {
      const { data, error } = await supabase.functions.invoke("ai-email-responder", {
        body: { emailContent, senderEmail, subject, action: "generate" },
      });

      if (error) throw error;
      if (data?.response) {
        setAiResponse(data.response);
      } else {
        throw new Error("No se recibio respuesta de la IA");
      }
    } catch (error: any) {
      console.error("Error generating:", error);
      toast({ title: "Error", description: error.message || "No se pudo generar la respuesta", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const sendEmail = async () => {
    if (!senderEmail.trim()) {
      toast({ title: "Error", description: "Ingresa el correo del destinatario", variant: "destructive" });
      return;
    }
    if (!aiResponse.trim()) {
      toast({ title: "Error", description: "Primero genera una respuesta", variant: "destructive" });
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-email-responder", {
        body: { emailContent, senderEmail, subject, action: "send" },
      });

      if (error) throw error;
      if (data?.sent) {
        setWasSent(true);
        toast({ title: "Correo enviado", description: `Respuesta enviada a ${senderEmail}` });
      }
    } catch (error: any) {
      console.error("Error sending:", error);
      toast({ title: "Error al enviar", description: error.message || "No se pudo enviar el correo", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const copyResponse = () => {
    navigator.clipboard.writeText(aiResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetForm = () => {
    setSenderEmail("");
    setSubject("");
    setEmailContent("");
    setAiResponse("");
    setWasSent(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin-dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Mail className="h-6 w-6" />
              Responder Correos con IA
            </h1>
            <p className="text-sm text-muted-foreground">
              Pega el correo recibido, la IA genera una respuesta profesional y la envia desde brillarte@brillarte.lat
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Side */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Correo Recibido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Correo del remitente</label>
                <Input
                  placeholder="cliente@ejemplo.com"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  type="email"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Asunto del correo</label>
                <Input
                  placeholder="Ej: Consulta sobre mi pedido"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Contenido del correo</label>
                <Textarea
                  placeholder="Pega aqui el contenido del correo que recibiste..."
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  rows={10}
                  className="resize-none"
                />
              </div>
              <Button 
                onClick={generateResponse} 
                disabled={isGenerating || !emailContent.trim()} 
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generando respuesta...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generar Respuesta con IA
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Output Side */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Respuesta Generada
                </CardTitle>
                {wasSent && (
                  <Badge variant="default" className="bg-green-600">
                    <Check className="h-3 w-3 mr-1" />
                    Enviado
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiResponse ? (
                <>
                  <div className="bg-muted/50 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border/50">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <Mail className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="text-xs font-medium">De: brillarte@brillarte.lat</p>
                        <p className="text-xs text-muted-foreground">Para: {senderEmail || "---"}</p>
                      </div>
                    </div>
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {aiResponse}
                    </div>
                  </div>

                  <Textarea
                    value={aiResponse}
                    onChange={(e) => setAiResponse(e.target.value)}
                    rows={6}
                    placeholder="Puedes editar la respuesta antes de enviar..."
                    className="resize-none text-sm"
                  />

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={copyResponse} className="flex-1">
                      {copied ? (
                        <><Check className="h-4 w-4 mr-2" /> Copiado</>
                      ) : (
                        <><Copy className="h-4 w-4 mr-2" /> Copiar</>
                      )}
                    </Button>
                    <Button variant="outline" onClick={generateResponse} disabled={isGenerating}>
                      <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                      Regenerar
                    </Button>
                  </div>

                  <Button
                    onClick={sendEmail}
                    disabled={isSending || !senderEmail.trim() || wasSent}
                    className="w-full"
                  >
                    {isSending ? (
                      <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Enviando...</>
                    ) : wasSent ? (
                      <><Check className="h-4 w-4 mr-2" /> Correo Enviado</>
                    ) : (
                      <><Send className="h-4 w-4 mr-2" /> Enviar Correo a {senderEmail || "..."}</>
                    )}
                  </Button>

                  {wasSent && (
                    <Button variant="outline" onClick={resetForm} className="w-full">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Responder otro correo
                    </Button>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mb-4 opacity-30" />
                  <p className="text-sm text-center">
                    Pega el correo recibido y la IA generara una respuesta profesional con todo el conocimiento de BRILLARTE.
                  </p>
                  <p className="text-xs mt-2 text-center opacity-70">
                    El correo se enviara con el logo y branding oficial de BRILLARTE.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminCorreosIA;
