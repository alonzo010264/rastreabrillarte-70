import { useEffect, useState } from "react";
import { Clock, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface OfferCountdownProps {
  endDate: string;
  offerCode: string;
}

export const OfferCountdown = ({ endDate, offerCode }: OfferCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endDate).getTime() - new Date().getTime();
      
      if (difference <= 0) {
        setIsExpired(true);
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  if (isExpired) return null;

  return (
    <div className="bg-muted border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2 text-primary">
        <Clock className="w-4 h-4 animate-pulse" />
        <span className="text-sm font-medium">Oferta termina en:</span>
      </div>
      
      <div className="flex gap-2 justify-center">
        {timeLeft.days > 0 && (
          <div className="bg-primary text-primary-foreground rounded px-2 py-1 text-center min-w-[40px]">
            <div className="text-lg font-bold">{timeLeft.days}</div>
            <div className="text-[10px] uppercase">días</div>
          </div>
        )}
        <div className="bg-primary text-primary-foreground rounded px-2 py-1 text-center min-w-[40px]">
          <div className="text-lg font-bold">{String(timeLeft.hours).padStart(2, '0')}</div>
          <div className="text-[10px] uppercase">hrs</div>
        </div>
        <div className="bg-primary text-primary-foreground rounded px-2 py-1 text-center min-w-[40px]">
          <div className="text-lg font-bold">{String(timeLeft.minutes).padStart(2, '0')}</div>
          <div className="text-[10px] uppercase">min</div>
        </div>
        <div className="bg-primary text-primary-foreground rounded px-2 py-1 text-center min-w-[40px]">
          <div className="text-lg font-bold">{String(timeLeft.seconds).padStart(2, '0')}</div>
          <div className="text-[10px] uppercase">seg</div>
        </div>
      </div>

      {offerCode && (
        <div className="flex items-center justify-center gap-2 pt-1">
          <Tag className="w-3 h-3 text-primary" />
          <Badge variant="outline" className="border-primary text-primary font-mono text-xs">
            {offerCode}
          </Badge>
        </div>
      )}
    </div>
  );
};
