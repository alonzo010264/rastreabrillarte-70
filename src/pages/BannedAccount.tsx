import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Mail, LogOut } from "lucide-react";
import banLogo from "@/assets/brillarte-ban-logo.jpg";

interface BanInfo {
  razon: string;
  duracion_tipo: string;
  fecha_fin: string | null;
}

const BannedAccount = () => {
  const navigate = useNavigate();
  const [banInfo, setBanInfo] = useState<BanInfo | null>(null);

  useEffect(() => {
    loadBanInfo();
  }, []);

  const loadBanInfo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data } = await supabase
      .from('user_bans')
      .select('razon, duracion_tipo, fecha_fin')
      .eq('user_id', user.id)
      .eq('activo', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) {
      navigate('/cuenta');
      return;
    }

    setBanInfo(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleAppeal = () => {
    navigate('/apelar-baneo');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-24 h-24 rounded-full overflow-hidden border-4 border-destructive">
            <img src={banLogo} alt="BRILLARTE" className="w-full h-full object-cover" />
          </div>
          <div className="flex items-center justify-center gap-2 text-destructive">
            <AlertTriangle className="h-6 w-6" />
            <CardTitle className="text-2xl">Cuenta Suspendida</CardTitle>
          </div>
          <CardDescription>
            Tu acceso a BRILLARTE ha sido restringido
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {banInfo && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Razón de la suspensión:</p>
                <p className="text-foreground font-medium">{banInfo.razon}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tipo de suspensión:</p>
                <p className="text-foreground font-medium">
                  {banInfo.duracion_tipo === 'permanente' 
                    ? 'Permanente' 
                    : `Temporal - hasta ${banInfo.fecha_fin ? new Date(banInfo.fecha_fin).toLocaleDateString('es-MX', { 
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'N/A'}`
                  }
                </p>
              </div>
            </div>
          )}

          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Si crees que esto es un error o deseas apelar esta decisión, 
              por favor contacta a nuestro equipo de soporte.
            </p>
          </div>

          <div className="space-y-3">
            <Button className="w-full gap-2" onClick={handleAppeal}>
              Apelar Suspension
            </Button>
            
            <Button variant="outline" className="w-full gap-2" asChild>
              <a href="mailto:soporte@brillarte.lat">
                <Mail className="h-4 w-4" />
                Contactar Soporte
              </a>
            </Button>
            
            <Button variant="ghost" className="w-full gap-2" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Cerrar Sesion
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              BRILLARTE se reserva el derecho de suspender cuentas que violen 
              nuestros términos de servicio y políticas de la comunidad.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BannedAccount;