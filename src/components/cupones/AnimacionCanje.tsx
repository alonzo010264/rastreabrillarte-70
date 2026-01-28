import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Gift, X, PartyPopper, Star } from "lucide-react";
import confetti from "canvas-confetti";

interface AnimacionCanjeProps {
  tarjeta: {
    tipo?: string;
    monto?: number;
    porcentaje_descuento?: number;
    titulo?: string;
    color_primario?: string;
    color_secundario?: string;
    texto_frontal?: string;
  };
  onClose: () => void;
}

export function AnimacionCanje({ tarjeta, onClose }: AnimacionCanjeProps) {
  const [step, setStep] = useState(0);
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    // Animación secuencial
    const timer1 = setTimeout(() => setStep(1), 500);
    const timer2 = setTimeout(() => setStep(2), 1500);
    const timer3 = setTimeout(() => {
      setStep(3);
      setShowCard(true);
      // Lanzar confetti
      launchConfetti();
    }, 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const launchConfetti = () => {
    // Confetti desde ambos lados
    const defaults = {
      spread: 360,
      ticks: 100,
      gravity: 0.5,
      decay: 0.94,
      startVelocity: 30,
      colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']
    };

    confetti({
      ...defaults,
      particleCount: 100,
      origin: { x: 0.3, y: 0.7 }
    });

    confetti({
      ...defaults,
      particleCount: 100,
      origin: { x: 0.7, y: 0.7 }
    });

    // Estrellas
    setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 100,
        origin: { x: 0.5, y: 0.5 },
        shapes: ['star'],
        colors: ['#FFD700', '#FFA500']
      });
    }, 300);
  };

  const colorPrimario = tarjeta.color_primario || '#000000';
  const colorSecundario = tarjeta.color_secundario || '#FFD700';
  
  const getTipoTexto = () => {
    switch (tarjeta.tipo) {
      case 'cupon':
        return `¡${tarjeta.porcentaje_descuento || tarjeta.monto}% de Descuento!`;
      case 'credito':
      case 'saldo':
        return `¡RD$${(tarjeta.monto || 0).toLocaleString()} de Crédito!`;
      default:
        return '¡Premio Especial!';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {/* Botón cerrar */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-4 right-4 text-white hover:bg-white/20"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </Button>

      <div className="text-center space-y-8">
        {/* Paso 1: Abriendo */}
        {step >= 0 && (
          <div className={`transition-all duration-500 ${step >= 1 ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`}>
            <div className="relative">
              <Gift className="w-24 h-24 text-primary mx-auto animate-bounce" />
              <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400 animate-pulse" />
            </div>
            <p className="text-white text-xl mt-4">Abriendo tu regalo...</p>
          </div>
        )}

        {/* Paso 2: Procesando */}
        {step >= 1 && step < 3 && (
          <div className={`transition-all duration-500 ${step >= 2 ? 'scale-110' : 'scale-100'}`}>
            <div className="flex items-center justify-center gap-2">
              {[0, 1, 2].map((i) => (
                <div 
                  key={i}
                  className="w-4 h-4 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <p className="text-white text-xl mt-4">Verificando código...</p>
          </div>
        )}

        {/* Paso 3: Resultado */}
        {step >= 3 && (
          <div className="animate-scale-in space-y-6">
            <div className="flex items-center justify-center gap-3">
              <PartyPopper className="w-12 h-12 text-yellow-400 animate-bounce" />
              <h1 className="text-4xl font-bold text-white">¡FELICIDADES!</h1>
              <PartyPopper className="w-12 h-12 text-yellow-400 animate-bounce" style={{ transform: 'scaleX(-1)' }} />
            </div>
            
            <p className="text-2xl text-primary font-bold">{getTipoTexto()}</p>

            {/* Tarjeta 3D animada */}
            {showCard && (
              <div 
                className="relative w-72 h-44 mx-auto mt-8 animate-fade-in"
                style={{
                  perspective: '1000px',
                  animation: 'cardEntrance 0.8s ease-out forwards'
                }}
              >
                <div 
                  className="w-full h-full rounded-2xl shadow-2xl overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${colorPrimario} 0%, ${colorSecundario} 100%)`,
                    transform: 'rotateY(-5deg) rotateX(5deg)',
                    boxShadow: `0 20px 60px -10px ${colorPrimario}80`
                  }}
                >
                  <div className="p-6 h-full flex flex-col justify-between text-white relative">
                    {/* Decoración */}
                    <div className="absolute top-2 right-2 flex gap-1">
                      {[...Array(3)].map((_, i) => (
                        <Star 
                          key={i} 
                          className="w-4 h-4 text-white/50 animate-pulse" 
                          style={{ animationDelay: `${i * 0.2}s` }}
                          fill="currentColor"
                        />
                      ))}
                    </div>
                    
                    <div>
                      <p className="text-xs opacity-70">
                        {tarjeta.texto_frontal || 'BRILLARTE PREMIUM'}
                      </p>
                      <h3 className="text-3xl font-bold mt-2">
                        {tarjeta.tipo === 'cupon' 
                          ? `${tarjeta.porcentaje_descuento || tarjeta.monto}% OFF`
                          : `RD$${(tarjeta.monto || 0).toLocaleString()}`
                        }
                      </h3>
                    </div>
                    
                    <div>
                      <p className="text-sm opacity-80">
                        {tarjeta.titulo || 'Cupón BRILLARTE'}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-xs">Agregado a tu cuenta</span>
                      </div>
                    </div>
                    
                    {/* Efecto brillo */}
                    <div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      style={{
                        animation: 'shine 2s ease-in-out infinite'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            <Button 
              onClick={onClose} 
              size="lg"
              className="mt-8 bg-primary hover:bg-primary/90"
            >
              ¡Genial! Continuar
            </Button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes cardEntrance {
          0% {
            opacity: 0;
            transform: scale(0.5) rotateY(180deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotateY(0);
          }
        }
        
        @keyframes shine {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(100%); }
        }
        
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        
        .backface-hidden {
          backface-visibility: hidden;
        }
        
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
}
