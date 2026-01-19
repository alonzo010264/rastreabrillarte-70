import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { 
  Ticket, 
  Search, 
  MessageCircle, 
  Send, 
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowLeft
} from "lucide-react";

interface TicketData {
  id: string;
  asunto: string;
  descripcion: string;
  estado: string;
  prioridad: string;
  created_at: string;
  updated_at: string;
}

interface TicketResponse {
  id: string;
  mensaje: string;
  es_admin: boolean;
  created_at: string;
}

const RastrearTicket = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [ticketId, setTicketId] = useState(searchParams.get("id") || "");
  const [email, setEmail] = useState("");
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [responses, setResponses] = useState<TicketResponse[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: profile } = await supabase
          .from("profiles")
          .select("correo")
          .eq("user_id", session.user.id)
          .single();
        if (profile) {
          setEmail(profile.correo);
        }
      }
    };
    checkUser();
  }, []);

  const loadTicket = useCallback(async () => {
    if (!ticketId.trim()) {
      toast({
        title: "Error",
        description: "Ingresa un numero de ticket",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Search by ticket ID (first 8 chars or full ID)
      const { data: ticketData, error } = await supabase
        .from("tickets_ayuda")
        .select("*")
        .or(`id.ilike.${ticketId}%,id.eq.${ticketId}`)
        .single();

      if (error || !ticketData) {
        toast({
          title: "Ticket no encontrado",
          description: "Verifica el numero de ticket e intenta de nuevo",
          variant: "destructive",
        });
        setTicket(null);
        return;
      }

      setTicket(ticketData);

      // Load responses
      const { data: responsesData } = await supabase
        .from("respuestas_tickets")
        .select("id, mensaje, es_admin, created_at")
        .eq("ticket_id", ticketData.id)
        .order("created_at", { ascending: true });

      setResponses(responsesData || []);

      // Set up realtime subscription
      const channel = supabase
        .channel(`ticket_responses_${ticketData.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "respuestas_tickets",
            filter: `ticket_id=eq.${ticketData.id}`,
          },
          (payload) => {
            setResponses((prev) => [...prev, payload.new as TicketResponse]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error("Error loading ticket:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el ticket",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [ticketId, toast]);

  useEffect(() => {
    if (searchParams.get("id")) {
      loadTicket();
    }
  }, [searchParams, loadTicket]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !ticket) return;

    if (!user) {
      toast({
        title: "Inicia sesion",
        description: "Debes iniciar sesion para responder al ticket",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("respuestas_tickets").insert({
        ticket_id: ticket.id,
        user_id: user.id,
        mensaje: newMessage,
        es_admin: false,
      });

      if (error) throw error;

      setNewMessage("");
      toast({
        title: "Mensaje enviado",
        description: "Tu respuesta ha sido enviada",
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case "abierto":
        return <Badge variant="destructive">Abierto</Badge>;
      case "en_progreso":
      case "en progreso":
        return <Badge className="bg-yellow-500">En Progreso</Badge>;
      case "cerrado":
        return <Badge variant="secondary">Cerrado</Badge>;
      default:
        return <Badge>{estado}</Badge>;
    }
  };

  const getPriorityIcon = (prioridad: string) => {
    switch (prioridad?.toLowerCase()) {
      case "alta":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "media":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <Ticket className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h1 className="text-3xl font-bold mb-2">Rastrear Ticket</h1>
            <p className="text-muted-foreground">
              Ingresa tu numero de ticket para ver el estado y responder
            </p>
          </div>

          {!ticket ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex gap-3">
                  <Input
                    placeholder="Numero de ticket (ej: a1b2c3d4)"
                    value={ticketId}
                    onChange={(e) => setTicketId(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && loadTicket()}
                  />
                  <Button onClick={loadTicket} disabled={loading}>
                    {loading ? (
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Buscar
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Ticket Info */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{ticket.asunto}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Ticket #{ticket.id.slice(0, 8)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPriorityIcon(ticket.prioridad)}
                      {getStatusBadge(ticket.estado)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">{ticket.descripcion}</p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Creado: {new Date(ticket.created_at).toLocaleDateString()}</span>
                    <span>Actualizado: {new Date(ticket.updated_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Responses */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Conversacion
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px] p-4">
                    <div className="space-y-4">
                      {responses.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No hay respuestas aun</p>
                          <p className="text-sm">Un agente respondera pronto</p>
                        </div>
                      ) : (
                        responses.map((resp) => (
                          <div
                            key={resp.id}
                            className={`p-3 rounded-lg ${
                              resp.es_admin
                                ? "bg-primary/10 ml-4"
                                : "bg-muted mr-4"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold">
                                {resp.es_admin ? "Agente BRILLARTE" : "Tu"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(resp.created_at).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{resp.mensaje}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>

                  {/* Input */}
                  {ticket.estado?.toLowerCase() !== "cerrado" && (
                    <div className="p-4 border-t">
                      {user ? (
                        <div className="flex gap-2">
                          <Textarea
                            placeholder="Escribe tu respuesta..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            rows={2}
                          />
                          <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-sm text-muted-foreground mb-2">
                            Inicia sesion para responder
                          </p>
                          <Button onClick={() => navigate("/login")}>
                            Iniciar Sesion
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Back to search */}
              <Button
                variant="outline"
                onClick={() => setTicket(null)}
                className="w-full"
              >
                Buscar otro ticket
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RastrearTicket;
