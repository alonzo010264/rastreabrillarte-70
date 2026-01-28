import { useState } from "react";
import { CreditCard, Gift, Ticket, Star, Sparkles } from "lucide-react";

interface TarjetaPreview3DProps {
  tarjeta: {
    tipo: string;
    monto?: number;
    porcentaje_descuento?: number | null;
    titulo: string;
    descripcion?: string;
    color_primario: string;
    color_secundario: string;
    texto_frontal: string;
    texto_trasero?: string;
  };
  large?: boolean;
}

export function TarjetaPreview3D({ tarjeta, large = false }: TarjetaPreview3DProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  
  const sizeClass = large ? "w-80 h-48" : "w-72 h-44";

  const getIcon = () => {
    switch (tarjeta.tipo) {
      case 'cupon':
        return <Ticket className="w-8 h-8" />;
      case 'credito':
      case 'saldo':
        return <CreditCard className="w-8 h-8" />;
      default:
        return <Gift className="w-8 h-8" />;
    }
  };

  const getValue = () => {
    if (tarjeta.tipo === 'cupon') {
      return `${tarjeta.porcentaje_descuento || 0}% OFF`;
    }
    return `RD$${(tarjeta.monto || 0).toLocaleString()}`;
  };

  return (
    <div 
      className={`${sizeClass} cursor-pointer mx-auto`}
      style={{ perspective: '1000px' }}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div 
        className="relative w-full h-full transition-transform duration-700"
        style={{ 
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        {/* Frente */}
        <div 
          className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl"
          style={{ 
            backfaceVisibility: 'hidden',
            background: `linear-gradient(135deg, ${tarjeta.color_primario} 0%, ${tarjeta.color_secundario} 100%)`,
            boxShadow: `0 20px 60px -10px ${tarjeta.color_primario}80, 0 10px 30px -5px ${tarjeta.color_secundario}40`
          }}
        >
          <div className="p-5 h-full flex flex-col justify-between text-white relative overflow-hidden">
            {/* Decoración */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-black/10 blur-xl" />
            
            {/* Header */}
            <div className="flex justify-between items-start relative z-10">
              {getIcon()}
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <Star 
                    key={i} 
                    className="w-3 h-3 text-white/50" 
                    fill="currentColor"
                  />
                ))}
              </div>
            </div>
            
            {/* Content */}
            <div className="relative z-10">
              <p className="text-xs opacity-70 mb-1">{tarjeta.texto_frontal}</p>
              <h3 className="text-3xl font-bold">{getValue()}</h3>
              <p className="text-sm opacity-80 mt-1">{tarjeta.titulo}</p>
            </div>
            
            {/* Footer */}
            <div className="flex items-center gap-2 relative z-10">
              <Sparkles className="w-4 h-4 opacity-70" />
              <span className="text-xs opacity-70">BRILLARTE Premium</span>
            </div>
            
            {/* Shine effect */}
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
              style={{
                animation: 'shine 3s ease-in-out infinite'
              }}
            />
          </div>
        </div>
        
        {/* Reverso */}
        <div 
          className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl"
          style={{ 
            backfaceVisibility: 'hidden',
            background: `linear-gradient(135deg, ${tarjeta.color_secundario} 0%, ${tarjeta.color_primario} 100%)`,
            transform: 'rotateY(180deg)',
            boxShadow: `0 20px 60px -10px ${tarjeta.color_secundario}80`
          }}
        >
          <div className="p-5 h-full flex flex-col justify-between text-white relative overflow-hidden">
            {/* Decoración */}
            <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
            
            {/* Banda magnética simulada */}
            <div className="absolute top-8 left-0 right-0 h-10 bg-black/30" />
            
            {/* Contenido */}
            <div className="mt-16 relative z-10">
              <p className="text-sm opacity-90 text-center leading-relaxed">
                {tarjeta.texto_trasero || tarjeta.descripcion || 'Gracias por ser parte de BRILLARTE. Tu satisfacción es nuestra prioridad.'}
              </p>
            </div>
            
            <div className="relative z-10 text-center">
              <p className="text-xs opacity-50">BRILLARTE © 2024</p>
              <p className="text-xs opacity-50">Válido según términos y condiciones</p>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes shine {
          0% { transform: translateX(-200%); }
          50% { transform: translateX(200%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
