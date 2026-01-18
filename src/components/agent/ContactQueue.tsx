import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, 
  Clock, 
  CheckCircle,
  User,
  AlertCircle
} from "lucide-react";

interface ContactRequest {
  id: string;
  email: string;
  nombre: string | null;
  problema: string;
  preguntas_ia: any;
  atendido: boolean;
  agente_asignado: string | null;
  created_at: string;
}

interface ContactQueueProps {
  agentId: string;
}

export const ContactQueue = ({ agentId }: ContactQueueProps) => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = useCallback(async () => {
    const { data, error } = await supabase
      .from("contact_queue")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRequests(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRequests();

    const channel = supabase
      .channel("contact_queue_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contact_queue" },
        () => {
          loadRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadRequests]);

  const markAsAttended = async (requestId: string) => {
    const { error } = await supabase
      .from("contact_queue")
      .update({ 
        atendido: true, 
        agente_asignado: agentId,
        updated_at: new Date().toISOString()
      })
      .eq("id", requestId);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo marcar como atendido",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Marcado como atendido",
        description: "El cliente ha sido notificado",
      });
      loadRequests();
    }
  };

  const getTimeSince = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.floor(diffHours / 24)}d`;
  };

  const pendingRequests = requests.filter(r => !r.atendido);
  const attendedRequests = requests.filter(r => r.atendido);

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
        <CardTitle className="text-lg flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Solicitudes de Contacto
          {pendingRequests.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {pendingRequests.length} pendiente{pendingRequests.length > 1 ? "s" : ""}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px]">
          {requests.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay solicitudes de contacto</p>
            </div>
          ) : (
            <div className="divide-y">
              {/* Pending requests first */}
              {pendingRequests.map((request) => (
                <div key={request.id} className="p-4 bg-yellow-50 dark:bg-yellow-950/20">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {request.nombre || request.email}
                        </p>
                        <p className="text-xs text-muted-foreground">{request.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {getTimeSince(request.created_at)}
                    </div>
                  </div>
                  
                  <div className="bg-background/50 rounded p-2 mb-3 text-sm">
                    <p className="whitespace-pre-wrap">{request.problema}</p>
                  </div>

                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => markAsAttended(request.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marcar como Atendido
                  </Button>
                </div>
              ))}

              {/* Attended requests */}
              {attendedRequests.map((request) => (
                <div key={request.id} className="p-4 opacity-60">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {request.nombre || request.email}
                        </p>
                        <p className="text-xs text-muted-foreground">{request.email}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Atendido</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
