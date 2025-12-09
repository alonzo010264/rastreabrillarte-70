import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Shield, CheckCircle2, XCircle, Search, UserCheck, Clock, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface SolicitudVerificacion {
  id: string;
  user_id: string;
  motivo: string;
  descripcion: string | null;
  nombre_negocio: string | null;
  instagram: string | null;
  sitio_web: string | null;
  whatsapp: string | null;
  estado: string;
  notas_admin: string | null;
  created_at: string;
  profiles?: {
    nombre_completo: string;
    correo: string;
    avatar_url: string | null;
  };
}

const AdminVerificaciones = () => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [ticketAgents, setTicketAgents] = useState<any[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudVerificacion[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [notasAdmin, setNotasAdmin] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const { data: profileData } = await supabase
      .from('profiles')
      .select('verificado')
      .eq('user_id', user.id)
      .single();

    const hasAdminRole = roles?.some(r => r.role === 'admin');
    const isVerified = profileData?.verificado === true;

    if (hasAdminRole || isVerified) {
      loadProfiles();
      loadTicketAgents();
      loadSolicitudes();
    }
  };

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

  const loadSolicitudes = async () => {
    const { data, error } = await supabase
      .from('solicitudes_verificacion')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading solicitudes:', error);
      return;
    }

    // Cargar perfiles de cada solicitud
    const solicitudesConPerfiles = await Promise.all(
      (data || []).map(async (sol) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('nombre_completo, correo, avatar_url')
          .eq('user_id', sol.user_id)
          .single();

        return { ...sol, profiles: profile };
      })
    );

    setSolicitudes(solicitudesConPerfiles);
  };

  const handleToggleVerification = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ verificado: !currentStatus })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Verificacion actualizada",
        description: `Usuario ${!currentStatus ? 'verificado' : 'desverificado'} correctamente`
      });

      await loadProfiles();
    } catch (error) {
      console.error('Error updating verification:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la verificacion",
        variant: "destructive"
      });
    }
  };

  const handleAddTicketAgent = async (userId: string, nombre: string) => {
    try {
      const identificador = nombre.toLowerCase().replace(/\s+/g, '_');
      
      const { error } = await supabase
        .from('ticket_agents')
        .insert({ identificador, nombre, user_id: userId });

      if (error) throw error;

      // Tambien verificar el usuario
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


  const handleRemoveTicketAgent = async (agentId: string) => {
    try {
      const { error } = await supabase
        .from('ticket_agents')
        .delete()
        .eq('id', agentId);

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

  const handleApproveSolicitud = async (solicitud: SolicitudVerificacion) => {
    setProcessingId(solicitud.id);
    try {
      // Actualizar estado de la solicitud
      const { error: solError } = await supabase
        .from('solicitudes_verificacion')
        .update({ 
          estado: 'aprobada',
          notas_admin: notasAdmin || null
        })
        .eq('id', solicitud.id);

      if (solError) throw solError;

      // Otorgar verificacion al usuario
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ verificado: true })
        .eq('user_id', solicitud.user_id);

      if (profileError) throw profileError;

      toast({
        title: "Solicitud aprobada",
        description: "El usuario ahora tiene la insignia de verificacion"
      });

      setNotasAdmin("");
      await loadSolicitudes();
      await loadProfiles();
    } catch (error) {
      console.error('Error approving solicitud:', error);
      toast({
        title: "Error",
        description: "No se pudo aprobar la solicitud",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectSolicitud = async (solicitud: SolicitudVerificacion) => {
    setProcessingId(solicitud.id);
    try {
      const { error } = await supabase
        .from('solicitudes_verificacion')
        .update({ 
          estado: 'rechazada',
          notas_admin: notasAdmin || 'Solicitud rechazada'
        })
        .eq('id', solicitud.id);

      if (error) throw error;

      toast({
        title: "Solicitud rechazada",
        description: "La solicitud ha sido rechazada"
      });

      setNotasAdmin("");
      await loadSolicitudes();
    } catch (error) {
      console.error('Error rejecting solicitud:', error);
      toast({
        title: "Error",
        description: "No se pudo rechazar la solicitud",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const filteredProfiles = profiles.filter(p => 
    p.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.correo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isTicketAgent = (userId: string) => {
    return ticketAgents.some(agent => agent.user_id === userId);
  };

  const pendingSolicitudes = solicitudes.filter(s => s.estado === 'pendiente');
  const processedSolicitudes = solicitudes.filter(s => s.estado !== 'pendiente');

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'aprobada':
        return <Badge className="bg-green-500">Aprobada</Badge>;
      case 'rechazada':
        return <Badge className="bg-red-500">Rechazada</Badge>;
      default:
        return <Badge className="bg-yellow-500">Pendiente</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Gestion de Verificaciones
          </h1>
          <p className="text-muted-foreground">
            Verifica usuarios, gestiona solicitudes y asigna agentes de tickets
          </p>
        </div>

        <Tabs defaultValue="solicitudes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="solicitudes" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Solicitudes ({pendingSolicitudes.length})
            </TabsTrigger>
            <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
            <TabsTrigger value="agentes">Agentes</TabsTrigger>
          </TabsList>

          {/* Tab de Solicitudes */}
          <TabsContent value="solicitudes" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Solicitudes Pendientes
              </h2>
              
              {pendingSolicitudes.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay solicitudes pendientes
                </p>
              ) : (
                <div className="space-y-4">
                  {pendingSolicitudes.map((sol) => (
                    <Card key={sol.id} className="p-4 border-2 border-yellow-500/20">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold">{sol.profiles?.nombre_completo}</h3>
                            {getEstadoBadge(sol.estado)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {sol.profiles?.correo}
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                            <div>
                              <span className="font-medium">Motivo:</span> {sol.motivo}
                            </div>
                            {sol.nombre_negocio && (
                              <div>
                                <span className="font-medium">Negocio:</span> {sol.nombre_negocio}
                              </div>
                            )}
                            {sol.instagram && (
                              <div>
                                <span className="font-medium">Instagram:</span> @{sol.instagram}
                              </div>
                            )}
                            {sol.sitio_web && (
                              <div>
                                <span className="font-medium">Web:</span> {sol.sitio_web}
                              </div>
                            )}
                          </div>
                          {sol.descripcion && (
                            <p className="text-sm bg-muted p-3 rounded">
                              {sol.descripcion}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Enviada: {new Date(sol.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div className="flex flex-col gap-2 min-w-[200px]">
                          <Label>Notas (opcional)</Label>
                          <Textarea
                            placeholder="Notas para el registro..."
                            value={notasAdmin}
                            onChange={(e) => setNotasAdmin(e.target.value)}
                            className="text-sm"
                            rows={2}
                          />
                          <Button
                            onClick={() => handleApproveSolicitud(sol)}
                            disabled={processingId === sol.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Aprobar y Verificar
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleRejectSolicitud(sol)}
                            disabled={processingId === sol.id}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Rechazar
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>

            {processedSolicitudes.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Historial de Solicitudes</h2>
                <div className="space-y-3">
                  {processedSolicitudes.map((sol) => (
                    <Card key={sol.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{sol.profiles?.nombre_completo}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {sol.motivo}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getEstadoBadge(sol.estado)}
                          <span className="text-xs text-muted-foreground">
                            {new Date(sol.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {sol.notas_admin && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Nota: {sol.notas_admin}
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Tab de Usuarios */}
          <TabsContent value="usuarios" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o correo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

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
                          Codigo: {profile.codigo_membresia}
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
                            Quitar
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Verificar
                          </>
                        )}
                      </Button>

                      {!isTicketAgent(profile.user_id) && (
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
                                Deseas agregar a <strong>{profile.nombre_completo}</strong> como agente de tickets?
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
          </TabsContent>

          {/* Tab de Agentes */}
          <TabsContent value="agentes">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Agentes de Tickets Activos
              </h2>
              
              {ticketAgents.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay agentes de tickets registrados
                </p>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ticketAgents.map((agent) => (
                    <Card key={agent.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-bold">{agent.nombre}</p>
                          <p className="text-sm text-muted-foreground">
                            ID: {agent.identificador}
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
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default AdminVerificaciones;