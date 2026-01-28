import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Gift, Ticket, CreditCard, Sparkles, Users, Trophy, Star, CheckCircle } from "lucide-react";
import { TarjetaCanjeada } from "@/components/cupones/TarjetaCanjeada";
import { AnimacionCanje } from "@/components/cupones/AnimacionCanje";

interface TarjetaRegalo {
  id: string;
  codigo: string;
  monto: number;
  tipo: string;
  titulo: string;
  descripcion: string;
  color_primario: string;
  color_secundario: string;
  texto_frontal: string;
  texto_trasero: string;
  porcentaje_descuento: number | null;
  usado: boolean;
}

interface CuponCanjeado {
  id: string;
  tarjeta_id: string;
  valor_obtenido: number;
  tipo: string;
  created_at: string;
  usado: boolean;
  tarjetas_regalo?: TarjetaRegalo;
}

export default function Cupones() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [codigo, setCodigo] = useState("");
  const [canjeando, setCanjeando] = useState(false);
  const [mostrarAnimacion, setMostrarAnimacion] = useState(false);
  const [tarjetaGanada, setTarjetaGanada] = useState<TarjetaRegalo | null>(null);
  const [cuponesCanjeados, setCuponesCanjeados] = useState<CuponCanjeado[]>([]);
  const [codigoReferido, setCodigoReferido] = useState("");
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      setUser(user);

      // Cargar perfil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setCodigoReferido(profileData.codigo_referido || "");
      }

      // Cargar cupones canjeados
      await loadCuponesCanjeados(user.id);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const loadCuponesCanjeados = async (userId: string) => {
    const { data, error } = await supabase
      .from('cupones_canjeados')
      .select(`
        *,
        tarjetas_regalo (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCuponesCanjeados(data);
    }
  };

  const handleCanjear = async () => {
    if (!codigo.trim() || codigo.length < 10) {
      toast.error('Por favor ingresa un código válido de al menos 10 caracteres');
      return;
    }

    setCanjeando(true);

    try {
      // Buscar tarjeta por código
      const { data: tarjeta, error: tarjetaError } = await supabase
        .from('tarjetas_regalo')
        .select('*')
        .eq('codigo', codigo.toUpperCase())
        .eq('activo', true)
        .eq('usado', false)
        .maybeSingle();

      if (tarjetaError) throw tarjetaError;

      if (!tarjeta) {
        toast.error('Código inválido, ya usado o expirado');
        setCanjeando(false);
        return;
      }

      // Verificar si ya fue canjeado por este usuario
      const { data: yaCanjeado } = await supabase
        .from('cupones_canjeados')
        .select('id')
        .eq('user_id', user.id)
        .eq('tarjeta_id', tarjeta.id)
        .maybeSingle();

      if (yaCanjeado) {
        toast.error('Ya has canjeado este cupón anteriormente');
        setCanjeando(false);
        return;
      }

      // Marcar tarjeta como usada
      await supabase
        .from('tarjetas_regalo')
        .update({ 
          usado: true,
          user_id_canjeado: user.id,
          fecha_canje: new Date().toISOString()
        })
        .eq('id', tarjeta.id);

      // Crear registro de canje
      await supabase
        .from('cupones_canjeados')
        .insert({
          user_id: user.id,
          tarjeta_id: tarjeta.id,
          valor_obtenido: tarjeta.monto || tarjeta.porcentaje_descuento || 0,
          tipo: tarjeta.tipo || 'credito'
        });

      // Si es crédito/saldo, agregar al perfil
      if (tarjeta.tipo === 'credito' || tarjeta.tipo === 'saldo') {
        const nuevoSaldo = (profile?.saldo || 0) + (tarjeta.monto || 0);
        await supabase
          .from('profiles')
          .update({ saldo: nuevoSaldo })
          .eq('user_id', user.id);
      }

      // Mostrar animación
      setTarjetaGanada(tarjeta);
      setMostrarAnimacion(true);
      setCodigo("");
      
      // Recargar cupones
      await loadCuponesCanjeados(user.id);
      
    } catch (error) {
      console.error('Error al canjear:', error);
      toast.error('Error al canjear el código');
    } finally {
      setCanjeando(false);
    }
  };

  const generarCodigoReferido = async () => {
    if (profile?.codigo_referido) return;

    try {
      const nuevocodigo = 'REF' + Math.random().toString(36).substring(2, 10).toUpperCase();
      
      await supabase
        .from('profiles')
        .update({ codigo_referido: nuevocodigo })
        .eq('user_id', user.id);

      setCodigoReferido(nuevocodigo);
      toast.success('¡Código de referido generado!');
    } catch (error) {
      toast.error('Error al generar código');
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navigation />
      <PageHeader 
        title="Cupones BRILLARTE" 
        subtitle="Canjea tus códigos y obtén increíbles beneficios" 
        showBackButton 
      />
      
      <div className="container mx-auto py-8 px-4 min-h-screen">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Sección de Canje */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <Gift className="w-8 h-8 text-primary animate-bounce" />
                Canjear Código
              </CardTitle>
              <p className="text-muted-foreground">
                Ingresa tu código de 15 dígitos para reclamar tu premio
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <Input
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX-XXXX-XXX"
                  className="text-center text-lg tracking-widest font-mono"
                  maxLength={20}
                />
                <Button 
                  onClick={handleCanjear} 
                  disabled={canjeando || !codigo.trim()}
                  className="min-w-[120px]"
                >
                  {canjeando ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Canjeando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Canjear
                    </span>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Información sobre cupones */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="text-center p-6 hover:shadow-lg transition-all hover:-translate-y-1">
              <Ticket className="w-12 h-12 mx-auto text-primary mb-4" />
              <h3 className="font-bold mb-2">Cupones de Descuento</h3>
              <p className="text-sm text-muted-foreground">
                Obtén porcentajes de descuento exclusivos en tus compras
              </p>
            </Card>
            
            <Card className="text-center p-6 hover:shadow-lg transition-all hover:-translate-y-1">
              <CreditCard className="w-12 h-12 mx-auto text-green-500 mb-4" />
              <h3 className="font-bold mb-2">Crédito BRILLARTE</h3>
              <p className="text-sm text-muted-foreground">
                Recibe saldo directo para usar en la tienda
              </p>
            </Card>
            
            <Card className="text-center p-6 hover:shadow-lg transition-all hover:-translate-y-1">
              <Gift className="w-12 h-12 mx-auto text-purple-500 mb-4" />
              <h3 className="font-bold mb-2">Regalos Especiales</h3>
              <p className="text-sm text-muted-foreground">
                Premios exclusivos para clientes frecuentes
              </p>
            </Card>
          </div>

          {/* Programa de Referidos */}
          <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-6 h-6 text-purple-500" />
                Programa de Referidos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                ¡Invita amigos y gana recompensas! Por cada persona que se registre con tu código 
                y realice una compra, ambos recibirán beneficios exclusivos.
              </p>
              
              {codigoReferido ? (
                <div className="bg-background/50 p-4 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground mb-2">Tu código de referido:</p>
                  <p className="text-2xl font-bold font-mono tracking-widest text-primary">
                    {codigoReferido}
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-3"
                    onClick={() => {
                      navigator.clipboard.writeText(codigoReferido);
                      toast.success('¡Código copiado!');
                    }}
                  >
                    Copiar Código
                  </Button>
                </div>
              ) : (
                <Button onClick={generarCodigoReferido} className="w-full">
                  Generar Mi Código de Referido
                </Button>
              )}
              
              <div className="grid sm:grid-cols-3 gap-4 pt-4">
                <div className="text-center">
                  <Trophy className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
                  <p className="font-semibold">Cupones Exclusivos</p>
                </div>
                <div className="text-center">
                  <Star className="w-8 h-8 mx-auto text-orange-500 mb-2" />
                  <p className="font-semibold">Crédito Extra</p>
                </div>
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
                  <p className="font-semibold">Acceso VIP</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mis Cupones Canjeados */}
          {cuponesCanjeados.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-6 h-6" />
                  Mis Cupones Canjeados ({cuponesCanjeados.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cuponesCanjeados.map((cupon) => (
                    <TarjetaCanjeada key={cupon.id} cupon={cupon} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cómo obtener cupones */}
          <Card>
            <CardHeader>
              <CardTitle>¿Cómo obtener cupones?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Compras Frecuentes</h4>
                    <p className="text-sm text-muted-foreground">
                      Los clientes activos reciben cupones especiales en cada compra
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Programa de Referidos</h4>
                    <p className="text-sm text-muted-foreground">
                      Invita amigos y gana recompensas cuando realicen compras
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Redes Sociales</h4>
                    <p className="text-sm text-muted-foreground">
                      Síguenos en Instagram y participa en sorteos exclusivos
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary">4</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Eventos Especiales</h4>
                    <p className="text-sm text-muted-foreground">
                      Promociones en fechas especiales como Black Friday, Navidad y más
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Animación de Canje */}
      {mostrarAnimacion && tarjetaGanada && (
        <AnimacionCanje 
          tarjeta={tarjetaGanada}
          onClose={() => {
            setMostrarAnimacion(false);
            setTarjetaGanada(null);
          }}
        />
      )}

      <Footer />
    </>
  );
}
