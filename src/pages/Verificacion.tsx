import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Shield, Check, X, Loader2, Clock, DollarSign, Percent, CreditCard, AlertTriangle, FileText, ShieldAlert } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Verificacion {
  id: string;
  agente_id: string;
  agente_nombre: string;
  target_user_id: string;
  conversation_id: string;
  tipo: string;
  datos: any;
  estado: string;
  firmado_nombre: string | null;
  notas_ceo: string | null;
  created_at: string;
}

const Verificacion = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isCeo, setIsCeo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verificaciones, setVerificaciones] = useState<Verificacion[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notas, setNotas] = useState<Record<string, string>>({});

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser);

    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', currentUser.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      navigate('/');
      return;
    }

    // Check if user is CEO (in config_ceo table or is the official account)
    const { data: ceoConfig } = await supabase
      .from('config_ceo' as any)
      .select('ceo_user_id')
      .limit(1);

    const ceoIds = (ceoConfig as any[])?.map((c: any) => c.ceo_user_id) || [];
    // If no CEO configured, the official account is the CEO
    const isOfficialAccount = currentUser.email === 'oficial@brillarte.lat';
    setIsCeo(ceoIds.includes(currentUser.id) || isOfficialAccount);

    await loadVerificaciones();
    setLoading(false);
  };

  const loadVerificaciones = async () => {
    const { data } = await supabase
      .from('verificaciones_envio' as any)
      .select('*')
      .order('created_at', { ascending: false });

    setVerificaciones((data as any[]) || []);
  };

  const handleAction = async (id: string, action: 'aprobado' | 'rechazado') => {
    if (!user) return;
    setProcessingId(id);

    try {
      const verificacion = verificaciones.find(v => v.id === id);
      if (!verificacion) return;

      // Update verification status
      const { error } = await supabase
        .from('verificaciones_envio' as any)
        .update({
          estado: action,
          firmado_por: user.id,
          firmado_nombre: user.email,
          notas_ceo: notas[id] || null,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', id);

      if (error) throw error;

      // If approved, execute the action
      if (action === 'aprobado') {
        const datos = verificacion.datos;

        if (verificacion.tipo === 'descuento') {
          await supabase.from('codigos_descuento').insert({
            codigo: datos.codigo,
            porcentaje_descuento: datos.porcentaje,
            usos_maximos: 1,
            descripcion: 'Código aprobado por CEO'
          });

          // Send message in conversation
          await supabase.from('messages').insert({
            conversation_id: verificacion.conversation_id,
            sender_id: user.id,
            content: `Te envio un codigo de descuento exclusivo aprobado por la direccion.\n\nCodigo: ${datos.codigo}\nDescuento: ${datos.porcentaje}%\n\nUsalo en tu proxima compra.`,
            tipo: 'text'
          });
        } else if (verificacion.tipo === 'credito') {
          await supabase.rpc('update_user_balance', {
            p_user_id: verificacion.target_user_id,
            p_monto: datos.monto,
            p_tipo: 'credito',
            p_concepto: datos.razon || 'Credito aprobado por CEO',
            p_admin_id: user.id
          });

          await supabase.from('messages').insert({
            conversation_id: verificacion.conversation_id,
            sender_id: user.id,
            content: `Se te han agregado creditos a tu cuenta.\n\nMonto: RD$${parseFloat(datos.monto).toFixed(2)}\nRazon: ${datos.razon || 'Cortesia de BRILLARTE'}\n\nPuedes usarlos en tu proxima compra.`,
            tipo: 'text'
          });
        } else if (verificacion.tipo === 'codigo_pago') {
          await supabase.from('codigos_pago').insert({
            codigo: datos.codigo
          });

          await supabase.from('messages').insert({
            conversation_id: verificacion.conversation_id,
            sender_id: user.id,
            content: `Te envio un codigo de pago.\n\nCodigo: ${datos.codigo}\n\nUsalo para pagar tu pedido.`,
            tipo: 'text'
          });
        } else if (verificacion.tipo === 'documento') {
          // Send the document as a message
          await supabase.from('messages').insert({
            conversation_id: verificacion.conversation_id,
            sender_id: verificacion.agente_id || user.id,
            content: `📎 ${datos.file_name}`,
            tipo: 'file',
            metadata: {
              file_url: datos.file_url,
              file_name: datos.file_name,
              file_type: datos.file_type,
              file_size: datos.file_size
            }
          });
        }
      }

      toast.success(action === 'aprobado' ? 'Aprobado y enviado' : 'Solicitud rechazada');
      await loadVerificaciones();
    } catch (error) {
      console.error(error);
      toast.error('Error al procesar');
    } finally {
      setProcessingId(null);
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'descuento': return <Percent className="h-4 w-4" />;
      case 'credito': return <DollarSign className="h-4 w-4" />;
      case 'codigo_pago': return <CreditCard className="h-4 w-4" />;
      case 'documento': return <FileText className="h-4 w-4" />;
      case 'reporte_seguridad': return <ShieldAlert className="h-4 w-4 text-red-500" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente': return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Pendiente</Badge>;
      case 'aprobado': return <Badge className="bg-green-500 gap-1"><Check className="h-3 w-3" />Aprobado</Badge>;
      case 'rechazado': return <Badge variant="destructive" className="gap-1"><X className="h-3 w-3" />Rechazado</Badge>;
      default: return null;
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen pt-20 pb-16 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
        <Footer />
      </>
    );
  }

  const pendientes = verificaciones.filter(v => v.estado === 'pendiente');
  const procesadas = verificaciones.filter(v => v.estado !== 'pendiente');

  return (
    <>
      <Navigation />
      <div className="min-h-screen pt-20 pb-16 px-4 bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Verificacion de Envios</h1>
              <p className="text-muted-foreground text-sm">
                {isCeo ? 'Aprueba o rechaza las solicitudes de los agentes' : 'Solo el CEO puede aprobar solicitudes'}
              </p>
            </div>
          </div>

          {!isCeo && (
            <Card className="p-6 text-center mb-6">
              <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-yellow-500" />
              <p className="font-semibold">Solo el CEO puede aprobar solicitudes</p>
              <p className="text-muted-foreground text-sm mt-1">
                Puedes ver las solicitudes pero no aprobarlas ni rechazarlas.
              </p>
            </Card>
          )}

          {/* Pendientes */}
          <h2 className="text-xl font-semibold mb-4">
            Pendientes ({pendientes.length})
          </h2>
          
          {pendientes.length === 0 ? (
            <Card className="p-8 text-center mb-8">
              <Check className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <p className="text-muted-foreground">No hay solicitudes pendientes</p>
            </Card>
          ) : (
            <div className="space-y-4 mb-8">
              {pendientes.map((v) => (
                <Card key={v.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getTipoIcon(v.tipo)}
                        <span className="font-semibold capitalize">{v.tipo.replace('_', ' ')}</span>
                        {getEstadoBadge(v.estado)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Solicitado por: <strong>{v.agente_nombre || 'Agente'}</strong>
                      </p>
                      <p className="text-sm text-muted-foreground mb-2">
                        {formatDistanceToNow(new Date(v.created_at), { addSuffix: true, locale: es })}
                      </p>
                      
                      {/* Datos del envío */}
                      <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
                        {v.tipo === 'descuento' && (
                          <>
                            <p>Codigo: <strong>{v.datos.codigo}</strong></p>
                            <p>Descuento: <strong>{v.datos.porcentaje}%</strong></p>
                          </>
                        )}
                        {v.tipo === 'credito' && (
                          <>
                            <p>Monto: <strong>RD${parseFloat(v.datos.monto).toFixed(2)}</strong></p>
                            <p>Razon: {v.datos.razon || 'Sin razon'}</p>
                          </>
                        )}
                        {v.tipo === 'codigo_pago' && (
                          <p>Codigo: <strong>{v.datos.codigo}</strong></p>
                        )}
                        {v.tipo === 'documento' && (
                          <>
                            <p>Archivo: <strong>{v.datos.file_name}</strong></p>
                            <p>Tipo: {v.datos.file_type} | Tamano: {(v.datos.file_size / 1024).toFixed(0)} KB</p>
                            {v.datos.file_url && (
                              <a href={v.datos.file_url} target="_blank" rel="noopener noreferrer" className="text-primary underline text-xs">Ver archivo</a>
                            )}
                          </>
                        )}
                        {v.tipo === 'reporte_seguridad' && (
                          <>
                            <p className="text-destructive font-semibold">Intento de envio de informacion confidencial</p>
                            <p>Razon: {v.datos.razon}</p>
                            {v.datos.detalles && <p>Detalles: {v.datos.detalles}</p>}
                            {v.datos.imagen_url && (
                              <a href={v.datos.imagen_url} target="_blank" rel="noopener noreferrer" className="text-primary underline text-xs">Ver imagen</a>
                            )}
                          </>
                        )}
                      </div>

                      {isCeo && (
                        <div className="mt-3">
                          <Textarea
                            placeholder="Notas (opcional)..."
                            value={notas[v.id] || ''}
                            onChange={(e) => setNotas(prev => ({ ...prev, [v.id]: e.target.value }))}
                            className="mb-2"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleAction(v.id, 'aprobado')}
                              disabled={processingId === v.id}
                              className="gap-1"
                              size="sm"
                            >
                              {processingId === v.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                              Aprobar y Enviar
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleAction(v.id, 'rechazado')}
                              disabled={processingId === v.id}
                              className="gap-1"
                              size="sm"
                            >
                              <X className="h-4 w-4" />
                              Rechazar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Procesadas */}
          <h2 className="text-xl font-semibold mb-4">
            Historial ({procesadas.length})
          </h2>
          <div className="space-y-3">
            {procesadas.map((v) => (
              <Card key={v.id} className="p-4 opacity-75">
                <div className="flex items-center gap-2 mb-1">
                  {getTipoIcon(v.tipo)}
                  <span className="font-medium capitalize text-sm">{v.tipo.replace('_', ' ')}</span>
                  {getEstadoBadge(v.estado)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Por: {v.agente_nombre} | Firmado: {v.firmado_nombre || 'N/A'} | {formatDistanceToNow(new Date(v.created_at), { addSuffix: true, locale: es })}
                </p>
                {v.notas_ceo && <p className="text-xs mt-1 italic">Nota: {v.notas_ceo}</p>}
              </Card>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Verificacion;
