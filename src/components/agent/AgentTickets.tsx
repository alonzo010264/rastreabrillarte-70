import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Ticket, 
  Send, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  X,
  Mail
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TicketData {
  id: string;
  asunto: string;
  descripcion: string;
  estado: string;
  prioridad: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  codigo_membresia: string | null;
  categoria: string | null;
}

interface TicketResponse {
  id: string;
  mensaje: string;
  es_admin: boolean;
  created_at: string;
}

interface AgentTicketsProps {
  agentId: string;
}

export const AgentTickets = ({ agentId }: AgentTicketsProps) => {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [responses, setResponses] = useState<TicketResponse[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("abierto");

  const loadTickets = useCallback(async () => {
    let query = supabase
      .from("tickets_ayuda")
      .select("*")
      .order("created_at", { ascending: false });

    if (filter !== "todos") {
      query = query.eq("estado", filter);
    }

    const { data, error } = await query;

    if (!error && data) {
      setTickets(data);
    }
    setLoading(false);
  }, [filter]);

  const loadResponses = useCallback(async (ticketId: string) => {
    const { data } = await supabase
      .from("respuestas_tickets")
      .select("id, mensaje, es_admin, created_at")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (data) {
      setResponses(data);
    }
  }, []);

  useEffect(() => {
    loadTickets();

    const channel = supabase
      .channel("tickets_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets_ayuda" },
        () => {
          loadTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadTickets]);

  useEffect(() => {
    if (selectedTicket) {
      loadResponses(selectedTicket.id);

      const channel = supabase
        .channel(`ticket_responses_${selectedTicket.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "respuestas_tickets",
            filter: `ticket_id=eq.${selectedTicket.id}`,
          },
          (payload) => {
            setResponses((prev) => [...prev, payload.new as TicketResponse]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedTicket, loadResponses]);

  const sendResponse = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    try {
      const { error } = await supabase.from("respuestas_tickets").insert({
        ticket_id: selectedTicket.id,
        mensaje: newMessage,
        es_admin: true,
      });

      if (error) throw error;

      // Update ticket status if it was open
      if (selectedTicket.estado === "abierto") {
        await supabase
          .from("tickets_ayuda")
          .update({ 
            estado: "en_progreso",
            agente_asignado_id: agentId,
            updated_at: new Date().toISOString()
          })
          .eq("id", selectedTicket.id);
      }

      setNewMessage("");
      toast({
        title: "Respuesta enviada",
        description: "El cliente ha sido notificado",
      });
    } catch (error) {
      console.error("Error sending response:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar la respuesta",
        variant: "destructive",
      });
    }
  };

  const updateTicketStatus = async (status: string) => {
    if (!selectedTicket) return;

    try {
      const { error } = await supabase
        .from("tickets_ayuda")
        .update({ 
          estado: status,
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedTicket.id);

      if (error) throw error;

      setSelectedTicket({ ...selectedTicket, estado: status });
      loadTickets();
      toast({
        title: "Estado actualizado",
        description: `El ticket ahora esta ${status}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case "abierto":
        return <Badge variant="destructive">Abierto</Badge>;
      case "en_progreso":
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

  const openTicketsCount = tickets.filter(t => t.estado === "abierto").length;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Tickets de Soporte
            {openTicketsCount > 0 && (
              <Badge variant="destructive">{openTicketsCount}</Badge>
            )}
          </CardTitle>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="abierto">Abiertos</SelectItem>
              <SelectItem value="en_progreso">En Progreso</SelectItem>
              <SelectItem value="cerrado">Cerrados</SelectItem>
              <SelectItem value="todos">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid md:grid-cols-2 divide-x">
          {/* Lista de tickets */}
          <ScrollArea className="h-[400px]">
            {tickets.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <Ticket className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hay tickets</p>
              </div>
            ) : (
              <div className="divide-y">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedTicket?.id === ticket.id ? "bg-muted" : ""
                    }`}
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        {getPriorityIcon(ticket.prioridad)}
                        <span className="font-medium text-sm truncate max-w-[150px]">
                          {ticket.asunto}
                        </span>
                      </div>
                      {getStatusBadge(ticket.estado)}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mb-1">
                      {ticket.descripcion}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span>Ticket #{ticket.id.slice(0, 8)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Detalle del ticket */}
          <div className="h-[400px] flex flex-col">
            {selectedTicket ? (
              <>
                <div className="p-3 border-b">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-sm">{selectedTicket.asunto}</h3>
                      <p className="text-xs text-muted-foreground">
                        #{selectedTicket.id.slice(0, 8)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedTicket(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs mb-2">{selectedTicket.descripcion}</p>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedTicket.estado)}
                    {selectedTicket.estado !== "cerrado" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTicketStatus("cerrado")}
                      >
                        Cerrar Ticket
                      </Button>
                    )}
                  </div>
                </div>

                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-3">
                    {responses.map((resp) => (
                      <div
                        key={resp.id}
                        className={`p-2 rounded text-sm ${
                          resp.es_admin
                            ? "bg-primary/10 ml-4"
                            : "bg-muted mr-4"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold">
                            {resp.es_admin ? "Agente" : "Cliente"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(resp.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap">{resp.mensaje}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {selectedTicket.estado !== "cerrado" && (
                  <div className="p-3 border-t">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Escribe tu respuesta..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && sendResponse()}
                      />
                      <Button onClick={sendResponse} disabled={!newMessage.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Ticket className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Selecciona un ticket</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
