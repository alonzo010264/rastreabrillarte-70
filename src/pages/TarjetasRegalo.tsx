import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Gift, Download, Check, Loader2 } from "lucide-react";

export default function TarjetasRegalo() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Estado para crear tarjeta
  const [monto, setMonto] = useState("");
  const [codigoManual, setCodigoManual] = useState("");
  const [generarAleatorio, setGenerarAleatorio] = useState(true);
  const [colorFondo, setColorFondo] = useState("#6366f1");
  const [colorTexto, setColorTexto] = useState("#ffffff");
  const [colorCodigo, setColorCodigo] = useState("#fbbf24");
  const [creatingCard, setCreatingCard] = useState(false);

  // Estado para canjear
  const [codigoCanje, setCodigoCanje] = useState("");
  const [canjeando, setCanjeando] = useState(false);

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

      setIsAdmin(roleData?.role === 'admin');
    } catch (error) {
      console.error('Error checking auth:', error);
      toast.error('Error al verificar autenticación');
    } finally {
      setLoading(false);
    }
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

      // Generar imagen de la tarjeta
      await generateCardImage(tarjeta);

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
    // Aquí se podría generar una imagen real de la tarjeta
    // Por ahora solo creamos una representación visual con Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Fondo
    ctx.fillStyle = tarjeta.diseno.colorFondo;
    ctx.fillRect(0, 0, 800, 500);

    // Texto principal
    ctx.fillStyle = tarjeta.diseno.colorTexto;
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('BRILLARTE', 400, 150);
    ctx.font = '32px Arial';
    ctx.fillText('Tarjeta de Regalo', 400, 200);

    // Monto
    ctx.font = 'bold 64px Arial';
    ctx.fillText(`$${tarjeta.monto.toFixed(2)}`, 400, 280);

    // Código
    ctx.fillStyle = tarjeta.diseno.colorCodigo;
    ctx.font = 'bold 24px monospace';
    ctx.fillText(tarjeta.codigo, 400, 350);

    // Guardar la imagen (esto sería con storage en producción)
    const imageUrl = canvas.toDataURL('image/png');
    
    // Actualizar tarjeta con URL de imagen
    await supabase
      .from('tarjetas_regalo')
      .update({ imagen_url: imageUrl })
      .eq('id', tarjeta.id);
  };

  const handleCanjearTarjeta = async () => {
    if (!codigoCanje.trim()) {
      toast.error("Ingresa un código");
      return;
    }

    setCanjeando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Debes iniciar sesión");
        return;
      }

      // Buscar tarjeta
      const { data: tarjeta, error: tarjetaError } = await supabase
        .from('tarjetas_regalo')
        .select('*')
        .eq('codigo', codigoCanje.toUpperCase())
        .maybeSingle();

      if (tarjetaError || !tarjeta) {
        toast.error("Código no válido");
        return;
      }

      if (tarjeta.usado) {
        toast.error("Esta tarjeta ya ha sido canjeada");
        return;
      }

      // Marcar como usada
      const { error: updateError } = await supabase
        .from('tarjetas_regalo')
        .update({
          usado: true,
          user_id_canjeado: user.id,
          fecha_canje: new Date().toISOString()
        })
        .eq('id', tarjeta.id);

      if (updateError) throw updateError;

      // Agregar crédito al usuario usando la función
      await supabase.rpc('update_user_balance', {
        p_user_id: user.id,
        p_monto: tarjeta.monto,
        p_tipo: 'credito',
        p_concepto: `Tarjeta de regalo canjeada: ${tarjeta.codigo}`
      });

      // Notificar
      await supabase.from('notifications').insert({
        user_id: user.id,
        tipo: 'credito',
        titulo: 'Tarjeta Canjeada',
        mensaje: `Has canjeado una tarjeta de regalo por $${tarjeta.monto.toFixed(2)}`
      });

      toast.success(`¡Tarjeta canjeada! Se agregaron $${tarjeta.monto.toFixed(2)} a tu saldo`);
      setCodigoCanje("");
    } catch (error) {
      console.error('Error redeeming card:', error);
      toast.error("Error al canjear tarjeta");
    } finally {
      setCanjeando(false);
    }
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
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Gift className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Tarjetas de Regalo</h1>
          </div>

          <Tabs defaultValue="canjear">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="canjear">Canjear Tarjeta</TabsTrigger>
              {isAdmin && <TabsTrigger value="crear">Crear Tarjeta</TabsTrigger>}
            </TabsList>

            <TabsContent value="canjear">
              <Card>
                <CardHeader>
                  <CardTitle>Canjear Tarjeta de Regalo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="codigo-canje">Código de Tarjeta</Label>
                    <Input
                      id="codigo-canje"
                      placeholder="XXXXX-XXXXX-XXXXX"
                      value={codigoCanje}
                      onChange={(e) => setCodigoCanje(e.target.value.toUpperCase())}
                      maxLength={17}
                    />
                  </div>
                  <Button
                    onClick={handleCanjearTarjeta}
                    disabled={canjeando}
                    className="w-full"
                  >
                    {canjeando ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Canjeando...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Canjear Tarjeta
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {isAdmin && (
              <TabsContent value="crear">
                <Card>
                  <CardHeader>
                    <CardTitle>Crear Nueva Tarjeta de Regalo</CardTitle>
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
                          <Label htmlFor="color-fondo">Color de Fondo</Label>
                          <Input
                            id="color-fondo"
                            type="color"
                            value={colorFondo}
                            onChange={(e) => setColorFondo(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="color-texto">Color de Texto</Label>
                          <Input
                            id="color-texto"
                            type="color"
                            value={colorTexto}
                            onChange={(e) => setColorTexto(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="color-codigo">Color del Código</Label>
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
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
      <Footer />
    </>
  );
}
