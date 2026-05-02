import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

/**
 * A small star that subtly follows the user's scroll position down the right edge.
 * Pointer-events: none so it never blocks content. Hidden on small screens to
 * preserve performance on phones/tablets.
 */
const FollowingStar = () => {
  const [y, setY] = useState(0);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const ratio = max > 0 ? window.scrollY / max : 0;
        // keep within 10% - 85% of viewport so it doesn't cover header/footer
        setY(0.1 + ratio * 0.75);
        raf = 0;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="hidden md:block fixed right-4 z-[5] pointer-events-none transition-all duration-500 ease-out"
      style={{ top: `${y * 100}vh` }}
    >
      <Sparkles className="w-6 h-6 text-foreground/30 animate-float drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]" />
    </div>
  );
};

export default FollowingStar;
