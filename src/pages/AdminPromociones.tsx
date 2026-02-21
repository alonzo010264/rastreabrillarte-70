import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import ImageUpload from "@/components/ImageUpload";
import { ArrowLeft, Plus, Trash2, Gift, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Promocion {
  id: string;
  titulo: string;
  descripcion: string;
  imagen_url: string | null;
  fecha_inicio: string | null;
  fecha_limite: string;
  instrucciones: string | null;
  activa: boolean | null;
  created_at: string | null;
}

export default function AdminPromociones() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [instrucciones, setInstrucciones] = useState("");
  const [activa, setActiva] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/');
      return;
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const { data: profileData } = await supabase
      .from('profiles')
      .select('verificado')
      .eq('user_id', user.id)
      .maybeSingle();

    const hasAdminRole = roles?.some(r => r.role === 'admin');
    const isVerified = profileData?.verificado === true;

    if (!hasAdminRole && !isVerified) {
      navigate('/');
      return;
    }

    await loadPromociones();
  };

  const loadPromociones = async () => {
    try {
      const { data, error } = await supabase
        .from('promociones')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromociones(data || []);
    } catch (error) {
      console.error('Error loading promociones:', error);
      toast.error('Error al cargar promociones');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitulo("");
    setDescripcion("");
    setImagenUrl("");
    setFechaLimite("");
    setInstrucciones("");
    setActiva(true);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!titulo || !descripcion || !fechaLimite) {
      toast.error('Título, descripción y fecha límite son obligatorios');
      return;
    }

    try {
      const promocionData = {
        titulo,
        descripcion,
        imagen_url: imagenUrl || null,
        fecha_limite: fechaLimite,
        instrucciones: instrucciones || null,
        activa,
      };

      let promocionId = editingId;

      if (editingId) {
        const { error } = await supabase
          .from('promociones')
          .update(promocionData)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Promoción actualizada exitosamente');
      } else {
        const { data, error } = await supabase
          .from('promociones')
          .insert([promocionData])
          .select()
          .maybeSingle();

        if (error) throw error;
        promocionId = data.id;
        toast.success('Promoción creada exitosamente');

        // Enviar notificación y correos a suscriptores si la promoción está activa
        if (activa) {
          try {
            // Generar mensaje con IA
            const { data: aiResponse } = await supabase.functions.invoke('generate-promo-notification', {
              body: { titulo, descripcion, imagen_url: imagenUrl }
            });

            const mensajeIA = aiResponse?.mensaje || `Nueva promoción: ${titulo} - Participa ahora`;

            // Obtener todos los perfiles para notificaciones in-app
            const { data: profiles } = await supabase
              .from('profiles')
              .select('user_id, codigo_membresia');

            if (profiles && profiles.length > 0) {
              const notifications = profiles.map(p => ({
                user_id: p.user_id,
                codigo_membresia: p.codigo_membresia,
                tipo: 'promocion',
                titulo: titulo,
                mensaje: mensajeIA,
                imagen_url: imagenUrl || null,
                accion_url: '/promociones'
              }));
              await supabase.from('notifications').insert(notifications);
            }

            // Enviar correos a todos los suscriptores del newsletter
            const { data: emailResult } = await supabase.functions.invoke('send-promo-to-subscribers', {
              body: {
                titulo,
                descripcion,
                imagen_url: imagenUrl || null,
                fecha_limite: fechaLimite
              }
            });

            const sentCount = emailResult?.sent || 0;
            const totalSubs = emailResult?.total || 0;
            toast.success(`¡Promoción creada! Correo enviado a ${sentCount}/${totalSubs} suscriptores`, {
              duration: 5000
            });
          } catch (notifError) {
            console.error('Error enviando notificaciones:', notifError);
            toast.info('Promoción creada, pero hubo un error al enviar notificaciones/correos');
          }
        }
      }

      resetForm();
      loadPromociones();
    } catch (error) {
      console.error('Error saving promocion:', error);
      toast.error('Error al guardar promoción');
    }
  };

  const handleEdit = (promocion: Promocion) => {
    setEditingId(promocion.id);
    setTitulo(promocion.titulo);
    setDescripcion(promocion.descripcion);
    setImagenUrl(promocion.imagen_url || "");
    setFechaLimite(promocion.fecha_limite.split('T')[0]);
    setInstrucciones(promocion.instrucciones || "");
    setActiva(promocion.activa ?? true);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta promoción?')) return;

    try {
      const { error } = await supabase
        .from('promociones')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Promoción eliminada');
      loadPromociones();
    } catch (error) {
      console.error('Error deleting promocion:', error);
      toast.error('Error al eliminar promoción');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <Gift className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Administrar Promociones
        </h1>
      </div>

      {!showForm ? (
        <>
          <Button onClick={() => setShowForm(true)} className="mb-6">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Promoción
          </Button>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {promociones.map((promocion) => (
              <Card key={promocion.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-br from-primary/10 to-primary/5">
                  <CardTitle className="flex items-center justify-between gap-2">
                    <span className="truncate">{promocion.titulo}</span>
                    {promocion.activa && (
                      <Badge variant="secondary" className="shrink-0">Activa</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {promocion.imagen_url && (
                    <img
                      src={promocion.imagen_url}
                      alt={promocion.titulo}
                      className="w-full h-40 object-cover rounded-md mb-4"
                    />
                  )}
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {promocion.descripcion}
                  </p>
                  <div className="flex items-center gap-2 text-sm mb-4">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>Hasta: {new Date(promocion.fecha_limite).toLocaleDateString('es-MX')}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleEdit(promocion)} size="sm" className="flex-1">
                      Editar
                    </Button>
                    <Button
                      onClick={() => handleDelete(promocion.id)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-6 h-6" />
              {editingId ? 'Editar Promoción' : 'Nueva Promoción'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="titulo">Título de la Promoción *</Label>
                <Input
                  id="titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: ¡Sorteo de Bisutería!"
                  required
                />
              </div>

              <div>
                <Label htmlFor="descripcion">Descripción *</Label>
                <Textarea
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describe los detalles de la promoción o sorteo..."
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="imagen">Imagen de la Promoción</Label>
                <ImageUpload
                  onImageUpload={setImagenUrl}
                  currentImage={imagenUrl}
                />
              </div>

              <div>
                <Label htmlFor="fecha_limite">Fecha Límite *</Label>
                <Input
                  id="fecha_limite"
                  type="date"
                  value={fechaLimite}
                  onChange={(e) => setFechaLimite(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="instrucciones">Instrucciones para Participar</Label>
                <Textarea
                  id="instrucciones"
                  value={instrucciones}
                  onChange={(e) => setInstrucciones(e.target.value)}
                  placeholder="Pasos que deben seguir los participantes..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="activa"
                  checked={activa}
                  onCheckedChange={setActiva}
                />
                <Label htmlFor="activa">Promoción Activa</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingId ? 'Actualizar' : 'Crear'} Promoción
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}