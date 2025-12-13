import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Clock, CreditCard, RefreshCw, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface Solicitud {
  id: string;
  user_id: string;
  tipo: string;
  descripcion: string;
  monto: number | null;
  estado: string;
  ticket_id: string | null;
  admin_revisor: string | null;
  notas_admin: string | null;
  created_at: string;
  profiles?: {
    nombre_completo: string;
    correo: string;
    verificado: boolean;
  };
}

const AdminSolicitudesIA = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
  const [notas, setNotas] = useState('');
  const [monto, setMonto] = useState('');
  const [filter, setFilter] = useState<'all' | 'pendiente' | 'aprobado' | 'rechazado'>('pendiente');

  useEffect(() => {
    checkAdmin();
    loadSolicitudes();
  }, [filter]);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (!roles?.some(r => r.role === 'admin')) {
      navigate('/');
    }
  };

  const loadSolicitudes = async () => {
    try {
      let query = supabase
        .from('solicitudes_ia')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('estado', filter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Load profiles for each solicitud
      const solicitudesWithProfiles = await Promise.all(
        (data || []).map(async (sol) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('nombre_completo, correo, verificado')
            .eq('user_id', sol.user_id)
            .single();
          return { ...sol, profiles: profile };
        })
      );

      setSolicitudes(solicitudesWithProfiles);
    } catch (error) {
      console.error('Error loading solicitudes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAprobar = async (solicitud: Solicitud) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Update solicitud
      await supabase
        .from('solicitudes_ia')
        .update({
          estado: 'aprobado',
          admin_revisor: user.id,
          notas_admin: notas,
          monto: monto ? parseFloat(monto) : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', solicitud.id);

      // If credit request and amount specified, add credit
      if (solicitud.tipo === 'credito' && monto) {
        await supabase.rpc('update_user_balance', {
          p_user_id: solicitud.user_id,
          p_monto: parseFloat(monto),
          p_tipo: 'credito',
          p_concepto: 'Credito aprobado via solicitud IA',
          p_admin_id: user.id
        });
      }

      // Notify user
      await supabase.from('notifications').insert({
        user_id: solicitud.user_id,
        tipo: 'solicitud_aprobada',
        titulo: 'Solicitud aprobada',
        mensaje: `Tu solicitud de ${solicitud.tipo} ha sido aprobada${monto ? `. Monto: RD$${monto}` : ''}`,
        accion_url: '/cuenta'
      });

      toast({ title: 'Solicitud aprobada' });
      setSelectedSolicitud(null);
      setNotas('');
      setMonto('');
      loadSolicitudes();
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleRechazar = async (solicitud: Solicitud) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await supabase
        .from('solicitudes_ia')
        .update({
          estado: 'rechazado',
          admin_revisor: user.id,
          notas_admin: notas,
          updated_at: new Date().toISOString()
        })
        .eq('id', solicitud.id);

      // Notify user
      await supabase.from('notifications').insert({
        user_id: solicitud.user_id,
        tipo: 'solicitud_rechazada',
        titulo: 'Solicitud rechazada',
        mensaje: `Tu solicitud de ${solicitud.tipo} ha sido rechazada. ${notas || ''}`,
        accion_url: '/cuenta'
      });

      toast({ title: 'Solicitud rechazada' });
      setSelectedSolicitud(null);
      setNotas('');
      loadSolicitudes();
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'credito': return <CreditCard className="h-4 w-4" />;
      case 'reembolso': return <RefreshCw className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente': return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600"><Clock className="h-3 w-3 mr-1" /> Pendiente</Badge>;
      case 'aprobado': return <Badge className="bg-green-500"><Check className="h-3 w-3 mr-1" /> Aprobado</Badge>;
      case 'rechazado': return <Badge variant="destructive"><X className="h-3 w-3 mr-1" /> Rechazado</Badge>;
      default: return <Badge>{estado}</Badge>;
    }
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen pt-20 pb-16 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Solicitudes IA</h1>
            <div className="flex gap-2">
              <Button
                variant={filter === 'pendiente' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('pendiente')}
              >
                Pendientes
              </Button>
              <Button
                variant={filter === 'aprobado' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('aprobado')}
              >
                Aprobados
              </Button>
              <Button
                variant={filter === 'rechazado' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('rechazado')}
              >
                Rechazados
              </Button>
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Todos
              </Button>
            </div>
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground">Cargando...</p>
          ) : solicitudes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No hay solicitudes {filter !== 'all' ? filter + 's' : ''}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {solicitudes.map(sol => (
                <Card key={sol.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTipoIcon(sol.tipo)}
                        <CardTitle className="text-lg capitalize">{sol.tipo}</CardTitle>
                      </div>
                      {getEstadoBadge(sol.estado)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">{sol.profiles?.nombre_completo || 'Usuario'}</p>
                      <p className="text-xs text-muted-foreground">{sol.profiles?.correo}</p>
                      {sol.profiles?.verificado && (
                        <Badge variant="outline" className="mt-1 text-xs">Verificado</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{sol.descripcion}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(sol.created_at), { addSuffix: true, locale: es })}
                    </p>
                    
                    {sol.estado === 'pendiente' && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => setSelectedSolicitud(sol)}
                        >
                          Revisar
                        </Button>
                      </div>
                    )}

                    {sol.notas_admin && (
                      <div className="bg-muted p-2 rounded text-xs">
                        <span className="font-medium">Notas:</span> {sol.notas_admin}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Modal de revision */}
          {selectedSolicitud && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getTipoIcon(selectedSolicitud.tipo)}
                    Revisar Solicitud de {selectedSolicitud.tipo}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">{selectedSolicitud.profiles?.nombre_completo}</p>
                    <p className="text-xs text-muted-foreground">{selectedSolicitud.profiles?.correo}</p>
                  </div>
                  <p className="text-sm">{selectedSolicitud.descripcion}</p>

                  {selectedSolicitud.tipo === 'credito' && (
                    <div>
                      <label className="text-sm font-medium">Monto a otorgar (RD$)</label>
                      <input
                        type="number"
                        value={monto}
                        onChange={(e) => setMonto(e.target.value)}
                        placeholder="0.00"
                        className="w-full mt-1 p-2 border rounded"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium">Notas (opcional)</label>
                    <Textarea
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      placeholder="Agregar notas..."
                      className="mt-1"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedSolicitud(null);
                        setNotas('');
                        setMonto('');
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleRechazar(selectedSolicitud)}
                    >
                      <X className="h-4 w-4 mr-1" /> Rechazar
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => handleAprobar(selectedSolicitud)}
                    >
                      <Check className="h-4 w-4 mr-1" /> Aprobar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminSolicitudesIA;
