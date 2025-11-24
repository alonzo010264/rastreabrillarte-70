import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Ticket, Send, Filter, CheckCircle2, Clock, XCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TicketData {
  id: string;
  user_id?: string;
  asunto: string;
  descripcion: string;
  estado: string;
  prioridad: string;
  codigo_membresia?: string;
  agente_asignado_id?: string;
  created_at: string;
  profiles?: {
    nombre_completo: string;
    correo: string;
  };
  respuestas_tickets?: Array<{
    id: string;
    mensaje: string;
    es_admin: boolean;
    created_at: string;
    profiles?: {
      nombre_completo: string;
    };
  }>;
}

const AdminTickets = () => {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkUser();
    loadTickets();
    loadAgents();
  }, []);

  useEffect(() => {
    if (filterStatus !== "all") {
      loadTickets();
    }
  }, [filterStatus]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const loadAgents = async () => {
    const { data } = await supabase
      .from('ticket_agents')
      .select('*')
      .eq('activo', true);
    
    setAgents(data || []);
  };

  const loadTickets = async () => {
    try {
      let query = supabase
        .from('tickets_ayuda')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterStatus !== "all") {
        query = query.eq('estado', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Obtener los perfiles de los usuarios de los tickets y sus respuestas
      const ticketsWithData = await Promise.all(
        (data || []).map(async (ticket) => {
          // Obtener perfil del usuario del ticket
          const { data: profile } = await supabase
            .from('profiles')
            .select('nombre_completo, correo')
            .eq('user_id', ticket.user_id)
            .single();

          // Obtener respuestas del ticket
          const { data: responses } = await supabase
            .from('respuestas_tickets')
            .select('*')
            .eq('ticket_id', ticket.id)
            .order('created_at', { ascending: true });

          // Obtener perfiles de los autores de las respuestas
          const responsesWithProfiles = await Promise.all(
            (responses || []).map(async (resp) => {
              if (resp.user_id) {
                const { data: respProfile } = await supabase
                  .from('profiles')
                  .select('nombre_completo')
                  .eq('user_id', resp.user_id)
                  .single();

                return {
                  ...resp,
                  profiles: respProfile
                };
              }
              return resp;
            })
          );

          return {
            ...ticket,
            profiles: profile,
            respuestas_tickets: responsesWithProfiles
          };
        })
      );

      setTickets(ticketsWithData as TicketData[]);
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los tickets",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) {
      return;
    }

    try {
      const { error } = await supabase
        .from('respuestas_tickets')
        .insert({
          ticket_id: selectedTicket.id,
          user_id: user?.id,
          mensaje: newMessage,
          es_admin: true
        });

      if (error) throw error;

      toast({
        title: "Mensaje enviado",
        description: "Respuesta enviada al cliente"
      });

      setNewMessage("");
      await loadTickets();
      
      const updatedTicket = tickets.find(t => t.id === selectedTicket.id);
      if (updatedTicket) {
        setSelectedTicket(updatedTicket);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive"
      });
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tickets_ayuda')
        .update({ estado: newStatus })
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: `Ticket marcado como ${getStatusText(newStatus)}`
      });

      await loadTickets();
      if (selectedTicket?.id === ticketId) {
        const updatedTicket = tickets.find(t => t.id === ticketId);
        if (updatedTicket) {
          setSelectedTicket(updatedTicket);
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive"
      });
    }
  };

  const handleAssignAgent = async (ticketId: string, agentId: string) => {
    try {
      const { error } = await supabase
        .from('tickets_ayuda')
        .update({ 
          agente_asignado_id: agentId,
          estado: 'en_progreso'
        })
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: "Agente asignado",
        description: "Ticket asignado correctamente"
      });

      await loadTickets();
    } catch (error) {
      console.error('Error assigning agent:', error);
      toast({
        title: "Error",
        description: "No se pudo asignar el agente",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'abierto':
        return 'bg-red-500';
      case 'en_progreso':
        return 'bg-yellow-500';
      case 'cerrado':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (estado: string) => {
    switch (estado) {
      case 'abierto':
        return 'Abierto';
      case 'en_progreso':
        return 'En Progreso';
      case 'cerrado':
        return 'Cerrado';
      default:
        return estado;
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'abierto':
        return <Clock className="w-4 h-4" />;
      case 'en_progreso':
        return <Filter className="w-4 h-4" />;
      case 'cerrado':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <XCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Ticket className="w-8 h-8" />
            Gestión de Tickets
          </h1>
          <p className="text-muted-foreground">
            Administra y responde tickets de soporte
          </p>
        </div>

        <div className="mb-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="abierto">Abiertos</SelectItem>
              <SelectItem value="en_progreso">En Progreso</SelectItem>
              <SelectItem value="cerrado">Cerrados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Lista de tickets */}
          <div className="space-y-3">
            {tickets.length === 0 ? (
              <Card className="p-8 text-center">
                <Ticket size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No hay tickets para mostrar</p>
              </Card>
            ) : (
              tickets.map((ticket) => (
                <Card
                  key={ticket.id}
                  className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                    selectedTicket?.id === ticket.id
                      ? 'border-2 border-primary'
                      : ''
                  }`}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-bold text-sm mb-1">{ticket.asunto}</h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        Cliente: {ticket.profiles?.nombre_completo} ({ticket.profiles?.correo})
                      </p>
                      {ticket.codigo_membresia && (
                        <p className="text-xs text-muted-foreground">
                          Código: {ticket.codigo_membresia}
                        </p>
                      )}
                    </div>
                    <Badge className={getStatusColor(ticket.estado)}>
                      {getStatusIcon(ticket.estado)}
                      <span className="ml-1">{getStatusText(ticket.estado)}</span>
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                    {ticket.descripcion}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Prioridad: {ticket.prioridad}</span>
                    <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Detalle del ticket */}
          <Card className="p-6 sticky top-4">
            {selectedTicket ? (
              <div className="flex flex-col h-[600px]">
                <div className="border-b pb-4 mb-4">
                  <h3 className="font-bold text-lg mb-2">{selectedTicket.asunto}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {selectedTicket.descripcion}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Cliente</p>
                      <p className="text-sm font-medium">
                        {selectedTicket.profiles?.nombre_completo}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Estado</p>
                      <Badge className={getStatusColor(selectedTicket.estado)}>
                        {getStatusText(selectedTicket.estado)}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Select 
                      value={selectedTicket.agente_asignado_id || ""}
                      onValueChange={(v) => handleAssignAgent(selectedTicket.id, v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Asignar agente" />
                      </SelectTrigger>
                      <SelectContent>
                        {agents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(selectedTicket.id, 'en_progreso')}
                      >
                        En Progreso
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(selectedTicket.id, 'cerrado')}
                      >
                        Cerrar
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Chat de respuestas */}
                <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                  {selectedTicket.respuestas_tickets?.map((resp) => (
                    <div
                      key={resp.id}
                      className={`p-3 rounded-lg ${
                        resp.es_admin
                          ? 'bg-primary/10 ml-4'
                          : 'bg-muted mr-4'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold">
                          {resp.es_admin ? 'Agente' : 'Cliente'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(resp.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{resp.mensaje}</p>
                    </div>
                  ))}
                </div>

                {/* Input para responder */}
                {selectedTicket.estado !== 'cerrado' && (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Escribe tu respuesta..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={3}
                    />
                    <Button onClick={handleSendMessage} className="w-full">
                      <Send className="mr-2 h-4 w-4" />
                      Enviar Respuesta
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[600px] text-muted-foreground">
                <div className="text-center">
                  <Ticket size={48} className="mx-auto mb-4" />
                  <p>Selecciona un ticket para ver los detalles</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminTickets;
