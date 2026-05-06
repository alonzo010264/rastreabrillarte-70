import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import margarita from "@/assets/productos/margarita.jpg";
import aretes from "@/assets/productos/aretes-flores.webp";
import pulseras from "@/assets/productos/pulseras-mariposas.webp";
import floresCrochetRojas from "@/assets/productos/flores-crochet-rojas-optimized.webp";
import bouquetCrochetColores from "@/assets/productos/bouquet-crochet-optimized.webp";
import aretesMargaritas from "@/assets/productos/aretes-margaritas-optimized.webp";
import anilloFloresAzul from "@/assets/productos/anillo-flores-azul.jpg";
import pulserasCorazones from "@/assets/productos/pulseras-corazones.jpg";
import pulserasLoveYou from "@/assets/productos/pulseras-love-you.jpg";
import pulserasCristal from "@/assets/productos/pulseras-cristal-colores.png";
import pulseraGirasol from "@/assets/productos/pulsera-girasol-dorada.png";
import pulseraMacrame from "@/assets/productos/pulsera-macrame-girasoles.png";

const slides = [
  { name: "Pulsera Margarita", image: margarita },
  { name: "Aretes de Flores", image: aretes },
  { name: "Pulseras Mariposas", image: pulseras },
  { name: "Flores Crochet", image: floresCrochetRojas },
  { name: "Bouquet Crochet", image: bouquetCrochetColores },
  { name: "Aretes Margaritas", image: aretesMargaritas },
  { name: "Anillo Flores Azul", image: anilloFloresAzul },
  { name: "Pulseras Corazones", image: pulserasCorazones },
  { name: "Pulseras Love You", image: pulserasLoveYou },
  { name: "Pulseras Cristal", image: pulserasCristal },
  { name: "Pulsera Girasol", image: pulseraGirasol },
  { name: "Pulsera Macramé", image: pulseraMacrame },
];

const ProductCarousel = () => {
  const { ref, isVisible } = useScrollAnimation(0.1);
  // Duplicate for seamless infinite loop
  const loop = [...slides, ...slides];

  return (
    <section className="py-20 bg-background relative overflow-hidden border-y border-foreground/10">
      <div ref={ref} className={`container mx-auto max-w-6xl px-4 mb-10 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">Colección destacada</p>
          <h2 className="text-4xl md:text-5xl font-light text-foreground font-display">
            <span className="block">Nuestros</span>
            <span className="font-script italic text-3xl md:text-4xl text-muted-foreground">productos favoritos</span>
          </h2>
        </div>
      </div>

      <div className="relative">
        {/* Edge fade */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />

        <div className="flex gap-6 animate-marquee hover:[animation-play-state:paused] w-max">
          {loop.map((s, i) => (
            <div
              key={i}
              className="group relative w-56 md:w-64 shrink-0 rounded-2xl overflow-hidden border border-foreground/10 bg-foreground/[0.02]"
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={s.image}
                  alt={s.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/80 to-transparent p-4">
                <h3 className="font-display text-base text-foreground truncate">{s.name}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductCarousel;
