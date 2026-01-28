import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, CreditCard, Ticket, Calendar, Check } from "lucide-react";

interface TarjetaCanjeadaProps {
  cupon: {
    id: string;
    tarjeta_id: string;
    valor_obtenido: number;
    tipo: string;
    created_at: string;
    usado: boolean;
    tarjetas_regalo?: {
      titulo?: string;
      descripcion?: string;
      color_primario?: string;
      color_secundario?: string;
      texto_frontal?: string;
      texto_trasero?: string;
      porcentaje_descuento?: number;
      monto?: number;
    };
  };
}

export function TarjetaCanjeada({ cupon }: TarjetaCanjeadaProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  
  const tarjeta = cupon.tarjetas_regalo;
  const colorPrimario = tarjeta?.color_primario || '#000000';
  const colorSecundario = tarjeta?.color_secundario || '#FFD700';

  const getIcon = () => {
    switch (cupon.tipo) {
      case 'cupon':
        return <Ticket className="w-8 h-8" />;
      case 'credito':
      case 'saldo':
        return <CreditCard className="w-8 h-8" />;
      default:
        return <Gift className="w-8 h-8" />;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-DO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div 
      className="perspective-1000 cursor-pointer group"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div 
        className={`relative w-full h-48 transition-transform duration-700 transform-style-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Frente de la tarjeta */}
        <Card 
          className="absolute inset-0 backface-hidden overflow-hidden"
          style={{ 
            background: `linear-gradient(135deg, ${colorPrimario} 0%, ${colorSecundario} 100%)`,
            backfaceVisibility: 'hidden'
          }}
        >
          <div className="p-4 h-full flex flex-col justify-between text-white">
            <div className="flex justify-between items-start">
              {getIcon()}
              <Badge 
                variant={cupon.usado ? "secondary" : "default"}
                className={cupon.usado ? "bg-white/20" : "bg-white text-black"}
              >
                {cupon.usado ? "Usado" : "Activo"}
              </Badge>
            </div>
            
            <div>
              <p className="text-xs opacity-70 mb-1">
                {tarjeta?.texto_frontal || 'BRILLARTE'}
              </p>
              <h3 className="text-xl font-bold">
                {cupon.tipo === 'cupon' 
                  ? `${cupon.valor_obtenido}% DESC`
                  : `RD$${cupon.valor_obtenido.toLocaleString()}`
                }
              </h3>
              <p className="text-sm opacity-80 mt-1">
                {tarjeta?.titulo || 'Cupón BRILLARTE'}
              </p>
            </div>
            
            <div className="flex items-center text-xs opacity-70">
              <Calendar className="w-3 h-3 mr-1" />
              {formatDate(cupon.created_at)}
            </div>
          </div>
          
          {/* Efecto 3D */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
        </Card>
        
        {/* Reverso de la tarjeta */}
        <Card 
          className="absolute inset-0 backface-hidden overflow-hidden rotate-y-180"
          style={{ 
            background: `linear-gradient(135deg, ${colorSecundario} 0%, ${colorPrimario} 100%)`,
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <div className="p-4 h-full flex flex-col justify-between text-white">
            <div className="text-center">
              <p className="text-xs opacity-70 mb-2">Detalles del cupón</p>
              <p className="text-sm">
                {tarjeta?.descripcion || tarjeta?.texto_trasero || 'Gracias por ser parte de BRILLARTE'}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="opacity-70">Tipo:</span>
                <span className="font-semibold capitalize">{cupon.tipo}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="opacity-70">Valor:</span>
                <span className="font-semibold">
                  {cupon.tipo === 'cupon' 
                    ? `${cupon.valor_obtenido}%`
                    : `RD$${cupon.valor_obtenido.toLocaleString()}`
                  }
                </span>
              </div>
              {cupon.usado && (
                <div className="flex items-center justify-center gap-1 text-sm bg-white/20 rounded-full py-1">
                  <Check className="w-4 h-4" />
                  <span>Ya utilizado</span>
                </div>
              )}
            </div>
            
            <p className="text-center text-xs opacity-50">
              Toca para voltear
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
