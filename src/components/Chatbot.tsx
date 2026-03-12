import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { X, Send, MessageCircle, ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import brillarteLogo from "@/assets/brillarte-logo.jpg";

interface Message {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
}

interface ChatbotProps {
  onClose: () => void;
}

const extractFunctionErrorMessage = async (error: unknown): Promise<string | null> => {
  const functionError = error as {
    message?: string;
    context?: { json?: () => Promise<any>; text?: () => Promise<string> };
  };

  const context = functionError?.context;

  if (context?.json) {
    try {
      const payload = await context.json();
      if (typeof payload?.response === "string" && payload.response.trim()) return payload.response;
      if (typeof payload?.error === "string" && payload.error.trim()) return payload.error;
    } catch {
      // no-op
    }
  }

  if (context?.text) {
    try {
      const rawText = await context.text();
      const parsed = JSON.parse(rawText);
      if (typeof parsed?.response === "string" && parsed.response.trim()) return parsed.response;
      if (typeof parsed?.error === "string" && parsed.error.trim()) return parsed.error;
    } catch {
      // no-op
    }
  }

  const rawMessage = functionError?.message?.trim();
  if (!rawMessage) return null;
  if (rawMessage.toLowerCase().includes("edge function returned")) return null;

  return rawMessage;
};

export const Chatbot = ({ onClose }: ChatbotProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hola, soy Noah, asistente virtual de BRILLARTE. Te ayudo con pedidos, envios, politicas y consultas de la web. Si quieres, tambien puedes enviarme imagenes."
    }
  ]);
  const [input, setInput] = useState("");
  const [email, setEmail] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [needsInfo, setNeedsInfo] = useState(true);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('correo')
          .eq('user_id', user.id)
          .maybeSingle();
        if (profile?.correo) {
          setEmail(profile.correo);
        }
      }
    };
    checkUser();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmitInfo = () => {
    if (!email.trim()) {
      toast({ title: "Error", description: "Por favor ingresa tu correo electronico", variant: "destructive" });
      return;
    }
    setNeedsInfo(false);
    setMessages([{
      role: "assistant",
      content: `Hola! En que puedo ayudarte?${orderCode ? ` Veo que tienes el pedido ${orderCode}.` : ''}`
    }]);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileName = `chatbot/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('chat-images').upload(fileName, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('chat-images').getPublicUrl(fileName);
      return publicUrl;
    } catch (err) {
      console.error('Upload error:', err);
      return null;
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || loading) return;
    
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Error", description: "La imagen no puede superar 10MB", variant: "destructive" });
      return;
    }

    setLoading(true);
    const imageUrl = await uploadImage(file);
    
    if (!imageUrl) {
      toast({ title: "Error", description: "No se pudo subir la imagen", variant: "destructive" });
      setLoading(false);
      return;
    }

    const userMsg: Message = { role: "user", content: input.trim() || "Mira esta imagen", imageUrl };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");

    try {
      const { data, error } = await supabase.functions.invoke('chatbot-assistant', {
        body: {
          messages: newMessages.map(m => ({ role: m.role, content: m.content, imageUrl: m.imageUrl })),
          email,
          orderCode
        }
      });
      if (error) throw error;
      setMessages([...newMessages, { role: "assistant", content: data.response }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Disculpa, tuve un problema. Intentalo de nuevo." }]);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);

    try {
      const { data, error } = await supabase.functions.invoke('chatbot-assistant', {
        body: {
          messages: newMessages.map(m => ({ role: m.role, content: m.content, imageUrl: m.imageUrl })),
          email,
          orderCode
        }
      });
      if (error) throw error;
      setMessages([...newMessages, { role: "assistant", content: data.response }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Disculpa, tuve un problema. Intentalo de nuevo." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Card className="fixed bottom-20 right-4 w-80 sm:w-96 h-[500px] flex flex-col shadow-2xl animate-scale-in z-50 border-2 border-primary/20">
      <div className="bg-primary text-primary-foreground p-3 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={brillarteLogo} alt="Brillarte" className="w-8 h-8 rounded-full" />
          <div>
            <h3 className="font-semibold text-sm">BRILLARTE</h3>
            <p className="text-xs opacity-90">Noah · Asistente Virtual</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => { setIsOpen(false); onClose(); }}
          className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-muted/30">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] p-2.5 rounded-lg text-sm ${
              msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-background border shadow-sm"
            }`}>
              {msg.imageUrl && (
                <img
                  src={msg.imageUrl}
                  alt="Imagen enviada"
                  className="rounded-lg max-w-full max-h-40 object-cover mb-2 cursor-pointer hover:opacity-90"
                  onClick={() => window.open(msg.imageUrl, '_blank')}
                />
              )}
              {msg.content.split('\n').map((line, i) => {
                const imgMatch = line.match(/(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|webp|gif|svg))/i);
                if (imgMatch) {
                  const text = line.replace(imgMatch[0], '').trim();
                  return (
                    <div key={i}>
                      {text && <p>{text}</p>}
                      <img
                        src={imgMatch[0]}
                        alt="Imagen"
                        className="rounded-lg max-w-full max-h-48 object-cover mt-1 cursor-pointer hover:opacity-90"
                        onClick={() => window.open(imgMatch[0], '_blank')}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  );
                }
                return line.trim() ? <p key={i}>{line}</p> : null;
              })}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-background border p-2.5 rounded-lg shadow-sm">
              <p className="text-sm animate-pulse">Escribiendo...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {needsInfo ? (
        <div className="p-3 border-t space-y-2 bg-background">
          <Input placeholder="Tu correo electronico *" value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="h-9 text-sm" />
          <Input placeholder="Codigo de pedido (opcional)" value={orderCode} onChange={(e) => setOrderCode(e.target.value)} className="h-9 text-sm" />
          <Button onClick={handleSubmitInfo} className="w-full h-9 text-sm">Iniciar Chat</Button>
        </div>
      ) : (
        <div className="p-3 border-t flex gap-2 bg-background">
          <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageUpload} />
          <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={loading} className="h-9 w-9 shrink-0">
            <ImagePlus className="w-4 h-4" />
          </Button>
          <Input
            placeholder="Escribe tu mensaje..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            disabled={loading}
            className="h-9 text-sm"
          />
          <Button onClick={handleSendMessage} size="icon" disabled={loading} className="h-9 w-9 shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      )}
    </Card>
  );
};

export const ChatbotTrigger = ({ onClick }: { onClick: () => void }) => {
  return (
    <Button onClick={onClick} className="fixed bottom-4 right-4 rounded-full h-14 w-14 shadow-lg z-50" size="icon">
      <MessageCircle className="h-6 w-6" />
    </Button>
  );
};
