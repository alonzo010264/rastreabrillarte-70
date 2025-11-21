import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Gift, Loader2, Download } from "lucide-react";

export default function AdminTarjetas() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [creatingCard, setCreatingCard] = useState(false);
  const [tarjetas, setTarjetas] = useState<any[]>([]);

  // Estado para crear tarjeta
  const [monto, setMonto] = useState("");
  const [codigoManual, setCodigoManual] = useState("");
  const [generarAleatorio, setGenerarAleatorio] = useState(true);
  const [colorFondo, setColorFondo] = useState("#6366f1");
  const [colorTexto, setColorTexto] = useState("#ffffff");
  const [colorCodigo, setColorCodigo] = useState("#fbbf24");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      // Verificar si es admin
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (roleData?.role !== 'admin') {
        toast.error('No tienes permisos de administrador');
        navigate('/');
        return;
      }

      await loadTarjetas();
    } catch (error) {
      console.error('Error checking auth:', error);
      toast.error('Error al verificar autenticación');
    } finally {
      setLoading(false);
    }
  };

  const loadTarjetas = async () => {
    const { data, error } = await supabase
      .from('tarjetas_regalo')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading cards:', error);
      return;
    }

    setTarjetas(data || []);
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 15; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
      if ((i + 1) % 5 === 0 && i < 14) code += '-';
    }
    return code;
  };

  const handleCreateCard = async () => {
    if (!monto || parseFloat(monto) <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }

    if (!generarAleatorio && !codigoManual.trim()) {
      toast.error("Ingresa un código o selecciona generación aleatoria");
      return;
    }

    setCreatingCard(true);
    try {
      const codigo = generarAleatorio ? generateRandomCode() : codigoManual.toUpperCase();

      // Verificar si el código ya existe
      const { data: existing } = await supabase
        .from('tarjetas_regalo')
        .select('id')
        .eq('codigo', codigo)
        .maybeSingle();

      if (existing) {
        toast.error("Este código ya existe, usa otro");
        return;
      }

      const diseno = {
        colorFondo,
        colorTexto,
        colorCodigo
      };

      // Crear tarjeta
      const { data: tarjeta, error } = await supabase
        .from('tarjetas_regalo')
        .insert({
          codigo,
          monto: parseFloat(monto),
          diseno
        })
        .select()
        .single();

      if (error) throw error;

      await generateCardImage(tarjeta);
      await loadTarjetas();

      toast.success(`¡Tarjeta creada! Código: ${codigo}`);
      
      // Limpiar formulario
      setMonto("");
      setCodigoManual("");
    } catch (error) {
      console.error('Error creating card:', error);
      toast.error("Error al crear tarjeta");
    } finally {
      setCreatingCard(false);
    }
  };

  const generateCardImage = async (tarjeta: any) => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    ctx.fillStyle = tarjeta.diseno.colorFondo;
    ctx.fillRect(0, 0, 800, 500);

    ctx.fillStyle = tarjeta.diseno.colorTexto;
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('BRILLARTE', 400, 150);
    ctx.font = '32px Arial';
    ctx.fillText('Tarjeta de Regalo', 400, 200);

    ctx.font = 'bold 64px Arial';
    ctx.fillText(`$${tarjeta.monto.toFixed(2)}`, 400, 280);

    ctx.fillStyle = tarjeta.diseno.colorCodigo;
    ctx.font = 'bold 24px monospace';
    ctx.fillText(tarjeta.codigo, 400, 350);

    const imageUrl = canvas.toDataURL('image/png');
    
    await supabase
      .from('tarjetas_regalo')
      .update({ imagen_url: imageUrl })
      .eq('id', tarjeta.id);
  };

  const downloadCard = (tarjeta: any) => {
    if (!tarjeta.imagen_url) return;
    
    const link = document.createElement('a');
    link.href = tarjeta.imagen_url;
    link.download = `tarjeta-${tarjeta.codigo}.png`;
    link.click();
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="container mx-auto py-8 px-4 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Gift className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Crear Tarjetas de Regalo</h1>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Formulario de creación */}
            <Card>
              <CardHeader>
                <CardTitle>Nueva Tarjeta de Regalo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="monto">Monto ($)</Label>
                  <Input
                    id="monto"
                    type="number"
                    placeholder="100.00"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="aleatorio"
                      checked={generarAleatorio}
                      onChange={(e) => setGenerarAleatorio(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="aleatorio">Generar código aleatorio</Label>
                  </div>
                  
                  {!generarAleatorio && (
                    <div>
                      <Label htmlFor="codigo-manual">Código Manual (15 dígitos)</Label>
                      <Input
                        id="codigo-manual"
                        placeholder="XXXXX-XXXXX-XXXXX"
                        value={codigoManual}
                        onChange={(e) => setCodigoManual(e.target.value.toUpperCase())}
                        maxLength={17}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Diseño de la Tarjeta</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="color-fondo">Fondo</Label>
                      <Input
                        id="color-fondo"
                        type="color"
                        value={colorFondo}
                        onChange={(e) => setColorFondo(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="color-texto">Texto</Label>
                      <Input
                        id="color-texto"
                        type="color"
                        value={colorTexto}
                        onChange={(e) => setColorTexto(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="color-codigo">Código</Label>
                      <Input
                        id="color-codigo"
                        type="color"
                        value={colorCodigo}
                        onChange={(e) => setColorCodigo(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Vista previa */}
                  <div 
                    className="rounded-lg p-8 text-center shadow-lg"
                    style={{ backgroundColor: colorFondo, color: colorTexto }}
                  >
                    <h3 className="text-2xl font-bold mb-2">BRILLARTE</h3>
                    <p className="text-lg mb-4">Tarjeta de Regalo</p>
                    <p className="text-4xl font-bold mb-4">${monto || '0.00'}</p>
                    <p 
                      className="text-sm font-mono font-bold"
                      style={{ color: colorCodigo }}
                    >
                      {generarAleatorio ? 'XXXXX-XXXXX-XXXXX' : (codigoManual || 'XXXXX-XXXXX-XXXXX')}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleCreateCard}
                  disabled={creatingCard}
                  className="w-full"
                >
                  {creatingCard ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4 mr-2" />
                      Crear Tarjeta
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Lista de tarjetas creadas */}
            <Card>
              <CardHeader>
                <CardTitle>Tarjetas Creadas ({tarjetas.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {tarjetas.map((tarjeta) => (
                    <div key={tarjeta.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-mono font-bold">{tarjeta.codigo}</p>
                          <p className="text-2xl font-bold">${tarjeta.monto.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          {tarjeta.usado ? (
                            <span className="text-xs text-red-600">✓ Canjeada</span>
                          ) : (
                            <span className="text-xs text-green-600">Disponible</span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => downloadCard(tarjeta)}
                        disabled={!tarjeta.imagen_url}
                      >
                        <Download className="w-3 h-3 mr-2" />
                        Descargar Imagen
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
