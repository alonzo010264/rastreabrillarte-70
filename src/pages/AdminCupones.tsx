import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Gift, CreditCard, Ticket, Eye, Palette } from "lucide-react";
import { TarjetaPreview3D } from "@/components/cupones/TarjetaPreview3D";

interface TarjetaDiseno {
  color_primario?: string;
  color_secundario?: string;
  texto_frontal?: string;
  texto_trasero?: string;
  titulo?: string;
  descripcion?: string;
  tipo?: string;
  porcentaje_descuento?: number | null;
}

interface TarjetaRegaloRaw {
  id: string;
  codigo: string;
  monto: number;
  diseno: TarjetaDiseno | null;
  usado: boolean;
  activo: boolean;
  user_id_canjeado: string | null;
  fecha_canje: string | null;
  created_at: string;
}

// Helper para extraer datos del diseño
const getDiseno = (tarjeta: TarjetaRegaloRaw): TarjetaDiseno => {
  if (tarjeta.diseno && typeof tarjeta.diseno === 'object') {
    return tarjeta.diseno as TarjetaDiseno;
  }
  return {};
};

// Helper para convertir a props del preview
const toPreviewProps = (tarjeta: TarjetaRegaloRaw) => {
  const d = getDiseno(tarjeta);
  return {
    tipo: d.tipo || 'credito',
    monto: tarjeta.monto,
    porcentaje_descuento: d.porcentaje_descuento,
    titulo: d.titulo || 'Cupón BRILLARTE',
    descripcion: d.descripcion,
    color_primario: d.color_primario || '#000000',
    color_secundario: d.color_secundario || '#FFD700',
    texto_frontal: d.texto_frontal || 'BRILLARTE',
    texto_trasero: d.texto_trasero
  };
};

export default function AdminCupones() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tarjetas, setTarjetas] = useState<TarjetaRegaloRaw[]>([]);
  const [previewTarjeta, setPreviewTarjeta] = useState<TarjetaRegaloRaw | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    tipo: 'credito',
    monto: '',
    porcentaje_descuento: '',
    titulo: '',
    descripcion: '',
    color_primario: '#000000',
    color_secundario: '#FFD700',
    texto_frontal: 'BRILLARTE',
    texto_trasero: ''
  });

  useEffect(() => {
    checkAdmin();
    loadTarjetas();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roles) {
        navigate('/');
        toast.error('Acceso denegado');
        return;
      }
    } catch (error) {
      console.error('Error:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadTarjetas = async () => {
    const { data, error } = await supabase
      .from('tarjetas_regalo')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTarjetas(data as unknown as TarjetaRegaloRaw[]);
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 15; i++) {
      if (i > 0 && i % 4 === 0) code += '-';
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo) {
      toast.error('El título es obligatorio');
      return;
    }

    try {
      const codigo = generateCode();
      
      const diseno = JSON.parse(JSON.stringify({
        color_primario: formData.color_primario,
        color_secundario: formData.color_secundario,
        texto_frontal: formData.texto_frontal,
        texto_trasero: formData.texto_trasero,
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        tipo: formData.tipo,
        porcentaje_descuento: formData.tipo === 'cupon' ? parseFloat(formData.porcentaje_descuento) || 0 : null
      }));
      
      const { error } = await supabase
        .from('tarjetas_regalo')
        .insert([{
          codigo,
          monto: formData.tipo === 'cupon' ? 0 : parseFloat(formData.monto) || 0,
          diseno,
          activo: true,
          usado: false
        }]);

      if (error) throw error;

      toast.success(`¡Tarjeta creada! Código: ${codigo}`);
      resetForm();
      loadTarjetas();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear tarjeta');
    }
  };

  const resetForm = () => {
    setFormData({
      tipo: 'credito',
      monto: '',
      porcentaje_descuento: '',
      titulo: '',
      descripcion: '',
      color_primario: '#000000',
      color_secundario: '#FFD700',
      texto_frontal: 'BRILLARTE',
      texto_trasero: ''
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta tarjeta?')) return;

    try {
      const { error } = await supabase
        .from('tarjetas_regalo')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Tarjeta eliminada');
      loadTarjetas();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const toggleActivo = async (id: string, activo: boolean) => {
    try {
      const { error } = await supabase
        .from('tarjetas_regalo')
        .update({ activo: !activo })
        .eq('id', id);

      if (error) throw error;
      toast.success(activo ? 'Tarjeta desactivada' : 'Tarjeta activada');
      loadTarjetas();
    } catch (error) {
      toast.error('Error al actualizar');
    }
  };

  const getPreviewFromForm = () => ({
    tipo: formData.tipo,
    monto: parseFloat(formData.monto) || 0,
    porcentaje_descuento: parseFloat(formData.porcentaje_descuento) || null,
    titulo: formData.titulo || 'Título del Cupón',
    descripcion: formData.descripcion,
    color_primario: formData.color_primario,
    color_secundario: formData.color_secundario,
    texto_frontal: formData.texto_frontal,
    texto_trasero: formData.texto_trasero
  });

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navigation />
      <PageHeader title="Admin Cupones & Tarjetas" subtitle="Gestiona cupones y tarjetas de regalo" showBackButton />
      
      <div className="container mx-auto py-8 px-4 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="tarjetas" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tarjetas">
                <CreditCard className="w-4 h-4 mr-2" />
                Tarjetas de Regalo
              </TabsTrigger>
              <TabsTrigger value="crear">
                <Plus className="w-4 h-4 mr-2" />
                Crear Nueva
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tarjetas" className="space-y-4">
              {tarjetas.length === 0 ? (
                <Card className="text-center py-12">
                  <Gift className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hay tarjetas creadas</p>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tarjetas.map((tarjeta) => {
                    const d = getDiseno(tarjeta);
                    return (
                      <Card 
                        key={tarjeta.id} 
                        className="overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        <div 
                          className="h-32 relative"
                          style={{
                            background: `linear-gradient(135deg, ${d.color_primario || '#000000'} 0%, ${d.color_secundario || '#FFD700'} 100%)`
                          }}
                        >
                          <div className="p-4 text-white h-full flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                              <p className="text-xs opacity-70">{d.texto_frontal || 'BRILLARTE'}</p>
                              <Badge 
                                variant={tarjeta.usado ? "secondary" : tarjeta.activo ? "default" : "outline"}
                                className="text-xs"
                              >
                                {tarjeta.usado ? 'Canjeado' : tarjeta.activo ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-xl font-bold">
                                {d.tipo === 'cupon' 
                                  ? `${d.porcentaje_descuento}% OFF`
                                  : `RD$${tarjeta.monto?.toLocaleString()}`
                                }
                              </p>
                              <p className="text-sm opacity-80">{d.titulo}</p>
                            </div>
                          </div>
                        </div>
                        
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {tarjeta.codigo}
                            </code>
                            <span className="text-xs text-muted-foreground capitalize">
                              {d.tipo || 'credito'}
                            </span>
                          </div>
                          
                          {tarjeta.usado && tarjeta.fecha_canje && (
                            <p className="text-xs text-muted-foreground">
                              Canjeado: {new Date(tarjeta.fecha_canje).toLocaleDateString()}
                            </p>
                          )}
                          
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setPreviewTarjeta(tarjeta)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm"
                              variant={tarjeta.activo ? "secondary" : "default"}
                              onClick={() => toggleActivo(tarjeta.id, tarjeta.activo)}
                              disabled={tarjeta.usado}
                            >
                              {tarjeta.activo ? 'Desactivar' : 'Activar'}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleDelete(tarjeta.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="crear">
              <div className="grid lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Nueva Tarjeta de Regalo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label>Tipo de Tarjeta</Label>
                        <Select 
                          value={formData.tipo}
                          onValueChange={(v) => setFormData({...formData, tipo: v})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="credito">
                              <span className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4" /> Crédito
                              </span>
                            </SelectItem>
                            <SelectItem value="saldo">
                              <span className="flex items-center gap-2">
                                <Gift className="w-4 h-4" /> Saldo
                              </span>
                            </SelectItem>
                            <SelectItem value="cupon">
                              <span className="flex items-center gap-2">
                                <Ticket className="w-4 h-4" /> Cupón Descuento
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {formData.tipo === 'cupon' ? (
                        <div>
                          <Label>Porcentaje de Descuento (%)</Label>
                          <Input
                            type="number"
                            min="1"
                            max="100"
                            value={formData.porcentaje_descuento}
                            onChange={(e) => setFormData({...formData, porcentaje_descuento: e.target.value})}
                            placeholder="Ej: 20"
                          />
                        </div>
                      ) : (
                        <div>
                          <Label>Monto (RD$)</Label>
                          <Input
                            type="number"
                            min="1"
                            value={formData.monto}
                            onChange={(e) => setFormData({...formData, monto: e.target.value})}
                            placeholder="Ej: 500"
                          />
                        </div>
                      )}

                      <div>
                        <Label>Título *</Label>
                        <Input
                          value={formData.titulo}
                          onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                          placeholder="Ej: Cupón de Bienvenida"
                          required
                        />
                      </div>

                      <div>
                        <Label>Descripción</Label>
                        <Textarea
                          value={formData.descripcion}
                          onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                          placeholder="Descripción del cupón..."
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="flex items-center gap-2">
                            <Palette className="w-4 h-4" />
                            Color Primario
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={formData.color_primario}
                              onChange={(e) => setFormData({...formData, color_primario: e.target.value})}
                              className="w-14 h-10 p-1"
                            />
                            <Input
                              value={formData.color_primario}
                              onChange={(e) => setFormData({...formData, color_primario: e.target.value})}
                              className="flex-1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="flex items-center gap-2">
                            <Palette className="w-4 h-4" />
                            Color Secundario
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={formData.color_secundario}
                              onChange={(e) => setFormData({...formData, color_secundario: e.target.value})}
                              className="w-14 h-10 p-1"
                            />
                            <Input
                              value={formData.color_secundario}
                              onChange={(e) => setFormData({...formData, color_secundario: e.target.value})}
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label>Texto Frontal</Label>
                        <Input
                          value={formData.texto_frontal}
                          onChange={(e) => setFormData({...formData, texto_frontal: e.target.value})}
                          placeholder="BRILLARTE"
                        />
                      </div>

                      <div>
                        <Label>Texto Trasero</Label>
                        <Textarea
                          value={formData.texto_trasero}
                          onChange={(e) => setFormData({...formData, texto_trasero: e.target.value})}
                          placeholder="Mensaje en el reverso de la tarjeta..."
                          rows={2}
                        />
                      </div>

                      <Button type="submit" className="w-full">
                        <Gift className="w-4 h-4 mr-2" />
                        Crear Tarjeta
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Vista Previa 3D</h3>
                  <TarjetaPreview3D tarjeta={getPreviewFromForm()} />
                  <p className="text-sm text-muted-foreground text-center">
                    Haz clic en la tarjeta para voltearla
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {previewTarjeta && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setPreviewTarjeta(null)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <TarjetaPreview3D tarjeta={toPreviewProps(previewTarjeta)} large />
            <p className="text-white text-center mt-4 text-sm">
              Código: <code className="bg-white/20 px-2 py-1 rounded">{previewTarjeta.codigo}</code>
            </p>
            <Button 
              variant="secondary" 
              className="mt-4 mx-auto block"
              onClick={() => {
                navigator.clipboard.writeText(previewTarjeta.codigo);
                toast.success('Código copiado');
              }}
            >
              Copiar Código
            </Button>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
