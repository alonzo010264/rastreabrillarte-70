import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Ticket, Send, MessageCircle, Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
  fecha_creacion: string;
  fecha_actualizacion: string;
  respuestas?: TicketResponse[];
}

interface TicketResponse {
  id: string;
  mensaje: string;
  es_admin: boolean;
  fecha_creacion: string;
  profiles?: {
    nombre_completo: string;
  };
}

interface TicketSupportProps {
  userId: string;
  codigoMembresia: string;
}

const TicketSupport = ({ userId, codigoMembresia }: TicketSupportProps) => {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);

  // Formulario de nuevo ticket
  const [newTicketForm, setNewTicketForm] = useState({
    asunto: "",
    descripcion: "",
    prioridad: "media"
  });

  useEffect(() => {
    loadTickets();
  }, [userId]);

  const loadTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets_ayuda')
        .select(`
          *,
          respuestas_tickets(
            *,
            profiles(nombre_completo)
          )
        `)
        .eq('user_id', userId)
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;

      setTickets(data || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los tickets",
        variant: "destructive"
      });
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicketForm.asunto || !newTicketForm.descripcion) {
      toast({
        title: "Error",
        description: "Completa todos los campos",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tickets_ayuda')
        .insert({
          user_id: userId,
          codigo_membresia: codigoMembresia,
          asunto: newTicketForm.asunto,
          descripcion: newTicketForm.descripcion,
          prioridad: newTicketForm.prioridad,
          estado: 'abierto'
        });

      if (error) throw error;

      toast({
        title: "Ticket creado",
        description: "Tu solicitud de ayuda ha sido enviada"
      });

      setNewTicketForm({
        asunto: "",
        descripcion: "",
        prioridad: "media"
      });
      setIsCreating(false);
      await loadTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el ticket",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
          user_id: userId,
          mensaje: newMessage,
          es_admin: false
        });

      if (error) throw error;

      toast({
        title: "Mensaje enviado",
        description: "Tu respuesta ha sido enviada"
      });

      setNewMessage("");
      await loadTickets();
      
      // Recargar ticket seleccionado
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

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'abierto':
        return 'bg-red-500 text-white';
      case 'en_progreso':
        return 'bg-yellow-500 text-white';
      case 'cerrado':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Ticket size={28} />
          Soporte Técnico
        </h2>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button className="bg-black text-white">
              <Plus className="mr-2" size={18} />
              Nuevo Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Ticket de Ayuda</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Asunto *</Label>
                <Input
                  placeholder="Describe brevemente tu problema"
                  value={newTicketForm.asunto}
                  onChange={(e) => setNewTicketForm({...newTicketForm, asunto: e.target.value})}
                />
              </div>
              <div>
                <Label>Prioridad</Label>
                <Select 
                  value={newTicketForm.prioridad}
                  onValueChange={(v) => setNewTicketForm({...newTicketForm, prioridad: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Descripción *</Label>
                <Textarea
                  placeholder="Describe tu problema con detalle..."
                  rows={5}
                  value={newTicketForm.descripcion}
                  onChange={(e) => setNewTicketForm({...newTicketForm, descripcion: e.target.value})}
                />
              </div>
              <Button 
                onClick={handleCreateTicket} 
                className="w-full"
                disabled={loading}
              >
                {loading ? "Enviando..." : "Crear Ticket"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {tickets.length === 0 ? (
        <Card className="p-8 text-center">
          <Ticket size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">No tienes tickets de ayuda</p>
          <p className="text-sm text-gray-500 mt-2">
            Crea un ticket si necesitas asistencia
          </p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Lista de tickets */}
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <Card
                key={ticket.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                  selectedTicket?.id === ticket.id
                    ? 'border-2 border-black'
                    : ''
                }`}
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-bold text-sm">{ticket.asunto}</h4>
                  <Badge className={getStatusColor(ticket.estado)}>
                    {getStatusText(ticket.estado)}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                  {ticket.descripcion}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Prioridad: {ticket.prioridad}</span>
                  <span>{new Date(ticket.fecha_creacion).toLocaleDateString()}</span>
                </div>
              </Card>
            ))}
          </div>

          {/* Detalle y chat del ticket */}
          <Card className="p-4">
            {selectedTicket ? (
              <div className="flex flex-col h-[500px]">
                <div className="border-b pb-3 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold">{selectedTicket.asunto}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTicket(null)}
                    >
                      <X size={18} />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {selectedTicket.descripcion}
                  </p>
                  <div className="flex gap-2">
                    <Badge className={getStatusColor(selectedTicket.estado)}>
                      {getStatusText(selectedTicket.estado)}
                    </Badge>
                    <Badge variant="outline">{selectedTicket.prioridad}</Badge>
                  </div>
                </div>

                {/* Chat de respuestas */}
                <div className="flex-1 overflow-y-auto space-y-3 mb-3">
                  {selectedTicket.respuestas?.map((resp) => (
                    <div
                      key={resp.id}
                      className={`p-3 rounded-lg ${
                        resp.es_admin
                          ? 'bg-gray-100 ml-4'
                          : 'bg-blue-50 mr-4'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold">
                          {resp.es_admin ? 'Administrador' : 'Tú'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(resp.fecha_creacion).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{resp.mensaje}</p>
                    </div>
                  ))}
                </div>

                {/* Input para responder */}
                {selectedTicket.estado !== 'cerrado' && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Escribe tu mensaje..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage} size="icon">
                      <Send size={18} />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[500px] text-gray-500">
                <div className="text-center">
                  <MessageCircle size={48} className="mx-auto mb-4" />
                  <p>Selecciona un ticket para ver los detalles</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default TicketSupport;