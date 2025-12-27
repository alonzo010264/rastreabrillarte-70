import { useEffect, useState } from "react";
import { Check } from "lucide-react";

interface PaymentSuccessAnimationProps {
  onComplete?: () => void;
}

export const PaymentSuccessAnimation = ({ onComplete }: PaymentSuccessAnimationProps) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="text-center animate-fade-in">
        {/* Círculo animado con checkmark */}
        <div className="relative mb-6">
          <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center animate-scale-up">
            <div className="w-28 h-28 rounded-full bg-background flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center animate-bounce-once">
                <Check className="w-14 h-14 text-white stroke-[3]" />
              </div>
            </div>
          </div>
          
          {/* Partículas decorativas */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 rounded-full bg-pink-400 animate-particle"
                style={{
                  left: '50%',
                  top: '50%',
                  animationDelay: `${i * 0.1}s`,
                  transform: `rotate(${i * 45}deg) translateY(-60px)`
                }}
              />
            ))}
          </div>
        </div>

        <h2 className="text-3xl font-bold text-foreground mb-2 animate-fade-in-up">
          ¡Pago Exitoso!
        </h2>
        <p className="text-muted-foreground text-lg animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          Tu pedido ha sido procesado correctamente
        </p>
      </div>

      <style>{`
        @keyframes scale-up {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes bounce-once {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes particle {
          0% { opacity: 1; transform: rotate(var(--rotation)) translateY(-60px) scale(1); }
          100% { opacity: 0; transform: rotate(var(--rotation)) translateY(-100px) scale(0); }
        }
        
        .animate-scale-up {
          animation: scale-up 0.5s ease-out forwards;
        }
        
        .animate-bounce-once {
          animation: bounce-once 0.6s ease-in-out 0.3s;
        }
        
        .animate-fade-in-up {
          opacity: 0;
          animation: fade-in-up 0.5s ease-out 0.4s forwards;
        }
        
        .animate-particle {
          animation: particle 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
};