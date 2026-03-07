import { Card } from "@/components/ui/card";
import { Clock, Truck, Phone, ShieldAlert, Instagram, MessageCircle, MapPin, Mail } from "lucide-react";

const AttentionHours = () => {
  return (
    <div className="space-y-6">
      {/* Horarios de Atención */}
      <Card className="bg-background rounded-2xl shadow-sm p-6 border border-border hover:shadow-md transition-all duration-300">
        <div className="flex items-center mb-4">
          <Clock className="text-foreground mr-3" size={20} />
          <h3 className="text-lg font-medium text-foreground">Horarios de Atención</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex flex-col space-y-1">
            <span className="font-medium text-foreground text-sm">Lunes a Viernes</span>
            <span className="text-muted-foreground text-sm">7:00 AM - 6:00 PM</span>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="font-medium text-foreground text-sm">Sábados y Domingos</span>
            <span className="text-muted-foreground text-sm">1:00 PM - 6:00 PM</span>
          </div>
        </div>
      </Card>

      {/* Envíos y Retiros */}
      <Card className="bg-background rounded-2xl shadow-sm p-6 border border-border hover:shadow-md transition-all duration-300">
        <div className="flex items-center mb-4">
          <Truck className="text-foreground mr-3" size={20} />
          <h3 className="text-lg font-medium text-foreground">Envíos y Retiros</h3>
        </div>
        
        <div className="text-sm text-muted-foreground space-y-2">
          <p className="flex items-center">
            <Truck className="text-foreground mr-2" size={14} />
            <span><strong className="text-foreground">Envíos desde $500 pesos dominicanos</strong>Envíos desde $200 pesos dominicanos</span>
          </p>
          <p className="flex items-center">
            <MapPin className="text-foreground mr-2" size={14} />
            <span><strong className="text-foreground">Retiro en tienda</strong> - Disponible en nuestra dirección</span>
          </p>
        </div>
      </Card>

      {/* Contacto */}
      <Card className="bg-background rounded-2xl shadow-sm p-6 border border-border hover:shadow-md transition-all duration-300">
        <div className="flex items-center mb-4">
          <Phone className="text-foreground mr-3" size={20} />
          <h3 className="text-lg font-medium text-foreground">Contacto</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center">
            <Instagram className="text-foreground mr-3" size={16} />
            <span className="text-sm text-muted-foreground">Instagram Oficial</span>
          </div>
          <div className="flex items-center">
            <MessageCircle className="text-foreground mr-3" size={16} />
            <span className="text-sm text-muted-foreground">WhatsApp: 849-425-2220</span>
          </div>
          <div className="flex items-center">
            <Mail className="text-foreground mr-3" size={16} />
            <span className="text-sm text-muted-foreground">brillarte.oficial.ventas@gmail.com</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Puedes consultar el estatus por estos medios
          </p>
        </div>
      </Card>

      {/* Importante */}
      <Card className="bg-muted rounded-2xl shadow-sm p-6 border border-border hover:shadow-md transition-all duration-300">
        <h3 className="text-lg font-medium text-foreground mb-3 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5" />
          Importante
        </h3>
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Nunca compartas</strong> tu código de pedido con otras personas por tu seguridad.
        </p>
      </Card>
    </div>);

};

export default AttentionHours;