import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Shield, CheckCircle2, XCircle, Search, UserCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const AdminVerificaciones = () => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [ticketAgents, setTicketAgents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<any>(null);

  useEffect(() => {
    loadProfiles();
    loadTicketAgents();
  }, []);

  const loadProfiles = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('nombre_completo');
    
    setProfiles(data || []);
  };

  const loadTicketAgents = async () => {
    const { data } = await supabase
      .from('ticket_agents')
      .select('*');
    
    setTicketAgents(data || []);
  };

  const handleToggleVerification = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ verificado: !currentStatus })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Verificación actualizada",
        description: `Usuario ${!currentStatus ? 'verificado' : 'desverificado'} correctamente`
      });

      await loadProfiles();
    } catch (error) {
      console.error('Error updating verification:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la verificación",
        variant: "destructive"
      });
    }
  };

  const handleAddTicketAgent = async (userId: string, nombre: string) => {
    try {
      const identificador = nombre.toLowerCase().replace(/\s+/g, '_');
      
      const { error } = await supabase
        .from('ticket_agents')
        .insert({ identificador, nombre });

      if (error) throw error;

      // También verificar el usuario
      await supabase
        .from('profiles')
        .update({ verificado: true })
        .eq('user_id', userId);

      toast({
        title: "Agente agregado",
        description: "Agente de tickets agregado correctamente"
      });

      await loadProfiles();
      await loadTicketAgents();
      setSelectedProfile(null);
    } catch (error) {
      console.error('Error adding ticket agent:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el agente",
        variant: "destructive"
      });
    }
  };


  const handleRemoveTicketAgent = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('ticket_agents')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Agente removido",
        description: "Agente de tickets removido correctamente"
      });

      await loadTicketAgents();
    } catch (error) {
      console.error('Error removing ticket agent:', error);
      toast({
        title: "Error",
        description: "No se pudo remover el agente",
        variant: "destructive"
      });
    }
  };

  const filteredProfiles = profiles.filter(p => 
    p.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.correo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isTicketAgent = (userId: string) => {
    return ticketAgents.some(agent => agent.user_id === userId);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Gestión de Verificaciones
          </h1>
          <p className="text-muted-foreground">
            Verifica usuarios y asigna agentes de tickets
          </p>
        </div>

        {/* Agentes de Tickets Actuales */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Agentes de Tickets Activos
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ticketAgents.map((agent) => (
              <Card key={agent.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-bold">{agent.nombre}</p>
                    <p className="text-sm text-muted-foreground">
                      Agente ID: {agent.identificador}
                    </p>
                  </div>
                  <Badge className="bg-green-500">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Activo
                  </Badge>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveTicketAgent(agent.id)}
                  className="w-full"
                >
                  Remover
                </Button>
              </Card>
            ))}
          </div>
        </Card>

        {/* Buscador */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Lista de usuarios */}
        <div className="grid gap-4">
          {filteredProfiles.map((profile) => (
            <Card key={profile.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold">{profile.nombre_completo}</h3>
                    {profile.verificado && (
                      <Badge className="bg-blue-500">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Verificado
                      </Badge>
                    )}
                    {isTicketAgent(profile.user_id) && (
                      <Badge className="bg-green-500">
                        <UserCheck className="w-3 h-3 mr-1" />
                        Agente
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{profile.correo}</p>
                  {profile.codigo_membresia && (
                    <p className="text-xs text-muted-foreground">
                      Código: {profile.codigo_membresia}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={profile.verificado ? "destructive" : "default"}
                    size="sm"
                    onClick={() => handleToggleVerification(profile.user_id, profile.verificado)}
                  >
                    {profile.verificado ? (
                      <>
                        <XCircle className="w-4 h-4 mr-1" />
                        Desverificar
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Verificar
                      </>
                    )}
                  </Button>

                  {!isTicketAgent(profile.nombre_completo) && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedProfile(profile)}
                        >
                          <UserCheck className="w-4 h-4 mr-1" />
                          Hacer Agente
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Agregar como Agente de Tickets</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p>
                            ¿Deseas agregar a <strong>{profile.nombre_completo}</strong> como agente de tickets?
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Los agentes pueden responder y gestionar tickets de soporte de clientes.
                          </p>
                          <Button
                            onClick={() => handleAddTicketAgent(profile.user_id, profile.nombre_completo)}
                            className="w-full"
                          >
                            Confirmar
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminVerificaciones;
