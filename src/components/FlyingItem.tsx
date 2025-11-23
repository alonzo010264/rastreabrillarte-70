import { useEffect, useState } from 'react';
import { Heart, ShoppingCart } from 'lucide-react';

interface FlyingItemProps {
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
  type: 'cart' | 'favorite';
  onComplete: () => void;
}

export const FlyingItem = ({ startPosition, endPosition, type, onComplete }: FlyingItemProps) => {
  const [position, setPosition] = useState(startPosition);
  const [scale, setScale] = useState(1);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const duration = 800;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuad = (t: number) => t * (2 - t);
      const easedProgress = easeOutQuad(progress);

      // Calculate current position
      const currentX = startPosition.x + (endPosition.x - startPosition.x) * easedProgress;
      const currentY = startPosition.y + (endPosition.y - startPosition.y) * easedProgress;

      // Create parabolic curve
      const heightBonus = Math.sin(progress * Math.PI) * -100;

      setPosition({ x: currentX, y: currentY + heightBonus });
      setScale(1 - progress * 0.5);
      setOpacity(1 - progress * 0.3);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };

    animate();
  }, [startPosition, endPosition, onComplete]);

  const Icon = type === 'cart' ? ShoppingCart : Heart;

  return (
    <div
      className="fixed pointer-events-none z-[9999]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity,
        transition: 'none'
      }}
    >
      <div className={`${type === 'cart' ? 'bg-primary' : 'bg-destructive'} rounded-full p-3 shadow-lg`}>
        <Icon className="w-6 h-6 text-white" fill="white" />
      </div>
    </div>
  );
};
