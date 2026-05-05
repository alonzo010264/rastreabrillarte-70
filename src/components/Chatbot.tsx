import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { X, Send, MessageCircle, Paperclip, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import brillarteLogo from "@/assets/brillarte-logo.jpg";

interface Message {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
  agent?: string;
}

interface ChatbotProps {
  onClose: () => void;
}

// Split AI response into short, natural chat-bubble chunks
const splitIntoChunks = (text: string): string[] => {
  const cleaned = text.replace(/\*\*/g, "").trim();
  // Split by sentence enders, keeping short logical units
  const sentences = cleaned.match(/[^.!?\n]+[.!?]?/g)?.map(s => s.trim()).filter(Boolean) || [cleaned];
  const chunks: string[] = [];
  let current = "";
  for (const s of sentences) {
    if ((current + " " + s).trim().length <= 90 && current) {
      current = (current + " " + s).trim();
    } else {
      if (current) chunks.push(current);
      current = s;
    }
  }
  if (current) chunks.push(current);
  return chunks.slice(0, 5); // cap at 5 bubbles
};

// Simulate human typing: ~40ms per char, min 600ms, max 2500ms
const typingDelay = (text: string) =>
  Math.min(2500, Math.max(600, text.length * 40));

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
    } catch {}
  }
  if (context?.text) {
    try {
      const rawText = await context.text();
      const parsed = JSON.parse(rawText);
      if (typeof parsed?.response === "string" && parsed.response.trim()) return parsed.response;
      if (typeof parsed?.error === "string" && parsed.error.trim()) return parsed.error;
    } catch {}
  }
  const rawMessage = functionError?.message?.trim();
  if (!rawMessage) return null;
  if (rawMessage.toLowerCase().includes("edge function returned")) return null;
  return rawMessage;
};

export const Chatbot = ({ onClose }: ChatbotProps) => {
  const { user, profile, loading: authLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const userEmail = profile?.correo || user?.email || "";
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: userEmail
        ? `Hola ${profile?.nombre_completo?.split(" ")[0] || ""}, soy Noah de BRILLARTE. En que te puedo ayudar?`
        : "Hola, soy Noah de BRILLARTE."
    }
  ]);
  const [input, setInput] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const uploadFile = async (file: File): Promise<{ url: string | null; isImage: boolean }> => {
    try {
      const isImage = file.type.startsWith("image/");
      const bucket = isImage ? "chat-images" : "chat-attachments";
      const fileName = `chatbot/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from(bucket).upload(fileName, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
      return { url: publicUrl, isImage };
    } catch (err) {
      console.error("Upload error:", err);
      return { url: null, isImage: false };
    }
  };

  const sendChunkedAssistantReply = async (
    baseMessages: Message[],
    fullText: string,
  ) => {
    const chunks = splitIntoChunks(fullText);
    let acc = [...baseMessages];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      // show typing indicator
      setLoading(true);
      await new Promise(r => setTimeout(r, typingDelay(chunk)));
      setLoading(false);
      acc = [...acc, { role: "assistant", content: chunk, agent: "Noah" }];
      setMessages(acc);
      // small pause between bubbles
      if (i < chunks.length - 1) {
        await new Promise(r => setTimeout(r, 350));
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || loading) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Error", description: "El archivo no puede superar 10MB", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { url, isImage } = await uploadFile(file);
    if (!url) {
      toast({ title: "Error", description: "No se pudo subir el archivo", variant: "destructive" });
      setLoading(false);
      return;
    }

    const userMsg: Message = {
      role: "user",
      content: input.trim() || (isImage ? "Mira esta imagen" : `He enviado el documento: ${file.name}`),
      ...(isImage ? { imageUrl: url } : { fileUrl: url, fileName: file.name }),
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");

    try {
      const { data, error } = await supabase.functions.invoke("chatbot-assistant", {
        body: {
          messages: newMessages.map(m => ({
            role: m.role,
            content: m.fileUrl ? `${m.content}\n[Archivo adjunto: ${m.fileName} - ${m.fileUrl}]` : m.content,
            imageUrl: m.imageUrl,
          })),
          email: userEmail,
          orderCode,
        }
      });
      if (error) throw error;
      setLoading(false);
      await sendChunkedAssistantReply(newMessages, data.response || "");
    } catch (error) {
      const errorMessage = await extractFunctionErrorMessage(error);
      setMessages([...newMessages, { role: "assistant", content: errorMessage || "Disculpa, hubo un problema. Intenta de nuevo.", agent: "Noah" }]);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
      const { data, error } = await supabase.functions.invoke("chatbot-assistant", {
        body: {
          messages: newMessages.map(m => ({
            role: m.role,
            content: m.fileUrl ? `${m.content}\n[Archivo adjunto: ${m.fileName} - ${m.fileUrl}]` : m.content,
            imageUrl: m.imageUrl,
          })),
          email: userEmail,
          orderCode,
        }
      });
      if (error) throw error;
      setLoading(false);
      await sendChunkedAssistantReply(newMessages, data.response || "");
    } catch (error) {
      const errorMessage = await extractFunctionErrorMessage(error);
      setMessages([...newMessages, { role: "assistant", content: errorMessage || "Disculpa, hubo un problema. Intenta de nuevo.", agent: "Noah" }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Common card wrapper with safe positioning so close button stays visible
  const cardClass =
    "fixed right-4 bottom-24 w-[min(22rem,calc(100vw-2rem))] sm:w-96 h-[min(500px,calc(100vh-140px))] flex flex-col shadow-2xl animate-scale-in z-50 border-2 border-primary/20 transition-all duration-300";

  // Require login + brillarte account
  if (!authLoading && !user) {
    return (
      <Card className={cardClass}>
        <div className="bg-primary text-primary-foreground p-3 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={brillarteLogo} alt="Brillarte" className="w-8 h-8 rounded-full" />
            <div>
              <h3 className="font-semibold text-sm">BRILLARTE</h3>
              <p className="text-xs opacity-90">Noah · Asistente Virtual</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => { setIsOpen(false); onClose(); }}
            className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-4">
          <LogIn className="w-12 h-12 text-primary" />
          <div>
            <h4 className="font-display text-lg mb-2">Inicia sesion para chatear</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Para hablar con Noah necesitas tener una cuenta BRILLARTE iniciada.
            </p>
          </div>
          <div className="flex gap-2 w-full">
            <Button asChild className="flex-1" onClick={() => { setIsOpen(false); onClose(); }}>
              <Link to="/login">Iniciar sesion</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1" onClick={() => { setIsOpen(false); onClose(); }}>
              <Link to="/registro">Registrarme</Link>
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cardClass}>
      <div className="bg-primary text-primary-foreground p-3 rounded-t-lg flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <img src={brillarteLogo} alt="Brillarte" className="w-8 h-8 rounded-full shrink-0" />
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate">BRILLARTE</h3>
            <p className="text-xs opacity-90 truncate">Noah · {userEmail || "Asistente"}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => { setIsOpen(false); onClose(); }}
          className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8 shrink-0" aria-label="Cerrar chat">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-muted/30">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
            <div className={`max-w-[85%] p-2.5 rounded-lg text-sm ${
              msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-background border shadow-sm"
            }`}>
              {msg.imageUrl && (
                <img src={msg.imageUrl} alt="Imagen enviada"
                  className="rounded-lg max-w-full max-h-40 object-cover mb-2 cursor-pointer hover:opacity-90"
                  onClick={() => window.open(msg.imageUrl, "_blank")} />
              )}
              {msg.fileUrl && (
                <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 mb-2 underline text-xs">
                  <Paperclip className="w-3 h-3" />
                  {msg.fileName}
                </a>
              )}
              {msg.content.split("\n").map((line, i) => {
                const imgMatch = line.match(/(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|webp|gif|svg))/i);
                if (imgMatch) {
                  const text = line.replace(imgMatch[0], "").trim();
                  return (
                    <div key={i}>
                      {text && <p>{text}</p>}
                      <img src={imgMatch[0]} alt="Imagen"
                        className="rounded-lg max-w-full max-h-48 object-cover mt-1 cursor-pointer hover:opacity-90"
                        onClick={() => window.open(imgMatch[0], "_blank")}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
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

      <div className="p-3 border-t flex gap-2 bg-background shrink-0">
        <input type="file" ref={fileInputRef}
          accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.xls,.csv"
          className="hidden" onChange={handleFileUpload} />
        <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={loading}
          className="h-9 w-9 shrink-0" aria-label="Adjuntar archivo">
          <Paperclip className="w-4 h-4" />
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
    </Card>
  );
};

export const ChatbotTrigger = ({ onClick }: { onClick: () => void }) => {
  return (
    <Button onClick={onClick}
      className="fixed bottom-4 right-4 rounded-full h-14 w-14 shadow-lg z-50 hover:scale-110 transition-transform animate-fade-in"
      size="icon" aria-label="Abrir chat">
      <MessageCircle className="h-6 w-6" />
    </Button>
  );
};
